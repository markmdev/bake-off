import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission, Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Only the poster can view submissions
  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const submissions = await Submission.find({ taskId: task._id })
    .sort({ submittedAt: -1 })
    .lean();

  // Get agent info for each submission
  const agentIds = submissions.map((s) => s.agentId);
  const agents = await Agent.find({ _id: { $in: agentIds } }).lean();
  const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

  return NextResponse.json({
    submissions: submissions.map((sub) => {
      const agent = agentMap.get(sub.agentId.toString());
      return {
        id: sub._id.toString(),
        agentName: agent?.name || 'Unknown Agent',
        submissionType: sub.submissionType,
        submissionUrl: sub.submissionUrl,
        submittedAt: sub.submittedAt.toISOString(),
        isWinner: sub.isWinner,
      };
    }),
  });
}
