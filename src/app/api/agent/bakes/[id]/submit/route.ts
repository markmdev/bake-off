import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskAcceptance, Submission } from '@/lib/db/models';
import mongoose from 'mongoose';

const VALID_SUBMISSION_TYPES = ['zip', 'github', 'deployed_url', 'pull_request'] as const;
type SubmissionType = typeof VALID_SUBMISSION_TYPES[number];

function isValidSubmissionType(type: unknown): type is SubmissionType {
  return typeof type === 'string' && VALID_SUBMISSION_TYPES.includes(type as SubmissionType);
}

function validateSubmissionUrl(
  type: SubmissionType,
  url: string,
  targetRepo?: string
): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (type === 'github') {
    if (parsed.hostname.toLowerCase() !== 'github.com') {
      return { valid: false, error: 'GitHub URL must be from github.com' };
    }
  }

  if (type === 'deployed_url') {
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Deployed URL must use HTTPS' };
    }
  }

  if (type === 'pull_request') {
    if (parsed.hostname.toLowerCase() !== 'github.com') {
      return { valid: false, error: 'Pull request URL must be from github.com' };
    }

    if (targetRepo) {
      const normalizedTarget = targetRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').toLowerCase();
      const urlPath = parsed.pathname.slice(1).toLowerCase();

      if (!urlPath.startsWith(normalizedTarget)) {
        return { valid: false, error: `Pull request URL must be for repository: ${targetRepo}` };
      }
    }
  }

  return { valid: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid bake id' }, { status: 400 });
  }

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const { submissionType, submissionUrl, prNumber } = body as Record<string, unknown>;

  if (!isValidSubmissionType(submissionType)) {
    return NextResponse.json(
      { error: 'submissionType must be zip, github, deployed_url, or pull_request' },
      { status: 400 }
    );
  }

  if (!submissionUrl || typeof submissionUrl !== 'string') {
    return NextResponse.json(
      { error: 'submissionUrl is required' },
      { status: 400 }
    );
  }

  if (submissionType === 'pull_request') {
    if (prNumber === undefined || prNumber === null) {
      return NextResponse.json(
        { error: 'prNumber is required for pull_request submissions' },
        { status: 400 }
      );
    }
    if (typeof prNumber !== 'number' || !Number.isInteger(prNumber) || prNumber < 1) {
      return NextResponse.json(
        { error: 'prNumber must be a positive integer' },
        { status: 400 }
      );
    }
  }

  await connectDB();
  const bake = await Task.findById(id);

  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  if (bake.status !== 'open') {
    return NextResponse.json(
      { error: 'Bake is not open for submissions' },
      { status: 400 }
    );
  }

  if (new Date() > bake.deadline) {
    return NextResponse.json(
      { error: 'Bake deadline has passed' },
      { status: 400 }
    );
  }

  // Check creator cannot submit to own bake
  if (bake.creatorAgentId.toString() === agent._id.toString()) {
    return NextResponse.json(
      { error: 'Cannot submit to your own bake' },
      { status: 400 }
    );
  }

  const urlValidation = validateSubmissionUrl(
    submissionType,
    submissionUrl,
    bake.targetRepo
  );
  if (!urlValidation.valid) {
    return NextResponse.json({ error: urlValidation.error }, { status: 400 });
  }

  const acceptance = await TaskAcceptance.findOne({
    taskId: bake._id,
    agentId: agent._id,
  });

  if (!acceptance) {
    return NextResponse.json(
      { error: 'You must accept the bake before submitting' },
      { status: 400 }
    );
  }

  const existingSubmission = await Submission.findOne({
    taskId: bake._id,
    agentId: agent._id,
  });

  if (existingSubmission) {
    return NextResponse.json(
      { error: 'You have already submitted to this bake' },
      { status: 400 }
    );
  }

  const submittedAt = new Date();
  const submission = await Submission.create({
    taskId: bake._id,
    agentId: agent._id,
    submissionType,
    submissionUrl,
    prNumber: submissionType === 'pull_request' ? (prNumber as number) : undefined,
    submittedAt,
    isWinner: false,
  });

  return NextResponse.json({
    success: true,
    submission: {
      id: submission._id.toString(),
      bakeId: bake._id.toString(),
      agentId: agent._id.toString(),
      submissionType,
      submissionUrl,
      ...(submissionType === 'pull_request' && { prNumber }),
      submittedAt: submittedAt.toISOString(),
    },
  });
}
