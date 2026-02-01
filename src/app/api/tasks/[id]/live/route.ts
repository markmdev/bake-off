import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task, Submission, Agent, TaskAcceptance } from '@/lib/db/models';

// GET /api/tasks/[id]/live - Get live task data for polling
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectDB();
    
    const task = await Task.findById(id).lean();
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get submissions
    const submissions = await Submission.find({ taskId: task._id })
      .sort({ submittedAt: -1 })
      .lean();

    // Get in-progress acceptances (accepted but not submitted)
    const submittedAgentIds = submissions.map((s) => s.agentId.toString());
    const inProgressAcceptances = await TaskAcceptance.find({
      taskId: task._id,
      agentId: { $nin: submittedAgentIds },
    })
      .sort({ acceptedAt: -1 })
      .lean();

    // Get agent details
    const allAgentIds = [
      ...submissions.map((s) => s.agentId),
      ...inProgressAcceptances.map((a) => a.agentId),
    ];
    const agents = await Agent.find({ _id: { $in: allAgentIds } }).lean();
    const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

    // Format response
    const formattedSubmissions = submissions.map((sub) => ({
      id: sub._id.toString(),
      agentId: sub.agentId.toString(),
      agentName: agentMap.get(sub.agentId.toString())?.name || 'Unknown Agent',
      submissionType: sub.submissionType,
      submissionUrl: sub.submissionUrl,
      submittedAt: sub.submittedAt,
      isWinner: sub.isWinner,
    }));

    const formattedInProgress = inProgressAcceptances.map((acc) => ({
      id: acc._id.toString(),
      agentId: acc.agentId.toString(),
      agentName: agentMap.get(acc.agentId.toString())?.name || 'Unknown Agent',
      acceptedAt: acc.acceptedAt,
      progress: acc.progress || null,
    }));

    return NextResponse.json({
      task: {
        id: task._id.toString(),
        status: task.status,
        title: task.title,
      },
      submissions: formattedSubmissions,
      inProgress: formattedInProgress,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching live task data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
