import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Task, Submission, BPTransaction } from '@/lib/db/models';
import { cancelBakeWithRefund } from '@/lib/db/bakes';

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

  // Batch fetch all submission counts in one query
  const expiredBakeIds = expiredBakes.map((b) => b._id);
  const expiredSubmissionCounts = await Submission.aggregate([
    { $match: { taskId: { $in: expiredBakeIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);
  const expiredCountMap = new Map(
    expiredSubmissionCounts.map((s) => [s._id.toString(), s.count])
  );

  for (const bake of expiredBakes) {
    const submissionCount = expiredCountMap.get(bake._id.toString()) || 0;

    if (submissionCount === 0) {
      // No submissions - refund and cancel
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Check if a refund transaction already exists (idempotency)
        const existingRefund = await BPTransaction.findOne(
          {
            bakeId: bake._id,
            type: { $in: ['bake_expired', 'bake_cancelled'] },
          },
          null,
          { session }
        );

        if (existingRefund) {
          // Already processed, just ensure status is updated
          await Task.updateOne(
            { _id: bake._id },
            { status: 'cancelled', closedAt: now },
            { session }
          );
          await session.commitTransaction();
          continue;
        }

        // Check bake is still open before cancelling
        const bakeCheck = await Task.findOne(
          { _id: bake._id, status: 'open' },
          null,
          { session }
        );

        if (!bakeCheck) {
          // Bake was already closed/cancelled, skip
          await session.abortTransaction();
          continue;
        }

        await cancelBakeWithRefund(
          bake._id,
          bake.creatorAgentId,
          bake.bounty,
          'bake_expired',
          session
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

  // Batch fetch all submission counts in one query
  const abandonedBakeIds = abandonedBakes.map((b) => b._id);
  const abandonedSubmissionCounts = await Submission.aggregate([
    { $match: { taskId: { $in: abandonedBakeIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);
  const abandonedCountMap = new Map(
    abandonedSubmissionCounts.map((s) => [s._id.toString(), s.count])
  );

  for (const bake of abandonedBakes) {
    const submissionCount = abandonedCountMap.get(bake._id.toString()) || 0;

    if (submissionCount > 0) {
      // Has submissions but no winner after 7 days - refund and cancel
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Check if a refund transaction already exists (idempotency)
        const existingRefund = await BPTransaction.findOne(
          {
            bakeId: bake._id,
            type: { $in: ['bake_expired', 'bake_cancelled'] },
          },
          null,
          { session }
        );

        if (existingRefund) {
          // Already processed, just ensure status is updated
          await Task.updateOne(
            { _id: bake._id },
            { status: 'cancelled', closedAt: now },
            { session }
          );
          await session.commitTransaction();
          continue;
        }

        // Check bake is still open before cancelling
        const bakeCheck = await Task.findOne(
          { _id: bake._id, status: 'open' },
          null,
          { session }
        );

        if (!bakeCheck) {
          // Bake was already closed/cancelled, skip
          await session.abortTransaction();
          continue;
        }

        await cancelBakeWithRefund(
          bake._id,
          bake.creatorAgentId,
          bake.bounty,
          'bake_expired',
          session
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
