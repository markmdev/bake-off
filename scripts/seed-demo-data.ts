import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

// Task templates for realistic demo data
const taskTemplates = [
  {
    title: 'Build a URL shortener API',
    description: `## Overview
Build a simple URL shortener REST API in Node.js/Express.

## Requirements

### Core Endpoints
- \`POST /shorten\` - Accept a long URL, return a short code
- \`GET /:code\` - Redirect to the original URL
- \`GET /stats/:code\` - Return click count for a short URL

### Technical Requirements
- Use any data store (in-memory is fine for MVP)
- Short codes should be 6-8 characters, alphanumeric
- Handle invalid URLs gracefully
- Include basic input validation

## Deliverable
GitHub repo with working API and README with setup instructions.`,
    bounty: 2500,
  },
  {
    title: 'Create a markdown-to-HTML converter CLI',
    description: `## Overview
Build a command-line tool that converts Markdown files to HTML.

## Requirements
- Accept input file path as argument
- Output HTML to stdout or file (--output flag)
- Support common Markdown: headers, bold, italic, links, code blocks, lists
- Handle errors gracefully (file not found, invalid markdown)

## Bonus
- Syntax highlighting for code blocks
- Custom CSS template option

## Deliverable
npm package that can be installed globally.`,
    bounty: 1500,
  },
  {
    title: 'Build a real-time chat widget',
    description: `## Overview
Create an embeddable chat widget for websites using WebSockets.

## Requirements
- Vanilla JS widget (no framework dependencies)
- WebSocket server in Node.js
- Support multiple chat rooms
- Show online user count
- Message history (last 50 messages)

## Deliverable
- Widget JS file that can be embedded via script tag
- Server code with deployment instructions`,
    bounty: 5000,
  },
  {
    title: 'CSV to JSON converter with schema validation',
    description: `## Overview
Build a Node.js library that converts CSV files to JSON with optional schema validation.

## Requirements
- Parse CSV files with proper handling of quotes, escapes, newlines
- Configurable delimiter (comma, tab, semicolon)
- Schema validation using JSON Schema
- Streaming support for large files
- TypeScript types included

## Deliverable
Published npm package with documentation.`,
    bounty: 3000,
  },
  {
    title: 'Build a simple expense tracker API',
    description: `## Overview
Create a REST API for tracking personal expenses.

## Endpoints
- \`POST /expenses\` - Create expense (amount, category, date, description)
- \`GET /expenses\` - List expenses with filtering by date range and category
- \`GET /expenses/summary\` - Monthly/weekly summary by category
- \`DELETE /expenses/:id\` - Delete an expense

## Requirements
- SQLite database
- Input validation
- Proper error responses

## Deliverable
Docker container ready to deploy.`,
    bounty: 3500,
  },
  {
    title: 'Create a GitHub PR review summarizer',
    description: `## Overview
Build a CLI tool that summarizes GitHub PR changes using AI.

## Requirements
- Accept GitHub PR URL as input
- Fetch PR diff using GitHub API
- Summarize changes in plain English
- Group changes by file type/purpose
- Output as Markdown

## Deliverable
CLI tool with GitHub token configuration.`,
    bounty: 4000,
  },
  {
    title: 'Build a simple load testing tool',
    description: `## Overview
Create a CLI tool for basic HTTP load testing.

## Requirements
- Specify URL, method, headers, body
- Configure concurrent users and duration
- Report: requests/sec, latency percentiles (p50, p95, p99), errors
- Output results as JSON or pretty-print

## Example
\`\`\`bash
loadtest --url https://api.example.com/users --users 10 --duration 30s
\`\`\`

## Deliverable
Go or Rust binary with cross-platform builds.`,
    bounty: 4500,
  },
  {
    title: 'Create a webhook relay service',
    description: `## Overview
Build a service that receives webhooks and forwards them to multiple destinations.

## Requirements
- Register webhook endpoints
- Configure multiple destinations per endpoint
- Retry failed deliveries (exponential backoff)
- Log all deliveries with status
- Simple web UI to view delivery history

## Deliverable
Docker Compose setup with Postgres for storage.`,
    bounty: 6000,
  },
];

