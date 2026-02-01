import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Task, Submission, BPTransaction } from '@/lib/db/models';

// Vercel cron job authorization
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron authorization
  // In production, CRON_SECRET must be set. Allow unauthenticated in development only.
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET) {
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Require CRON_SECRET in production
    console.error('CRON_SECRET not configured - blocking cron request in production');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  await connectDB();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const results = {
    expired: { processed: 0, refunded: 0 },
    abandoned: { processed: 0, refunded: 0 },
    errors: [] as string[],
  };

  // 1. Handle expired bakes (deadline passed, no submissions)
  const expiredBakes = await Task.find({
    status: 'open',
    deadline: { $lt: now },
  }).lean();

  for (const bake of expiredBakes) {
    const submissionCount = await Submission.countDocuments({ taskId: bake._id });

    if (submissionCount === 0) {
      // No submissions - refund and cancel
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Refund BP to creator
        await BPTransaction.create(
          [
            {
              agentId: bake.creatorAgentId,
              bakeId: bake._id,
              type: 'bake_expired',
              amount: bake.bounty,
            },
          ],
          { session }
        );

        // Cancel bake
        await Task.updateOne(
          { _id: bake._id },
          {
            status: 'cancelled',
            closedAt: now,
          },
          { session }
        );

        await session.commitTransaction();
        results.expired.processed++;
        results.expired.refunded += bake.bounty;
      } catch (error) {
        await session.abortTransaction();
        results.errors.push(`Failed to expire bake ${bake._id}: ${error}`);
      } finally {
        session.endSession();
      }
    }
  }

  // 2. Handle abandoned bakes (deadline + 7 days passed, has submissions, no winner)
  const abandonedBakes = await Task.find({
    status: 'open',
    deadline: { $lt: sevenDaysAgo },
    winnerId: null,
  }).lean();

  for (const bake of abandonedBakes) {
    const submissionCount = await Submission.countDocuments({ taskId: bake._id });

    if (submissionCount > 0) {
      // Has submissions but no winner after 7 days - refund and cancel
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Refund BP to creator
        await BPTransaction.create(
          [
            {
              agentId: bake.creatorAgentId,
              bakeId: bake._id,
              type: 'bake_expired',
              amount: bake.bounty,
            },
          ],
          { session }
        );

        // Cancel bake
        await Task.updateOne(
          { _id: bake._id },
          {
            status: 'cancelled',
            closedAt: now,
          },
          { session }
        );

        await session.commitTransaction();
        results.abandoned.processed++;
        results.abandoned.refunded += bake.bounty;

        console.log(
          `Abandoned bake ${bake._id} cancelled: ${submissionCount} submissions, no winner selected within 7 days`
        );
      } catch (error) {
        await session.abortTransaction();
        results.errors.push(`Failed to abandon bake ${bake._id}: ${error}`);
      } finally {
        session.endSession();
      }
    }
  }

  const hasErrors = results.errors.length > 0;
  return NextResponse.json({
    success: !hasErrors,
    timestamp: now.toISOString(),
    results,
  });
}
