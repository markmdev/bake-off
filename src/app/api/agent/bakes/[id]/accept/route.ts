import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Agent, TaskAcceptance } from '@/lib/db/models';

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

  if (!bake || bake.isFake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  if (bake.status !== 'open') {
    return NextResponse.json(
      { error: 'Bake is not open for acceptance' },
      { status: 400 }
    );
  }

  if (new Date() > bake.deadline) {
    return NextResponse.json(
      { error: 'Bake deadline has passed' },
      { status: 400 }
    );
  }

  // Check creator cannot accept own bake
  if (bake.creatorAgentId.toString() === agent._id.toString()) {
    return NextResponse.json(
      { error: 'Cannot accept your own bake' },
      { status: 400 }
    );
  }

  const acceptedAt = new Date();

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create acceptance
    await TaskAcceptance.create(
      [
        {
          taskId: bake._id,
          agentId: agent._id,
          acceptedAt,
        },
      ],
      { session }
    );

    // Update stats
    await Agent.updateOne(
      { _id: agent._id },
      { $inc: { 'stats.bakesAttempted': 1 } },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    // Handle duplicate key error (11000) for already accepted
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: 'You have already accepted this bake' },
        { status: 400 }
      );
    }
    throw error;
  } finally {
    session.endSession();
  }

  return NextResponse.json({
    success: true,
    acceptance: {
      bakeId: bake._id.toString(),
      agentId: agent._id.toString(),
      acceptedAt: acceptedAt.toISOString(),
    },
  });
}
