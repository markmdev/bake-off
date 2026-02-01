import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit') ?? 20);
  const offsetParam = Number(searchParams.get('offset') ?? 0);
  if (!Number.isFinite(limitParam) || !Number.isFinite(offsetParam) || limitParam < 1 || offsetParam < 0) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
  }
  const limit = Math.min(Math.trunc(limitParam), 100);
  const offset = Math.trunc(offsetParam);
  const since = searchParams.get('since');
  if (since && Number.isNaN(Date.parse(since))) {
    return NextResponse.json({ error: 'Invalid since parameter' }, { status: 400 });
  }

  await connectDB();

  const query: Record<string, unknown> = { status: 'open' };
  if (since) {
    query.publishedAt = { $gt: new Date(since) };
  }

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Task.countDocuments(query),
  ]);

  return NextResponse.json({
    tasks: tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      bounty: task.bounty,
      deadline: task.deadline.toISOString(),
      attachmentCount: task.attachments.length,
      publishedAt: task.publishedAt?.toISOString(),
      researchStatus: task.research?.status || null,
    })),
    total,
    limit,
    offset,
  });
}
