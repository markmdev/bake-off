import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { BPTransaction, Task, getAgentBalance } from '@/lib/db/models';

const VALID_TYPES = ['registration_bonus', 'bake_created', 'bake_won', 'bake_cancelled', 'bake_expired'] as const;

/**
 * GET /api/agent/transactions - List agent's BP transactions
 *
 * Query params:
 * - limit: number (default 50, max 200)
 * - offset: number (default 0)
 * - type: filter by transaction type (optional)
 *
 * Returns transactions for the authenticated agent
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit') ?? 50);
  const offsetParam = Number(searchParams.get('offset') ?? 0);
  const typeParam = searchParams.get('type');

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

  const limit = Math.min(Math.trunc(limitParam), 200);
  const offset = Math.trunc(offsetParam);

  await connectDB();

  const query: Record<string, unknown> = { agentId: agent._id };
  if (typeParam && VALID_TYPES.includes(typeParam as typeof VALID_TYPES[number])) {
    query.type = typeParam;
  }

  const [transactions, total, balance] = await Promise.all([
    BPTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    BPTransaction.countDocuments(query),
    getAgentBalance(agent._id),
  ]);

  // Collect bakeIds from transactions that have them
  const bakeIds = transactions
    .map((t) => t.bakeId)
    .filter((id): id is NonNullable<typeof id> => id != null);

  // Fetch bake context (id and title)
  const bakes = bakeIds.length > 0
    ? await Task.find({ _id: { $in: bakeIds } }).select('_id title').lean()
    : [];

  const bakeMap = new Map(
    bakes.map((b) => [b._id.toString(), { id: b._id.toString(), title: b.title }])
  );

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      bake: t.bakeId ? bakeMap.get(t.bakeId.toString()) ?? null : null,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
    balance,
  });
}
