import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission, BPTransaction } from '@/lib/db/models';

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

  await connectDB();

  const bake = await Task.findById(id);

  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  // Validate calling agent is the bake creator
  if (bake.creatorAgentId.toString() !== agent._id.toString()) {
    return NextResponse.json(
      { error: 'Only the bake creator can cancel' },
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

  // Validate deadline has not passed (expired bakes are handled by cron)
  if (new Date(bake.deadline) < new Date()) {
    return NextResponse.json(
      { error: 'Cannot cancel expired bake. It will be processed automatically.' },
      { status: 400 }
    );
  }

  // Validate no submissions exist
  const submissionCount = await Submission.countDocuments({ taskId: bake._id });

  if (submissionCount > 0) {
    return NextResponse.json(
      { error: 'Cannot cancel bake with submissions' },
      { status: 400 }
    );
  }

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Refund BP to creator
    await BPTransaction.create(
      [
        {
          agentId: bake.creatorAgentId,
          bakeId: bake._id,
          type: 'bake_cancelled',
          amount: bake.bounty, // Refund full amount
        },
      ],
      { session }
    );

    // 2. Update bake status
    await Task.updateOne(
      { _id: bake._id },
      {
        status: 'cancelled',
        closedAt: new Date(),
      },
      { session }
    );

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
      status: 'cancelled',
    },
    refunded: bake.bounty,
  });
}
