/**
 * Seed script for Bake-off demo data
 *
 * Creates:
 * - 2 demo users (poster and agent owner)
 * - 4 demo agents with varying stats
 * - 3 demo tasks (open, closed with winner, draft)
 * - 4 submissions for the closed task
 *
 * Run with: npx tsx --env-file=.env.local scripts/seed.ts
 * Or: MONGODB_URI=... npx tsx scripts/seed.ts
 */

import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local or .env if not already set
function loadEnv() {
  if (process.env.MONGODB_URI) return; // Already set

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Demo data markers
const DEMO_SUPABASE_ID_PREFIX = 'demo_';
const DEMO_STRIPE_CUSTOMER_PREFIX = 'cus_demo_';

// Inline schema definitions since we're outside src/
const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
  },
  { timestamps: true }
);

const agentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stats: {
      tasksAttempted: { type: Number, default: 0 },
      tasksWon: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    bounty: { type: Number, required: true, min: 500 },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'cancelled'],
      default: 'draft',
    },
    deadline: { type: Date, required: true },
    stripeCheckoutSessionId: { type: String, default: '' },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  submissionType: {
    type: String,
    enum: ['zip', 'github', 'deployed_url'],
    required: true,
  },
  submissionUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  isWinner: { type: Boolean, default: false },
});

const taskAcceptanceSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  acceptedAt: { type: Date, default: Date.now },
});

// Get or create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
const TaskAcceptance =
  mongoose.models.TaskAcceptance || mongoose.model('TaskAcceptance', taskAcceptanceSchema);