// Agent names for submissions
const agentNames = [
  'CodeBot Pro',
  'DevAssist AI',
  'Meridian',
  'AutoCoder X',
  'BuilderBot',
  'SwiftDev Agent',
  'CodeCraft AI',
  'TechForge',
];

async function seedDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Define schemas
  const userSchema = new mongoose.Schema(
    {
      supabaseId: String,
      email: String,
      displayName: String,
      stripeCustomerId: String,
    },
    { timestamps: true }
  );

  const agentSchema = new mongoose.Schema(
    {
      ownerId: mongoose.Schema.Types.ObjectId,
      name: String,
      description: String,
      apiKeyHash: String,
      status: { type: String, default: 'active' },
      stats: {
        tasksAttempted: { type: Number, default: 0 },
        tasksWon: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
      },
    },
    { timestamps: true }
  );

  const taskSchema = new mongoose.Schema(
    {
      posterId: mongoose.Schema.Types.ObjectId,
      title: String,
      description: String,
      attachments: { type: Array, default: [] },
      bounty: Number,
      status: String,
      deadline: Date,
      stripeCheckoutSessionId: String,
      winnerId: mongoose.Schema.Types.ObjectId,
      publishedAt: Date,
      closedAt: Date,
    },
    { timestamps: true }
  );

  const submissionSchema = new mongoose.Schema({
    taskId: mongoose.Schema.Types.ObjectId,
    agentId: mongoose.Schema.Types.ObjectId,
    submissionType: String,
    submissionUrl: String,
    submittedAt: { type: Date, default: Date.now },
    isWinner: { type: Boolean, default: false },
  });

  const taskAcceptanceSchema = new mongoose.Schema({
    taskId: mongoose.Schema.Types.ObjectId,
    agentId: mongoose.Schema.Types.ObjectId,
    acceptedAt: { type: Date, default: Date.now },
  });

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
  const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
  const Submission =
    mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
  const TaskAcceptance =
    mongoose.models.TaskAcceptance ||
    mongoose.model('TaskAcceptance', taskAcceptanceSchema);

  // Find or create the demo user
  let user = await User.findOne({ email: 'markmorgan+1@gmail.com' });
  if (!user) {
    console.log('Creating demo user...');
    user = await User.create({
      supabaseId: 'demo-user-' + Date.now(),
      email: 'markmorgan+1@gmail.com',
      displayName: 'Demo User',
      stripeCustomerId: 'cus_demo_' + Date.now(),
    });
  }
  console.log('Using user:', user._id, user.email);

  // Create demo agents (owned by the same user for simplicity)
  const agents: mongoose.Document[] = [];
  for (const name of agentNames) {
    let agent = await Agent.findOne({ name });
    if (!agent) {
      const apiKey = 'bk_demo_' + crypto.randomBytes(16).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      agent = await Agent.create({
        ownerId: user._id,
        name,
        description: `${name} - AI coding assistant`,
        apiKeyHash,
        status: 'active',
        stats: { tasksAttempted: 0, tasksWon: 0, totalEarnings: 0 },
      });
      console.log('Created agent:', name);
    }
    agents.push(agent);
  }

  // Create tasks with varying states
  const now = new Date();
  const tasksCreated: mongoose.Document[] = [];

  for (let i = 0; i < taskTemplates.length; i++) {
    const template = taskTemplates[i];

    // Check if task already exists
    const existing = await Task.findOne({ title: template.title });
    if (existing) {
      console.log('Task already exists:', template.title);
      tasksCreated.push(existing);
      continue;
    }

    // Vary the task states
    let status: string;
    let publishedAt: Date | null = null;
    let closedAt: Date | null = null;
    let deadline: Date;
    const daysAgo = Math.floor(Math.random() * 14) + 1;

    if (i < 3) {
      // First 3: closed (completed) tasks
      status = 'closed';
      publishedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      closedAt = new Date(
        publishedAt.getTime() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000
      );
      deadline = new Date(publishedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (i < 6) {
      // Next 3: open tasks (accepting submissions)
      status = 'open';
      publishedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Rest: open tasks with closer deadlines
      status = 'open';
      publishedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    const task = await Task.create({
      posterId: user._id,
      title: template.title,
      description: template.description,
      attachments: [],
      bounty: template.bounty,
      status,
      deadline,
      stripeCheckoutSessionId: 'cs_demo_' + Date.now() + '_' + i,
      winnerId: null,
      publishedAt,
      closedAt,
    });

    console.log('Created task:', task.title, `(${status})`);
    tasksCreated.push(task);
  }

  // Add submissions to tasks
  for (let i = 0; i < tasksCreated.length; i++) {
    const task = tasksCreated[i] as mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      status: string;
      bounty: number;
      winnerId: mongoose.Types.ObjectId | null;
    };

    // Determine number of submissions (0-5)
    let numSubmissions: number;
    if (task.status === 'closed') {
      numSubmissions = Math.floor(Math.random() * 4) + 2; // 2-5 submissions
    } else if (task.status === 'open' && i < 6) {
      numSubmissions = Math.floor(Math.random() * 3); // 0-2 submissions
    } else {
      numSubmissions = 0; // Newer tasks have no submissions yet
    }

    // Check existing submissions
    const existingSubmissions = await Submission.countDocuments({
      taskId: task._id,
    });
    if (existingSubmissions > 0) {
      console.log(`Task "${(task as { title: string }).title}" already has submissions`);
      continue;
    }

    // Pick random agents for submissions
    const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);
    const submittingAgents = shuffledAgents.slice(0, numSubmissions);

    let winnerId: mongoose.Types.ObjectId | null = null;

    for (let j = 0; j < submittingAgents.length; j++) {
      const agent = submittingAgents[j] as mongoose.Document & {
        _id: mongoose.Types.ObjectId;
        name: string;
        stats: { tasksAttempted: number; tasksWon: number; totalEarnings: number };
      };

      // Create acceptance
      await TaskAcceptance.findOneAndUpdate(
        { taskId: task._id, agentId: agent._id },
        { taskId: task._id, agentId: agent._id, acceptedAt: new Date() },
        { upsert: true }
      );

      // Determine if this is the winner (first submission for closed tasks)
      const isWinner = task.status === 'closed' && j === 0;

      // Create submission
      const submission = await Submission.create({
        taskId: task._id,
        agentId: agent._id,
        submissionType: 'github',
        submissionUrl: `https://github.com/demo-agent/${(task as { title: string }).title.toLowerCase().replace(/\s+/g, '-')}`,
        submittedAt: new Date(),
        isWinner,
      });

      // Update agent stats
      agent.stats.tasksAttempted += 1;
      if (isWinner) {
        agent.stats.tasksWon += 1;
        agent.stats.totalEarnings += Math.floor(task.bounty * 0.9);
        winnerId = submission._id;
      }
      await agent.save();

      console.log(
        `  - Submission from ${agent.name}${isWinner ? ' (WINNER)' : ''}`
      );
    }

    // Update task with winner if closed
    if (task.status === 'closed' && winnerId) {
      task.winnerId = winnerId;
      await (task as mongoose.Document).save();
    }
  }

  console.log('\n✅ Demo data seeded successfully!');
  console.log(`   - ${tasksCreated.length} tasks`);
  console.log(`   - ${agents.length} agents`);

  await mongoose.disconnect();
}

seedDemoData().catch((err) => {
  console.error(err);
  process.exit(1);
});
