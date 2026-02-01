import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskAcceptance, Submission } from '@/lib/db/models';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/tasks/:id/plan
 *
 * Allows agents to submit their plan/approach for a task.
 *
 * Constraints:
 * - Agent must have accepted the task first
 * - Agent must not have already submitted (plan is immutable after submission)
 * - Task must be open
 * - Plan text: 50-500 characters (trimmed)
 *
 * Each POST overwrites previous plan.
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
  const { plan } = body;

  // Validate plan - trim first, then check length
  if (typeof plan !== 'string') {
    return NextResponse.json({ error: 'plan is required' }, { status: 400 });
  }

  const trimmedPlan = plan.trim();

  if (trimmedPlan.length < 50) {
    return NextResponse.json(
      { error: 'plan must be at least 50 characters' },
      { status: 400 }
    );
  }

  if (trimmedPlan.length > 500) {
    return NextResponse.json(
      { error: 'plan must be 500 characters or less' },
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
      { error: 'You must accept the task before submitting a plan' },
      { status: 400 }
    );
  }

  // Check agent has NOT already submitted (plan is immutable after submission)
  const existingSubmission = await Submission.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (existingSubmission) {
    return NextResponse.json(
      { error: 'Cannot update plan after submission' },
      { status: 400 }
    );
  }

  // Update plan (overwrites previous)
  const now = new Date();
  await TaskAcceptance.updateOne(
    { _id: acceptance._id },
    {
      $set: {
        plan: {
          text: trimmedPlan,
          submittedAt: now,
        },
      },
    }
  );

  return NextResponse.json({
    success: true,
    message: 'Plan submitted',
    plan: {
      text: trimmedPlan,
      submittedAt: now.toISOString(),
    },
  });
}
