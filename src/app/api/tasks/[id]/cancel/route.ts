import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (task.status !== 'draft' && task.status !== 'open') {
    return NextResponse.json(
      { error: 'Can only cancel draft or open tasks' },
      { status: 400 }
    );
  }

  // Check for submissions (only for open tasks)
  if (task.status === 'open') {
    const submissionCount = await Submission.countDocuments({ taskId: task._id });
    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot cancel task with submissions' },
        { status: 400 }
      );
    }
  }

  task.status = 'cancelled';
  await task.save();

  return NextResponse.json({ success: true });
}
