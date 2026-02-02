/**
 * Migration script for Bake-off v2 agent-first economy
 *
 * This script prepares the database for the v2 agent-first model:
 * 1. Deletes all Task, Submission, TaskAcceptance, User documents
 * 2. Resets Agent documents: removes browniePoints/ownerId, resets stats
 * 3. Creates BPTransaction (registration_bonus, 1000) for each agent
 * 4. Creates indexes for BPTransaction and Comment collections
 *
 * Run with: npx tsx --env-file=.env.local scripts/migrate-to-v2.ts
 * Or with confirmation: npx tsx --env-file=.env.local scripts/migrate-to-v2.ts --yes
 */

import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

// Load environment variables from .env.local or .env if not already set
function loadEnv() {
  if (process.env.MONGODB_URI) return;

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

// Inline schema definitions for migration script

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    browniePoints: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stats: {
      bakesAttempted: { type: Number, default: 0 },
      bakesWon: { type: Number, default: 0 },
      bakesCreated: { type: Number, default: 0 },
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

// BPTransaction schema for v2
const bpTransactionSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  bakeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  type: {
    type: String,
    enum: ['registration_bonus', 'bake_created', 'bake_won', 'bake_cancelled', 'bake_expired'],
    required: true,
  },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Comment schema for v2
const commentSchema = new mongoose.Schema({
  bakeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Get or create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
const TaskAcceptance =
  mongoose.models.TaskAcceptance || mongoose.model('TaskAcceptance', taskAcceptanceSchema);
const BPTransaction =
  mongoose.models.BPTransaction || mongoose.model('BPTransaction', bpTransactionSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

async function promptConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\nWARNING: This will DELETE all Tasks, Submissions, TaskAcceptances, and Users.\n' +
        'Agent documents will be reset (browniePoints/ownerId removed, stats reset).\n' +
        'This action cannot be undone.\n\n' +
        'Continue? (y/N): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set');
    console.error('Please set it in .env.local or .env');
    process.exit(1);
  }

  // Check for --yes flag
  const hasYesFlag = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!hasYesFlag) {
    const confirmed = await promptConfirmation();
    if (!confirmed) {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }

  console.log('\n=== Bake-off v2 Migration ===\n');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully\n');

  // Step 1: Delete all Task documents
  console.log('Step 1: Deleting Task documents...');
  const taskResult = await Task.deleteMany({});
  console.log(`  Deleted ${taskResult.deletedCount} tasks`);

  // Step 2: Delete all Submission documents
  console.log('Step 2: Deleting Submission documents...');
  const submissionResult = await Submission.deleteMany({});
  console.log(`  Deleted ${submissionResult.deletedCount} submissions`);

  // Step 3: Delete all TaskAcceptance documents
  console.log('Step 3: Deleting TaskAcceptance documents...');
  const acceptanceResult = await TaskAcceptance.deleteMany({});
  console.log(`  Deleted ${acceptanceResult.deletedCount} task acceptances`);

  // Step 4: Delete all User documents
  console.log('Step 4: Deleting User documents...');
  const userResult = await User.deleteMany({});
  console.log(`  Deleted ${userResult.deletedCount} users`);

  // Step 5: Reset Agent documents
  console.log('Step 5: Resetting Agent documents...');
  const agents = await Agent.find({});
  console.log(`  Found ${agents.length} agents to reset`);

  if (agents.length > 0) {
    // Use $unset to remove browniePoints and ownerId fields
    // Use $set to reset stats to new structure
    const agentUpdateResult = await Agent.updateMany(
      {},
      {
        $unset: { browniePoints: '', ownerId: '' },
        $set: {
          stats: {
            bakesAttempted: 0,
            bakesWon: 0,
            bakesCreated: 0,
          },
        },
      }
    );
    console.log(`  Reset ${agentUpdateResult.modifiedCount} agents`);
  }

  // Step 6: Create BPTransaction for each agent (idempotent)
  console.log('Step 6: Creating BPTransaction documents (registration bonus)...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const agent of agents) {
    // Check if agent already has a registration bonus
    const existingBonus = await BPTransaction.findOne({
      agentId: agent._id,
      type: 'registration_bonus',
    });

    if (!existingBonus) {
      await BPTransaction.create({
        agentId: agent._id,
        type: 'registration_bonus',
        amount: 1000,
      });
      console.log(`  Created registration bonus for ${agent.name}`);
      createdCount++;
    } else {
      console.log(`  Skipping ${agent.name} - already has registration bonus`);
      skippedCount++;
    }
  }

  if (agents.length === 0) {
    console.log('  No agents found, skipping BP transactions');
  } else {
    console.log(`  Created: ${createdCount}, Skipped: ${skippedCount}`);
  }

  // Step 7: Create indexes
  console.log('Step 7: Creating indexes...');

  // BPTransaction index
  console.log('  Creating BPTransaction index: { agentId: 1 }');
  await BPTransaction.collection.createIndex({ agentId: 1 });

  // Comment indexes
  console.log('  Creating Comment index: { bakeId: 1, createdAt: -1 }');
  await Comment.collection.createIndex({ bakeId: 1, createdAt: -1 });

  console.log('  Creating Comment index: { agentId: 1 }');
  await Comment.collection.createIndex({ agentId: 1 });

  console.log('  Creating Comment index: { parentId: 1 }');
  await Comment.collection.createIndex({ parentId: 1 });

  console.log('\n=== Migration Complete ===\n');
  console.log('Summary:');
  console.log(`  Tasks deleted: ${taskResult.deletedCount}`);
  console.log(`  Submissions deleted: ${submissionResult.deletedCount}`);
  console.log(`  TaskAcceptances deleted: ${acceptanceResult.deletedCount}`);
  console.log(`  Users deleted: ${userResult.deletedCount}`);
  console.log(`  Agents reset: ${agents.length}`);
  console.log(`  BP transactions created: ${createdCount}, skipped: ${skippedCount}`);
  console.log('  Indexes created: 4 (BPTransaction: 1, Comment: 3)');

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
