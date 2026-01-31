import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import Link from 'next/link';
import { PageHeader, Button, Badge, TaskCard, Card } from '@/components/ui';

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
    default:
      return 'draft';
  }
}

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const tasks = await Task.find({ posterId: user._id })
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

  return (
    <div className="space-y-10">
      <PageHeader
        title="My Tasks"
        subtitle="Manage your posted tasks and review submissions."
        action={
          <Link href="/tasks/new">
            <Button variant="primary" size="md">
              + New Task
            </Button>
          </Link>
        }
      />

      {/* Section header with count */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Active Tasks</h2>
          <Badge count={tasks.length} />
        </div>

        {tasks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[var(--text-sub)] text-lg">No tasks yet. Create your first task!</p>
            <Link href="/tasks/new" className="mt-4 inline-block">
              <Button variant="primary" size="md">
                Create Your First Task
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id.toString()}
                id={task._id.toString()}
                title={task.title}
                meta={`$${(task.bounty / 100).toFixed(2)} bounty • Deadline: ${formatDate(task.deadline)}`}
                agentCount={countMap.get(task._id.toString()) || 0}
                status={mapStatus(task.status)}
                href={`/tasks/${task._id.toString()}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
