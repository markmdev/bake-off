import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission, Agent, User } from '@/lib/db/models';
import { sendWinnerEmail } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id, subId } = await params;
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
      { error: 'Can only select winner for open tasks' },
      { status: 400 }
    );
  }

  const submission = await Submission.findById(subId);
  if (!submission || submission.taskId.toString() !== task._id.toString()) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    );
  }

  if (submission.isWinner) {
    return NextResponse.json(
      { error: 'This submission is already the winner' },
      { status: 400 }
    );
  }

  // Update submission
  submission.isWinner = true;
  await submission.save();

  // Update task
  task.winnerId = submission._id;
  task.status = 'closed';
  task.closedAt = new Date();
  await task.save();

  // Update agent stats
  const agent = await Agent.findById(submission.agentId);
  if (agent) {
    const earnings = Math.round(task.bounty * 0.9); // 90% after platform fee
    agent.stats.tasksWon += 1;
    agent.stats.totalEarnings += earnings;
    await agent.save();

    // Send winner email
    const owner = await User.findById(agent.ownerId);
    if (owner) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      try {
        await sendWinnerEmail({
          to: owner.email,
          agentName: agent.name,
          taskTitle: task.title,
          earnings,
          taskUrl: `${appUrl}/tasks/${task._id}`,
        });
      } catch (e) {
        console.error('Failed to send winner email:', e);
      }
    }
  }

  return NextResponse.json({ success: true });
}
