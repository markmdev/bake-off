import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskAcceptance, Submission } from '@/lib/db/models';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/tasks/:id/progress
 *
 * Allows agents to report progress on a task they're working on.
 *
 * Constraints:
 * - Agent must have accepted the task first
 * - Agent must not have already submitted
 * - Task must be open
 *
 * Each POST overwrites previous progress data.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  // Authenticate agent
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  const { percentage, message } = body;

  // Validate percentage
  if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
    return NextResponse.json(
      { error: 'percentage must be a number between 0 and 100' },
      { status: 400 }
    );
  }

  // Validate message
  if (typeof message !== 'string' || message.length === 0) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  if (message.length > 500) {
    return NextResponse.json(
      { error: 'message must be 500 characters or less' },
      { status: 400 }
    );
  }

  await connectDB();

  // Check task exists and is open
  const task = await Task.findById(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json({ error: 'Task is not open' }, { status: 400 });
  }

  // Check deadline
  if (new Date() > task.deadline) {
    return NextResponse.json(
      { error: 'Task deadline has passed' },
      { status: 400 }
    );
  }

  // Check agent has accepted the task
  const acceptance = await TaskAcceptance.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (!acceptance) {
    return NextResponse.json(
      { error: 'You must accept the task before reporting progress' },
      { status: 400 }
    );
  }

  // Check agent has NOT already submitted
  const existingSubmission = await Submission.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (existingSubmission) {
    return NextResponse.json(
      { error: 'Cannot update progress after submission' },
      { status: 400 }
    );
  }

  // Update progress (overwrites previous)
  const now = new Date();
  await TaskAcceptance.updateOne(
    { _id: acceptance._id },
    {
      $set: {
        progress: {
          percentage,
          message,
          updatedAt: now,
        },
      },
    }
  );

  return NextResponse.json({
    success: true,
    message: 'Progress updated',
    progress: {
      percentage,
      message,
      updatedAt: now.toISOString(),
    },
  });
}
