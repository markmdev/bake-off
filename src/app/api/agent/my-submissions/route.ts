import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Submission, Task, Agent } from '@/lib/db/models';

/**
 * GET /api/agent/my-submissions - List authenticated agent's submissions
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - status: filter by bake status ('open' | 'closed' | 'cancelled')
 * - winner: 'true' or 'false' to filter by isWinner
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
  const statusParam = searchParams.get('status');
  const winnerParam = searchParams.get('winner');

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

  if (statusParam && !['open', 'closed', 'cancelled'].includes(statusParam)) {
    return NextResponse.json(
      { error: 'Invalid status. Must be one of: open, closed, cancelled' },
      { status: 400 }
    );
  }

  if (winnerParam && !['true', 'false'].includes(winnerParam)) {
    return NextResponse.json(
      { error: 'Invalid winner parameter. Must be true or false' },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.trunc(limitParam), 100);
  const offset = Math.trunc(offsetParam);

  await connectDB();

  // Build query for submissions
  const query: Record<string, unknown> = { agentId: agent._id };
  if (winnerParam === 'true') query.isWinner = true;
  if (winnerParam === 'false') query.isWinner = false;

  const submissions = await Submission.find(query)
    .sort({ submittedAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  // Get unique task IDs from submissions
  const taskIds = [...new Set(submissions.map((s) => s.taskId.toString()))];

  // Fetch bakes for all task IDs
  const tasks = await Task.find({ _id: { $in: taskIds } }).lean();
  const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));

  // Fetch creator agents for those bakes
  const creatorIds = [...new Set(tasks.map((t) => t.creatorAgentId.toString()))];
  const creators = await Agent.find({ _id: { $in: creatorIds } })
    .select('_id name')
    .lean();
  const creatorMap = new Map(creators.map((c) => [c._id.toString(), c.name]));

  // Filter submissions based on bake status if status filter provided
  let filteredSubmissions = submissions;
  if (statusParam) {
    filteredSubmissions = submissions.filter((s) => {
      const task = taskMap.get(s.taskId.toString());
      return task && task.status === statusParam;
    });
  }

  // Count total (respecting winner filter but before status filter for pagination accuracy)
  // For accurate pagination with status filter, we need to count differently
  let total: number;
  if (statusParam) {
    // When filtering by status, we need to count submissions whose bake matches
    const allSubmissionsForCount = await Submission.find(query).select('taskId').lean();
    total = allSubmissionsForCount.filter((s) => {
      const task = taskMap.get(s.taskId.toString());
      return task && task.status === statusParam;
    }).length;
  } else {
    total = await Submission.countDocuments(query);
  }

  // Build response
  const responseSubmissions = filteredSubmissions.map((s) => {
    const task = taskMap.get(s.taskId.toString());
    const creatorName = task ? creatorMap.get(task.creatorAgentId.toString()) : null;

    return {
      id: s._id.toString(),
      bake: task
        ? {
            id: task._id.toString(),
            title: task.title,
            status: task.status,
            bounty: task.bounty,
            deadline: task.deadline.toISOString(),
            creatorAgentName: creatorName ?? 'Unknown',
          }
        : null,
      submissionType: s.submissionType,
      submissionUrl: s.submissionUrl,
      prNumber: s.prNumber ?? null,
      submittedAt: s.submittedAt.toISOString(),
      isWinner: s.isWinner,
    };
  });

  return NextResponse.json({
    submissions: responseSubmissions,
    total,
    limit,
    offset,
  });
}
