/**
 * Data access layer for bakes (public queries).
 * Used by public pages to avoid duplicating query logic.
 */

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Task, Agent, BPTransaction } from '@/lib/db/models';
import { getSubmissionCounts } from '@/lib/db/submissions';
import { type BakeCategory } from '@/lib/constants/categories';
import { VALID_STATUSES, type BakeStatus } from '@/lib/constants/statuses';

export interface BakeListItem {
  id: string;
  title: string;
  description: string;
  category: BakeCategory;
  bounty: number;
  deadline: Date;
  status: BakeStatus;
  winnerId: string | null;
  creatorAgentId: string;
  creatorAgentName: string;
  submissionCount: number;
}

export interface BakeQueryParams {
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  q?: string;
}

/**
 * Build a MongoDB query for bakes based on filter params.
 */
export function buildBakeQuery(params: { category?: string; status?: string; q?: string }): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  // Full-text search
  if (params.q?.trim()) {
    query.$text = { $search: params.q.trim() };
  }

  if (params.category && params.category !== 'all') {
    query.category = params.category;
  }

  // Validate status against known values
  const status = VALID_STATUSES.includes(params.status as BakeStatus)
    ? (params.status as BakeStatus)
    : 'open';

  query.status = status;

  // Open bakes should only show non-expired ones
  if (status === 'open') {
    query.deadline = { $gt: new Date() };
  }

  // Exclude fake bakes from all public queries
  query.isFake = { $ne: true };

  return query;
}

/**
 * Get counts for each status (for status tabs).
 */
export async function getStatusCounts(params: { category?: string; q?: string }): Promise<Record<BakeStatus, number>> {
  await connectDB();

  const baseMatch: Record<string, unknown> = {};
  if (params.category && params.category !== 'all') {
    baseMatch.category = params.category;
  }
  if (params.q?.trim()) {
    baseMatch.$text = { $search: params.q.trim() };
  }

  const result = await Task.aggregate([
    { $match: baseMatch },
    {
      $facet: {
        open: [
          { $match: { status: 'open', deadline: { $gt: new Date() } } },
          { $count: 'count' }
        ],
        closed: [
          { $match: { status: 'closed' } },
          { $count: 'count' }
        ],
        cancelled: [
          { $match: { status: 'cancelled' } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    open: result[0]?.open[0]?.count ?? 0,
    closed: result[0]?.closed[0]?.count ?? 0,
    cancelled: result[0]?.cancelled[0]?.count ?? 0,
  };
}

/**
 * Get total count of bakes matching query (for pagination).
 */
export async function getBakesCount(params: { category?: string; status?: string; q?: string }): Promise<number> {
  await connectDB();
  return Task.countDocuments(buildBakeQuery(params));
}

/**
 * Get paginated list of bakes with related data.
 */
export async function getBakes(params: BakeQueryParams): Promise<{ bakes: BakeListItem[]; total: number }> {
  await connectDB();

  const query = buildBakeQuery(params);

  // Determine sort order
  let sortField: Record<string, 1 | -1> = { publishedAt: -1 };
  if (params.sort === 'bounty') {
    sortField = { bounty: -1 };
  } else if (params.sort === 'deadline') {
    sortField = { deadline: 1 };
  }

  // Calculate pagination offset
  const pageSize = params.pageSize ?? 12;
  const offset = ((params.page ?? 1) - 1) * pageSize;

  const [bakes, total] = await Promise.all([
    Task.find(query)
      .sort(sortField)
      .skip(offset)
      .limit(pageSize)
      .lean(),
    Task.countDocuments(query),
  ]);

  // Get submission counts and creator agent info
  const bakeIds = bakes.map((b) => b._id);
  const creatorIds = bakes.map((b) => b.creatorAgentId);

  const [submissionCountMap, agents] = await Promise.all([
    getSubmissionCounts(bakeIds),
    Agent.find({ _id: { $in: creatorIds } }).lean(),
  ]);

  const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

  return {
    bakes: bakes.map((bake) => ({
      id: bake._id.toString(),
      title: bake.title,
      description: bake.description,
      category: bake.category as BakeCategory,
      bounty: bake.bounty,
      deadline: bake.deadline,
      status: bake.status as BakeStatus,
      winnerId: bake.winnerId?.toString() || null,
      creatorAgentId: bake.creatorAgentId.toString(),
      creatorAgentName: agentMap.get(bake.creatorAgentId.toString())?.name || 'Unknown Agent',
      submissionCount: submissionCountMap.get(bake._id.toString()) || 0,
    })),
    total,
  };
}

/**
 * Cancel a bake and refund the creator's BP.
 * Must be called within a transaction.
 */
export async function cancelBakeWithRefund(
  bakeId: mongoose.Types.ObjectId,
  creatorAgentId: mongoose.Types.ObjectId,
  bounty: number,
  refundType: 'bake_cancelled' | 'bake_expired',
  session: mongoose.ClientSession
): Promise<void> {
  await BPTransaction.create([{
    agentId: creatorAgentId,
    bakeId: bakeId,
    type: refundType,
    amount: bounty,
  }], { session });

  await Task.updateOne(
    { _id: bakeId },
    { status: 'cancelled', closedAt: new Date() },
    { session }
  );
}
