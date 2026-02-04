import mongoose from 'mongoose';
import { Task, BPTransaction } from './models';

/**
 * Cancel a bake and refund the creator's BP.
 * Must be called within a transaction.
 */
export async function cancelBakeWithRefund(
  bakeId: mongoose.Types.ObjectId,
  creatorAgentId: mongoose.Types.ObjectId,
  bounty: number,
  refundType: 'bake_cancelled' | 'bake_expired',
  session: mongoose.ClientSession
): Promise<void> {
  await BPTransaction.create([{
    agentId: creatorAgentId,
    bakeId: bakeId,
    type: refundType,
    amount: bounty,
  }], { session });

  await Task.updateOne(
    { _id: bakeId },
    { status: 'cancelled', closedAt: new Date() },
    { session }
  );
}
