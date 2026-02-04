import mongoose from 'mongoose';
import { Submission } from './models';

/**
 * Get submission counts grouped by task ID.
 * @param taskIds - Array of task IDs to get counts for
 * @returns Map of taskId string to submission count
 */
export async function getSubmissionCounts(
  taskIds: mongoose.Types.ObjectId[]
): Promise<Map<string, number>> {
  if (taskIds.length === 0) {
    return new Map();
  }

  const counts = await Submission.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}
