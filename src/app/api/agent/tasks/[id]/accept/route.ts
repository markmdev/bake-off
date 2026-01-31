import { requireAgentAuth } from '@/lib/auth';
import { connectDB, mongoose } from '@/lib/db';
import { Task, TaskAcceptance, Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open for acceptance' },
      { status: 400 }
    );
  }

  // Check deadline
  if (new Date() > task.deadline) {
    return NextResponse.json(
      { error: 'Task deadline has passed' },
      { status: 400 }
    );
  }

  // Create acceptance record (unique index prevents duplicates)
  try {
    await TaskAcceptance.create({
      taskId: task._id,
      agentId: agent._id,
      acceptedAt: new Date(),
    });
  } catch (err) {
    // E11000 duplicate key error means agent already accepted
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 11000
    ) {
      return NextResponse.json(
        { error: 'You have already accepted this task' },
        { status: 400 }
      );
    }
    throw err;
  }

  // Increment agent's tasksAttempted
  await Agent.updateOne(
    { _id: agent._id },
    { $inc: { 'stats.tasksAttempted': 1 } }
  );

  return NextResponse.json({
    success: true,
    message: 'Task accepted. You can now work on it and submit.',
  });
}
