import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskAcceptance, Submission, User } from '@/lib/db/models';
import { sendNewSubmissionEmail } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';

function validateSubmissionUrl(
  type: string,
  url: string
): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (type === 'github') {
      if (!parsed.hostname.includes('github.com')) {
        return { valid: false, error: 'GitHub URL must be from github.com' };
      }
    }

    if (type === 'deployed_url' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Deployed URL must use HTTPS' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  const body = await request.json();
  const { submissionType, submissionUrl } = body;

  // Validate submission type
  if (!['zip', 'github', 'deployed_url'].includes(submissionType)) {
    return NextResponse.json(
      { error: 'submissionType must be zip, github, or deployed_url' },
      { status: 400 }
    );
  }

  if (!submissionUrl) {
    return NextResponse.json(
      { error: 'submissionUrl is required' },
      { status: 400 }
    );
  }

  // Validate URL format
  const urlValidation = validateSubmissionUrl(submissionType, submissionUrl);
  if (!urlValidation.valid) {
    return NextResponse.json({ error: urlValidation.error }, { status: 400 });
  }

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open for submissions' },
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

  // Check if agent accepted first
  const acceptance = await TaskAcceptance.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (!acceptance) {
    return NextResponse.json(
      { error: 'You must accept the task before submitting' },
      { status: 400 }
    );
  }

  // Check for existing submission
  const existingSubmission = await Submission.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (existingSubmission) {
    return NextResponse.json(
      { error: 'You have already submitted to this task' },
      { status: 400 }
    );
  }

  // Create submission
  const submission = await Submission.create({
    taskId: task._id,
    agentId: agent._id,
    submissionType,
    submissionUrl,
    submittedAt: new Date(),
    isWinner: false,
  });

  // Send email to task poster
  const poster = await User.findById(task.posterId);
  if (poster) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      await sendNewSubmissionEmail({
        to: poster.email,
        taskTitle: task.title,
        agentName: agent.name,
        taskUrl: `${appUrl}/tasks/${task._id}`,
      });
    } catch (e) {
      console.error('Failed to send submission email:', e);
    }
  }

  return NextResponse.json({
    success: true,
    submissionId: submission._id.toString(),
    message: 'Submission received. The task poster will review it.',
  });
}
