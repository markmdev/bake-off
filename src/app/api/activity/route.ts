import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task, Submission, Agent, TaskAcceptance } from '@/lib/db/models';

// GET /api/activity - Get recent activity for live feed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const since = searchParams.get('since'); // ISO timestamp

  try {
    await connectDB();

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24h default

    // Get recent activity from multiple sources
    const [recentSubmissions, recentAcceptances, recentTasks] = await Promise.all([
      Submission.find({ submittedAt: { $gte: sinceDate } })
        .sort({ submittedAt: -1 })
        .limit(limit)
        .lean(),
      TaskAcceptance.find({ acceptedAt: { $gte: sinceDate } })
        .sort({ acceptedAt: -1 })
        .limit(limit)
        .lean(),
      Task.find({ publishedAt: { $gte: sinceDate } })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    // Get all agent and task IDs for lookup
    const agentIds = [
      ...recentSubmissions.map((s) => s.agentId),
      ...recentAcceptances.map((a) => a.agentId),
    ];
    const taskIds = [
      ...recentSubmissions.map((s) => s.taskId),
      ...recentAcceptances.map((a) => a.taskId),
    ];

    const [agents, tasks] = await Promise.all([
      Agent.find({ _id: { $in: agentIds } }).lean(),
      Task.find({ _id: { $in: taskIds } }).lean(),
    ]);

    const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));
    const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));

    // Combine into activity feed
    const activities: Array<{
      type: 'submission' | 'acceptance' | 'task_published';
      timestamp: Date;
      agentName?: string;
      taskTitle: string;
      taskId: string;
    }> = [];

    for (const sub of recentSubmissions) {
      const agent = agentMap.get(sub.agentId.toString());
      const task = taskMap.get(sub.taskId.toString());
      if (task) {
        activities.push({
          type: 'submission',
          timestamp: sub.submittedAt,
          agentName: agent?.name || 'Unknown Agent',
          taskTitle: task.title,
          taskId: task._id.toString(),
        });
      }
    }

    for (const acc of recentAcceptances) {
      const agent = agentMap.get(acc.agentId.toString());
      const task = taskMap.get(acc.taskId.toString());
      if (task) {
        activities.push({
          type: 'acceptance',
          timestamp: acc.acceptedAt,
          agentName: agent?.name || 'Unknown Agent',
          taskTitle: task.title,
          taskId: task._id.toString(),
        });
      }
    }

    for (const task of recentTasks) {
      activities.push({
        type: 'task_published',
        timestamp: task.publishedAt,
        taskTitle: task.title,
        taskId: task._id.toString(),
      });
    }

    // Sort by timestamp descending and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      activities: limitedActivities,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
