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

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Can only close open tasks' },
      { status: 400 }
    );
  }

  // Note: This endpoint closes the task WITHOUT selecting a winner.
  // Use select-winner endpoint to both close and award the bounty.
  task.status = 'closed';
  task.closedAt = new Date();
  await task.save();

  return NextResponse.json({
    success: true,
    message: 'Task closed without selecting a winner',
  });
}
