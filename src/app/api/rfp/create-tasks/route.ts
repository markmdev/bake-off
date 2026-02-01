/**
 * Create Bakeoffs from imported RFPs
 *
 * POST /api/rfp/create-tasks
 * Body: { rfps: RfpData[] }
 * Returns: { created: [...], errors: [...] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, User } from '@/lib/db/models';
import { calculateBounty } from '@/lib/firecrawl';
import type { CreateTasksRequest, CreateTasksResponse, RfpData } from '@/types/rfp';

export async function POST(request: NextRequest) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: CreateTasksRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { rfps } = body;

  if (!rfps || !Array.isArray(rfps) || rfps.length === 0) {
    return NextResponse.json({ error: 'No RFPs provided' }, { status: 400 });
  }

  await connectDB();

  // Get the MongoDB user document
  const dbUser = await User.findOne({ supabaseId: user.supabaseId });
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check for duplicates
  const titles = rfps.map(r => r.title);
  const existingTasks = await Task.find({
    title: { $in: titles },
    status: { $in: ['open', 'draft'] },
  }).lean();

  const existingTitleSet = new Set(existingTasks.map(t => t.title));

  const response: CreateTasksResponse = {
    created: [],
    errors: [],
  };

  // Create tasks for each RFP
  for (const rfp of rfps) {
    // Skip duplicates
    if (existingTitleSet.has(rfp.title)) {
      response.errors.push({
        rfpId: rfp.id,
        error: 'Task with this title already exists',
      });
      continue;
    }

    try {
      // Create the task directly as 'open' (bypass Stripe for imports)
      // Following the pattern from scripts/seed-bakeoffs.ts
      const deadline = rfp.deadline
        ? new Date(rfp.deadline)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

      const bounty = calculateBounty(rfp.estimatedValue);

      const task = await Task.create({
        posterId: dbUser._id,
        title: rfp.title,
        description: formatDescription(rfp),
        attachments: [],
        bounty,
        status: 'open',
        deadline,
        stripeCheckoutSessionId: `cs_rfp_import_${Date.now()}_${rfp.id}`,
        winnerId: null,
        publishedAt: new Date(),
        closedAt: null,
      });

      response.created.push({
        rfpId: rfp.id,
        taskId: task._id.toString(),
      });

      // Add to existing set to prevent duplicates within same batch
      existingTitleSet.add(rfp.title);
    } catch (error) {
      console.error(`Failed to create task for RFP ${rfp.id}:`, error);
      response.errors.push({
        rfpId: rfp.id,
        error: 'Failed to create task',
      });
    }
  }

  return NextResponse.json(response);
}

/**
 * Format RFP data into a task description
 */
function formatDescription(rfp: RfpData): string {
  const parts = [
    `## Imported from External RFP`,
    '',
    `**Source:** [${rfp.sourceUrl}](${rfp.sourceUrl})`,
    `**Agency:** ${rfp.agency}`,
    `**Category:** ${rfp.category}`,
    rfp.estimatedValue
      ? `**Estimated Value:** $${(rfp.estimatedValue / 100).toLocaleString()}`
      : null,
    '',
    '---',
    '',
    rfp.description,
  ];

  return parts.filter(Boolean).join('\n');
}
