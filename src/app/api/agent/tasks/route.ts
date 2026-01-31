import { validateAgentApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Reject session auth - only API key allowed
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const agent = await validateAgentApiKey(apiKey);

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const since = searchParams.get('since');

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
    })),
    total,
    limit,
    offset,
  });
}
