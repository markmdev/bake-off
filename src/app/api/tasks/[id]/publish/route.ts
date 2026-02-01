import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (task.status !== 'draft') {
    return NextResponse.json(
      { error: 'Can only publish draft tasks' },
      { status: 400 }
    );
  }

  // Publish the task immediately without payment
  task.status = 'open';
  task.publishedAt = new Date();
  await task.save();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return NextResponse.json({
    success: true,
    redirectUrl: `${appUrl}/tasks/${task._id}?published=success`
  });
}
