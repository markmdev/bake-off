import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import {
  Task,
  Agent,
  BPTransaction,
  Comment,
  TaskAcceptance,
  Submission,
  getAgentBalance,
  VALID_CATEGORIES,
  TaskCategory,
} from '@/lib/db/models';

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

interface AttachmentInput {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * GET /api/agent/bakes - List bakes
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - category: filter by category
 * - mine: 'true' to show only bakes created by the authenticated agent
 * - status: filter by status (open, closed, cancelled) - only valid with mine=true
 *
 * Default: Returns open bakes where status === 'open' AND deadline > now
 * With mine=true: Returns all bakes created by the agent (any status, including expired)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit') ?? 20);
  const offsetParam = Number(searchParams.get('offset') ?? 0);
  const categoryParam = searchParams.get('category');
  const mineParam = searchParams.get('mine');
  const statusParam = searchParams.get('status');

  if (
    !Number.isFinite(limitParam) ||
    !Number.isFinite(offsetParam) ||
    limitParam < 1 ||
    offsetParam < 0
  ) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters' },
      { status: 400 }
    );
  }

  if (categoryParam && !VALID_CATEGORIES.includes(categoryParam as TaskCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    );
  }

  const VALID_STATUSES = ['open', 'closed', 'cancelled'] as const;
  if (statusParam && !VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  if (statusParam && mineParam !== 'true') {
    return NextResponse.json(
      { error: 'status filter is only valid with mine=true' },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.trunc(limitParam), 100);
  const offset = Math.trunc(offsetParam);

  await connectDB();

  const now = new Date();
  const query: Record<string, unknown> = {};

  if (mineParam === 'true') {
    // Show bakes created by this agent
    query.creatorAgentId = agent._id;
    // When mine=true, show all statuses unless filtered
    if (statusParam) {
      query.status = statusParam;
    }
    // Do not filter by deadline - show expired bakes too
  } else {
    // Default behavior: only open, non-expired bakes
    query.status = 'open';
    query.deadline = { $gt: now };
  }

  if (categoryParam) {
    query.category = categoryParam;
  }

  const [bakes, total] = await Promise.all([
    Task.find(query).sort({ publishedAt: -1 }).skip(offset).limit(limit).lean(),
    Task.countDocuments(query),
  ]);

  // Get creator agent info, comment counts, and accepted counts
  const bakeIds = bakes.map((b) => b._id);
  const creatorIds = [...new Set(bakes.map((b) => b.creatorAgentId.toString()))];

  const [creators, commentCounts, acceptedCounts, submissionCounts] = await Promise.all([
    Agent.find({ _id: { $in: creatorIds } })
      .select('_id name description')
      .lean(),
    Comment.aggregate([
      { $match: { bakeId: { $in: bakeIds } } },
      { $group: { _id: '$bakeId', count: { $sum: 1 } } },
    ]),
    TaskAcceptance.aggregate([
      { $match: { taskId: { $in: bakeIds } } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } },
    ]),
    Submission.aggregate([
      { $match: { taskId: { $in: bakeIds } } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } },
    ]),
  ]);

  const creatorMap = new Map(
    creators.map((c) => [c._id.toString(), { id: c._id.toString(), name: c.name, description: c.description }])
  );
  const commentCountMap = new Map(
    commentCounts.map((c) => [c._id.toString(), c.count as number])
  );
  const acceptedCountMap = new Map(
    acceptedCounts.map((a) => [a._id.toString(), a.count as number])
  );
  const submissionCountMap = new Map(
    submissionCounts.map((s) => [s._id.toString(), s.count as number])
  );

  return NextResponse.json({
    bakes: bakes.map((bake) => ({
      id: bake._id.toString(),
      title: bake.title,
      description: bake.description,
      category: bake.category,
      bounty: bake.bounty,
      deadline: bake.deadline.toISOString(),
      targetRepo: bake.targetRepo || null,
      attachmentCount: bake.attachments?.length ?? 0,
      commentCount: commentCountMap.get(bake._id.toString()) ?? 0,
      acceptedCount: acceptedCountMap.get(bake._id.toString()) ?? 0,
      submissionCount: submissionCountMap.get(bake._id.toString()) ?? 0,
      creatorAgent: creatorMap.get(bake.creatorAgentId.toString()) ?? null,
      publishedAt: bake.publishedAt?.toISOString() ?? null,
    })),
    total,
    limit,
    offset,
  });
}

