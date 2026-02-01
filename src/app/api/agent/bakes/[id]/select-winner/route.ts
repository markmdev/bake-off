import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Agent, Submission, BPTransaction } from '@/lib/db/models';

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

  const { submissionId } = body as Record<string, unknown>;

  if (!submissionId || !mongoose.isValidObjectId(submissionId)) {
    return NextResponse.json(
      { error: 'submissionId is required and must be a valid id' },
      { status: 400 }
    );
  }

  await connectDB();

  const bake = await Task.findById(id);

  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  // Validate calling agent is the bake creator
  if (bake.creatorAgentId.toString() !== agent._id.toString()) {
    return NextResponse.json(
      { error: 'Only the bake creator can select a winner' },
      { status: 403 }
    );
  }

  // Validate bake is open
  if (bake.status !== 'open') {
    return NextResponse.json(
      { error: 'Bake is not open' },
      { status: 400 }
    );
  }

  // Validate submission exists and belongs to this bake
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (submission.taskId.toString() !== bake._id.toString()) {
    return NextResponse.json(
      { error: 'Submission does not belong to this bake' },
      { status: 400 }
    );
  }

  // Validate submitting agent is still active
  const submittingAgent = await Agent.findById(submission.agentId);
  if (!submittingAgent || submittingAgent.status !== 'active') {
    return NextResponse.json(
      { error: 'Submitting agent is no longer active' },
      { status: 400 }
    );
  }

  // Defense in depth: prevent creator from awarding bounty to themselves
  if (submission.agentId.toString() === agent._id.toString()) {
    return NextResponse.json(
      { error: 'Cannot select own submission as winner' },
      { status: 400 }
    );
  }

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Update submission as winner (conditional to prevent double-winner)
    const winnerUpdate = await Submission.updateOne(
      { _id: submissionId, isWinner: { $ne: true } },
      { isWinner: true },
      { session }
    );
    if (winnerUpdate.modifiedCount === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Submission already marked as winner' },
        { status: 409 }
      );
    }

    // 2. Create BP transaction for winner (credit)
    await BPTransaction.create(
      [
        {
          agentId: submission.agentId,
          bakeId: bake._id,
          type: 'bake_won',
          amount: bake.bounty, // Full bounty, no fee
        },
      ],
      { session }
    );

    // 3. Update winner's stats
    await Agent.updateOne(
      { _id: submission.agentId },
      { $inc: { 'stats.bakesWon': 1 } },
      { session }
    );

    // 4. Close bake (conditional to prevent double-close)
    const bakeUpdate = await Task.updateOne(
      { _id: bake._id, status: 'open' },
      {
        status: 'closed',
        winnerId: submissionId,
        closedAt: new Date(),
      },
      { session }
    );
    if (bakeUpdate.modifiedCount === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Bake already closed' },
        { status: 409 }
      );
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return NextResponse.json({
    success: true,
    bake: {
      id: bake._id.toString(),
      status: 'closed',
      winnerId: submissionId,
    },
    winner: {
      agentId: submission.agentId.toString(),
      submissionId: submissionId,
    },
  });
}
