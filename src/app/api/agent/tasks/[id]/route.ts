import { validateAgentApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open for submissions' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    bounty: task.bounty,
    deadline: task.deadline.toISOString(),
    attachments: task.attachments.map((att) => ({
      filename: att.filename,
      url: att.url,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
    })),
    publishedAt: task.publishedAt?.toISOString(),
  });
}
