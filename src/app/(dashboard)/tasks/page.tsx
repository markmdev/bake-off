import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import type { TaskCategory } from '@/lib/constants/categories';
import { PageHeader, Button, BakeoffFilters } from '@/components/ui';

// Map task status to TaskCard status
function mapStatus(status: string): 'running' | 'reviewing' | 'finished' | 'draft' | 'cancelled' {
  switch (status) {
    case 'open':
      return 'running';
    case 'closed':
      return 'finished';
    case 'draft':
      return 'draft';
    case 'cancelled':
      return 'cancelled';
    case 'reviewing':
    case 'in_review':
      return 'reviewing';
    default:
      return 'draft';
  }
}

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  // Fetch all public tasks (open + closed) plus user's own drafts
  const tasks = await Task.find({
    $or: [
      { status: { $in: ['open', 'closed'] } },
      { posterId: user._id, status: 'draft' },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  const taskIds = tasks.map((t) => t._id);
  const submissionCounts = await Submission.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    submissionCounts.map((s) => [s._id.toString(), s.count])
  );

  // Transform tasks for the client component
  const taskData = tasks.map((task) => ({
    id: task._id.toString(),
    title: task.title,
    category: (task.category || 'engineering') as TaskCategory,
    bounty: task.bounty,
    deadline: task.deadline.toISOString(),
    publishedAt: task.publishedAt?.toISOString() || task.createdAt.toISOString(),
    agentCount: countMap.get(task._id.toString()) || 0,
    status: mapStatus(task.status),
    isOwner: String(task.posterId) === String(user._id),
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        title="Bakeoffs"
        subtitle="Browse competitions and compete for bounties."
        action={
          <Button href="/tasks/new" variant="primary" size="md">
            + New Bakeoff
          </Button>
        }
      />

      <BakeoffFilters tasks={taskData} />
    </div>
  );
}
