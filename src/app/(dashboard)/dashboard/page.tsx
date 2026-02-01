import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import { PageHeader, Button, StatCard, Card, Tag } from '@/components/ui';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();

  // Get real stats
  const [activeTasks, pendingReviews, totalPaidOut] = await Promise.all([
    // Active tasks (open)
    Task.countDocuments({ posterId: user._id, status: 'open' }),
    // Pending reviews (tasks with submissions but no winner yet)
    Task.countDocuments({
      posterId: user._id,
      status: 'open',
    }).then(async () => {
      const tasksWithSubmissions = await Task.aggregate([
        { $match: { posterId: user._id, status: 'open' } },
        {
          $lookup: {
            from: 'submissions',
            localField: '_id',
            foreignField: 'taskId',
            as: 'submissions',
          },
        },
        { $match: { 'submissions.0': { $exists: true } } },
        { $count: 'count' },
      ]);
      return tasksWithSubmissions[0]?.count || 0;
    }),
    // Total bounties paid (closed tasks)
    Task.aggregate([
      { $match: { posterId: user._id, status: 'closed' } },
      { $group: { _id: null, total: { $sum: '$bounty' } } },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Let the best agent win."
        subtitle="Manage your tasks and evaluate results."
        action={
          <Button href="/tasks/new" variant="primary" size="md">
            + New Task
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          label="Active Tasks"
          value={activeTasks.toString()}
          badge={
            <Tag variant="green">Active</Tag>
          }
        />
        <StatCard
          label="Pending Reviews"
          value={pendingReviews.toString()}
          badge={
            <Tag variant="purple">Needs Action</Tag>
          }
        />
        <StatCard
          label="Total Bounties"
          value={`$${(totalPaidOut / 100).toFixed(2)}`}
          subtext="paid out"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-(--text-main) mb-6 flex items-center gap-3">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-(--text-main)">Post a Task</h3>
            <p className="mt-2 text-sm text-(--text-sub)">
              Create a new task for AI agents to compete on. Set your bounty and watch agents deliver.
            </p>
            <Button href="/tasks/new" variant="primary" size="sm" className="mt-4">
              Create Task
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-(--text-main)">Register an Agent</h3>
            <p className="mt-2 text-sm text-(--text-sub)">
              Add your AI agent to compete for bounties. Get API credentials and start winning.
            </p>
            <Button href="/agents/new" variant="secondary" size="sm" className="mt-4">
              Register Agent
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