async function clearDemoData() {
  console.log('Clearing existing demo data...');

  // Find demo users by supabaseId prefix
  const demoUsers = await User.find({
    supabaseId: { $regex: `^${DEMO_SUPABASE_ID_PREFIX}` },
  });
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length > 0) {
    // Find agents owned by demo users
    const demoAgents = await Agent.find({ ownerId: { $in: demoUserIds } });
    const demoAgentIds = demoAgents.map((a) => a._id);

    // Find tasks posted by demo users
    const demoTasks = await Task.find({ posterId: { $in: demoUserIds } });
    const demoTaskIds = demoTasks.map((t) => t._id);

    // Delete in order: submissions, acceptances, tasks, agents, users
    if (demoTaskIds.length > 0) {
      const submissionResult = await Submission.deleteMany({ taskId: { $in: demoTaskIds } });
      console.log(`  Deleted ${submissionResult.deletedCount} submissions`);

      const acceptanceResult = await TaskAcceptance.deleteMany({ taskId: { $in: demoTaskIds } });
      console.log(`  Deleted ${acceptanceResult.deletedCount} task acceptances`);
    }

    if (demoTaskIds.length > 0) {
      const taskResult = await Task.deleteMany({ _id: { $in: demoTaskIds } });
      console.log(`  Deleted ${taskResult.deletedCount} tasks`);
    }

    if (demoAgentIds.length > 0) {
      const agentResult = await Agent.deleteMany({ _id: { $in: demoAgentIds } });
      console.log(`  Deleted ${agentResult.deletedCount} agents`);
    }

    const userResult = await User.deleteMany({ _id: { $in: demoUserIds } });
    console.log(`  Deleted ${userResult.deletedCount} users`);
  } else {
    console.log('  No existing demo data found');
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set');
    console.error('Please set it in .env.local or .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully');

  await clearDemoData();

  console.log('\nCreating demo users...');

  // Create 2 demo users
  const posterUser = await User.create({
    supabaseId: `${DEMO_SUPABASE_ID_PREFIX}poster_001`,
    email: 'demo-poster@bake-off.example',
    displayName: 'Demo Task Poster',
    stripeCustomerId: `${DEMO_STRIPE_CUSTOMER_PREFIX}poster_001`,
  });
  console.log(`  Created poster: ${posterUser.displayName}`);

  const agentOwnerUser = await User.create({
    supabaseId: `${DEMO_SUPABASE_ID_PREFIX}agent_owner_001`,
    email: 'demo-agent-owner@bake-off.example',
    displayName: 'Demo Agent Owner',
    stripeCustomerId: `${DEMO_STRIPE_CUSTOMER_PREFIX}agent_owner_001`,
  });
  console.log(`  Created agent owner: ${agentOwnerUser.displayName}`);

  console.log('\nCreating demo agents...');

  // Create 4 demo agents with varying stats
  const agents = await Agent.insertMany([
    {
      ownerId: agentOwnerUser._id,
      name: 'CodeBot Pro',
      description: 'A versatile coding agent specializing in web development and API integrations.',
      apiKeyHash: `demo_hash_codebot_${Date.now()}_1`,
      status: 'active',
      stats: {
        tasksAttempted: 15,
        tasksWon: 8,
        totalEarnings: 67500, // $675.00 in cents (8 wins * ~$75 avg after fee)
      },
    },
    {
      ownerId: agentOwnerUser._id,
      name: 'DataWizard',
      description: 'Specialized in data processing, ETL pipelines, and database operations.',
      apiKeyHash: `demo_hash_datawizard_${Date.now()}_2`,
      status: 'active',
      stats: {
        tasksAttempted: 12,
        tasksWon: 5,
        totalEarnings: 45000, // $450.00 in cents
      },
    },
    {
      ownerId: agentOwnerUser._id,
      name: 'TestRunner',
      description: 'Expert in writing comprehensive test suites and CI/CD configurations.',
      apiKeyHash: `demo_hash_testrunner_${Date.now()}_3`,
      status: 'active',
      stats: {
        tasksAttempted: 8,
        tasksWon: 2,
        totalEarnings: 18000, // $180.00 in cents
      },
    },
    {
      ownerId: agentOwnerUser._id,
      name: 'DocuBot',
      description: 'Generates clear documentation, READMEs, and API references.',
      apiKeyHash: `demo_hash_docubot_${Date.now()}_4`,
      status: 'active',
      stats: {
        tasksAttempted: 3,
        tasksWon: 0,
        totalEarnings: 0,
      },
    },
  ]);
  console.log(`  Created ${agents.length} agents: ${agents.map((a) => a.name).join(', ')}`);

  console.log('\nCreating demo tasks...');

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // Task 1: Open task (available for agents to accept)
  const openTask = await Task.create({
    posterId: posterUser._id,
    title: 'Build a REST API for user management',
    description: `## Overview
Create a REST API for basic user management operations.

## Requirements
- CRUD endpoints: GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id
- Input validation for email and name fields
- Proper HTTP status codes (200, 201, 400, 404, 500)
- JSON request/response format

## Tech Stack
- Node.js with Express or Fastify
- TypeScript preferred
- Any database (SQLite for simplicity is fine)

## Deliverables
- Source code with clear file structure
- README with setup instructions
- Basic tests for each endpoint`,
    attachments: [],
    bounty: 5000, // $50.00
    status: 'open',
    deadline: oneWeekFromNow,
    stripeCheckoutSessionId: 'cs_demo_open_task_001',
    winnerId: null,
    publishedAt: twoDaysAgo,
    closedAt: null,
  });
  console.log(`  Created open task: "${openTask.title}"`);

  // Task 2: Closed task with winner (has 4 submissions)
  const closedTask = await Task.create({
    posterId: posterUser._id,
    title: 'Create a CLI tool for file organization',
    description: `## Overview
Build a command-line tool that organizes files in a directory by their extension.

## Requirements
- Scan a directory for files
- Create subdirectories for each file extension (e.g., .pdf, .jpg, .txt)
- Move files into appropriate subdirectories
- Provide --dry-run flag to preview changes
- Handle naming conflicts gracefully

## Tech Stack
- Python or Node.js
- Standard library preferred (minimal dependencies)

## Deliverables
- Single executable script or npm package
- --help documentation
- Example usage in README`,
    attachments: [
      {
        filename: 'example-directory.zip',
        url: 'https://example.com/attachments/example-directory.zip',
        mimeType: 'application/zip',
        sizeBytes: 15000,
      },
    ],
    bounty: 7500, // $75.00
    status: 'closed',
    deadline: oneDayAgo,
    stripeCheckoutSessionId: 'cs_demo_closed_task_001',
    winnerId: null, // Will be set after creating winning submission
    publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    closedAt: oneDayAgo,
  });
  console.log(`  Created closed task: "${closedTask.title}"`);

  // Task 3: Draft task (not yet published)
  const draftTask = await Task.create({
    posterId: posterUser._id,
    title: 'Implement OAuth2 login flow',
    description: `## Overview
Add Google OAuth2 authentication to an existing Express app.

## Requirements
- Google OAuth2 integration
- Session management
- Protected routes
- Logout functionality

## Notes
Still working on the exact requirements. Will add more details before publishing.`,
    attachments: [],
    bounty: 10000, // $100.00
    status: 'draft',
    deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    stripeCheckoutSessionId: '',
    winnerId: null,
    publishedAt: null,
    closedAt: null,
  });
  console.log(`  Created draft task: "${draftTask.title}"`);

  console.log('\nCreating submissions for closed task...');

  // Create 4 submissions for the closed task
  const submissionData = [
    {
      agentId: agents[0]._id, // CodeBot Pro - Winner
      submissionType: 'github' as const,
      submissionUrl: 'https://github.com/demo-agent/file-organizer-solution',
      submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isWinner: true,
    },
    {
      agentId: agents[1]._id, // DataWizard
      submissionType: 'github' as const,
      submissionUrl: 'https://github.com/datawizard-agent/organizer-cli',
      submittedAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
      isWinner: false,
    },
    {
      agentId: agents[2]._id, // TestRunner
      submissionType: 'zip' as const,
      submissionUrl: 'https://example.com/submissions/testrunner-organizer.zip',
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isWinner: false,
    },
    {
      agentId: agents[3]._id, // DocuBot
      submissionType: 'deployed_url' as const,
      submissionUrl: 'https://docubot-demo.vercel.app/organizer',
      submittedAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
      isWinner: false,
    },
  ];

  const submissions = await Submission.insertMany(
    submissionData.map((s) => ({
      taskId: closedTask._id,
      ...s,
    }))
  );
  console.log(`  Created ${submissions.length} submissions`);

  // Update closed task with winner submission ID
  const winnerSubmission = submissions.find((s) => s.isWinner);
  if (winnerSubmission) {
    await Task.updateOne({ _id: closedTask._id }, { winnerId: winnerSubmission._id });
    console.log(`  Set winner: ${agents[0].name} (submission ${winnerSubmission._id})`);
  }

  // Create task acceptances for all agents that submitted
  console.log('\nCreating task acceptances...');
  const acceptances = await TaskAcceptance.insertMany(
    submissions.map((s, index) => ({
      taskId: closedTask._id,
      agentId: s.agentId,
      acceptedAt: new Date(submissionData[index].submittedAt.getTime() - 2 * 60 * 60 * 1000), // 2 hours before submission
    }))
  );
  console.log(`  Created ${acceptances.length} task acceptances`);

  console.log('\n--- Seed Complete ---');
  console.log('\nSummary:');
  console.log(`  Users: 2 (poster + agent owner)`);
  console.log(`  Agents: ${agents.length}`);
  console.log(`  Tasks: 3 (1 open, 1 closed with winner, 1 draft)`);
  console.log(`  Submissions: ${submissions.length} (for closed task)`);
  console.log(`  Task Acceptances: ${acceptances.length}`);

  console.log('\nDemo user emails (for reference):');
  console.log(`  Poster: ${posterUser.email}`);
  console.log(`  Agent Owner: ${agentOwnerUser.email}`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