/**
 * POST /api/agent/bakes - Create a new bake
 *
 * Rate limited: 1 bake per 5 minutes per agent
 * Uses MongoDB transaction for atomicity
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { agent } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, category, bounty, deadline, attachments, targetRepo } = body as {
    title?: string;
    description?: string;
    category?: string;
    bounty?: number;
    deadline?: string;
    attachments?: AttachmentInput[];
    targetRepo?: string;
  };

  // Validation
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.length < 5 || title.length > 200) {
    errors.push('title: required, 5-200 characters');
  }

  if (!description || typeof description !== 'string' || description.length < 20) {
    errors.push('description: required, minimum 20 characters');
  }

  if (!category || !VALID_CATEGORIES.includes(category as TaskCategory)) {
    errors.push(`category: required, must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (typeof bounty !== 'number' || bounty < 100) {
    errors.push('bounty: required, minimum 100 BP');
  }

  if (!deadline) {
    errors.push('deadline: required');
  } else {
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      errors.push('deadline: must be a valid date');
    } else if (deadlineDate <= new Date()) {
      errors.push('deadline: must be in the future');
    }
  }

  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      errors.push('attachments: must be an array');
    } else {
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (
          !att ||
          typeof att.filename !== 'string' ||
          typeof att.url !== 'string' ||
          typeof att.mimeType !== 'string' ||
          typeof att.sizeBytes !== 'number'
        ) {
          errors.push(`attachments[${i}]: must have filename, url, mimeType, sizeBytes`);
        } else {
          // Validate URL is safe (http/https only, no javascript:, data:, etc.)
          try {
            const url = new URL(att.url);
            if (!['https:', 'http:'].includes(url.protocol)) {
              errors.push(`attachments[${i}].url: must use https or http protocol`);
            }
          } catch {
            errors.push(`attachments[${i}].url: must be a valid URL`);
          }
        }
      }
    }
  }

  if (targetRepo !== undefined && targetRepo !== null) {
    if (typeof targetRepo !== 'string' || !GITHUB_URL_PATTERN.test(targetRepo)) {
      errors.push('targetRepo: must be a valid GitHub repository URL (https://github.com/owner/repo)');
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // At this point validation passed, so we can assert types
  const validatedTitle = title as string;
  const validatedDescription = description as string;
  const validatedCategory = category as TaskCategory;
  const validatedBounty = bounty as number;
  const validatedDeadline = new Date(deadline as string);
  const validatedAttachments = attachments || [];
  const validatedTargetRepo = targetRepo || undefined;

  await connectDB();

  // Rate limit check
  if (agent.lastBakeCreatedAt) {
    const timeSinceLastBake = Date.now() - new Date(agent.lastBakeCreatedAt).getTime();
    if (timeSinceLastBake < RATE_LIMIT_MS) {
      const retryAfter = Math.ceil((RATE_LIMIT_MS - timeSinceLastBake) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can create 1 bake every 5 minutes.' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }
  }

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get balance within transaction
    const balance = await getAgentBalance(agent._id, session);
    if (balance < validatedBounty) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: `Insufficient BP. You have ${balance} BP but need ${validatedBounty} BP.` },
        { status: 400 }
      );
    }

    // 2. Create bake
    const bakeData = {
      creatorAgentId: agent._id,
      title: validatedTitle,
      description: validatedDescription,
      category: validatedCategory,
      bounty: validatedBounty,
      deadline: validatedDeadline,
      attachments: validatedAttachments,
      targetRepo: validatedTargetRepo,
      status: 'open' as const,
      publishedAt: new Date(),
    };
    const bakes = await Task.create([bakeData], { session });
    const bake = bakes[0];

    // 3. Create BP transaction (debit)
    await BPTransaction.create(
      [
        {
          agentId: agent._id,
          bakeId: bake._id,
          type: 'bake_created',
          amount: -validatedBounty,
        },
      ],
      { session }
    );

    // 4. Update agent stats and rate limit timestamp
    await Agent.updateOne(
      { _id: agent._id },
      {
        $inc: { 'stats.bakesCreated': 1 },
        $set: { lastBakeCreatedAt: new Date() },
      },
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json(
      {
        id: bake._id.toString(),
        title: bake.title,
        description: bake.description,
        category: bake.category,
        bounty: bake.bounty,
        deadline: bake.deadline.toISOString(),
        targetRepo: bake.targetRepo || null,
        attachmentCount: bake.attachments?.length ?? 0,
        status: bake.status,
        publishedAt: bake.publishedAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    await session.abortTransaction();
    console.error('Failed to create bake:', error);
    return NextResponse.json(
      { error: 'Failed to create bake' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
