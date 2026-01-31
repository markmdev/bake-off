/**
 * Update seeded bakeoffs to "closed" status with agent submissions
 * 
 * Run with: MONGODB_URI="..." npx tsx scripts/seed-completed-bakeoffs.ts
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  supabaseId: String,
  email: String,
  displayName: String,
  stripeCustomerId: String,
}, { timestamps: true });

const agentSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  apiKeyHash: String,
  status: String,
  stats: {
    tasksAttempted: Number,
    tasksWon: Number,
    totalEarnings: Number,
  },
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  posterId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  attachments: [{ filename: String, url: String, mimeType: String, sizeBytes: Number }],
  bounty: Number,
  status: String,
  deadline: Date,
  stripeCheckoutSessionId: String,
  winnerId: mongoose.Schema.Types.ObjectId,
  publishedAt: Date,
  closedAt: Date,
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  taskId: mongoose.Schema.Types.ObjectId,
  agentId: mongoose.Schema.Types.ObjectId,
  submissionType: String,
  submissionUrl: String,
  submittedAt: Date,
  isWinner: Boolean,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

// Demo agent names
const AGENT_NAMES = [
  { name: 'CodeBot Pro', desc: 'Expert coder and problem solver' },
  { name: 'DataWizard', desc: 'Data analysis and processing specialist' },
  { name: 'ContentCraft', desc: 'Content writing and marketing expert' },
  { name: 'DesignMind', desc: 'UI/UX and visual design specialist' },
  { name: 'ResearchBot', desc: 'Deep research and analysis agent' },
  { name: 'DocuHelper', desc: 'Documentation and technical writing' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Find or create demo agent owner
  let agentOwner = await User.findOne({ supabaseId: 'demo_agent_owner_001' });
  if (!agentOwner) {
    agentOwner = await User.create({
      supabaseId: 'demo_agent_owner_001',
      email: 'demo-agent-owner@bake-off.example',
      displayName: 'Demo Agent Owner',
      stripeCustomerId: 'cus_demo_agent_owner_001',
    });
    console.log('Created demo agent owner');
  }

  // Create demo agents if needed
  let agents = await Agent.find({ ownerId: agentOwner._id });
  if (agents.length < AGENT_NAMES.length) {
    await Agent.deleteMany({ ownerId: agentOwner._id });
    agents = await Agent.insertMany(
      AGENT_NAMES.map((a, i) => ({
        ownerId: agentOwner._id,
        name: a.name,
        description: a.desc,
        apiKeyHash: `demo_hash_${a.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${i}`,
        status: 'active',
        stats: {
          tasksAttempted: Math.floor(Math.random() * 20) + 5,
          tasksWon: Math.floor(Math.random() * 10),
          totalEarnings: Math.floor(Math.random() * 50000),
        },
      }))
    );
    console.log(`Created ${agents.length} demo agents`);
  }

  // Get all open tasks
  const tasks = await Task.find({ status: 'open' });
  console.log(`Found ${tasks.length} open tasks to update`);

  // Delete existing submissions for these tasks
  const taskIds = tasks.map(t => t._id);
  await Submission.deleteMany({ taskId: { $in: taskIds } });
  console.log('Cleared existing submissions');

  const now = new Date();
  let closedCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    // Vary: some stay open (20%), most get closed (80%)
    if (Math.random() < 0.2) {
      console.log(`  Keeping open: ${task.title}`);
      continue;
    }

    // Random number of submissions (2-5)
    const numSubmissions = Math.floor(Math.random() * 4) + 2;
    const shuffledAgents = [...agents].sort(() => Math.random() - 0.5).slice(0, numSubmissions);
    
    // Create submissions
    const submissions = [];
    for (let j = 0; j < shuffledAgents.length; j++) {
      const agent = shuffledAgents[j];
      const hoursAgo = Math.floor(Math.random() * 48) + 1;
      
      submissions.push({
        taskId: task._id,
        agentId: agent._id,
        submissionType: ['github', 'zip', 'deployed_url'][Math.floor(Math.random() * 3)],
        submissionUrl: `https://example.com/submissions/${task._id}/${agent._id}`,
        submittedAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
        isWinner: j === 0, // First agent wins
      });
    }

    const createdSubmissions = await Submission.insertMany(submissions);
    const winnerSubmission = createdSubmissions[0];

    // Update task to closed
    await Task.updateOne(
      { _id: task._id },
      {
        status: 'closed',
        winnerId: winnerSubmission._id,
        closedAt: new Date(now.getTime() - Math.floor(Math.random() * 24) * 60 * 60 * 1000),
      }
    );

    closedCount++;
    console.log(`  Closed: ${task.title} (${numSubmissions} submissions, winner: ${shuffledAgents[0].name})`);
  }

  console.log(`\n✅ Done!`);
  console.log(`  Closed tasks: ${closedCount}`);
  console.log(`  Open tasks: ${tasks.length - closedCount}`);
  console.log(`  Demo agents: ${agents.length}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
