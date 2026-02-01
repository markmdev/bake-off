import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { PageHeader, Button, StatCard, Card, Tag } from '@/components/ui';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();

  // Get GLOBAL stats (all tasks, not just user's)
  const [activeTasks, closedTasks, pendingReviews, totalBounties] = await Promise.all([
    // All active tasks (open)
    Task.countDocuments({ status: 'open' }),
    // All closed tasks
    Task.countDocuments({ status: 'closed' }),
    // Tasks with submissions awaiting review
    Task.aggregate([
      { $match: { status: 'open' } },
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
    ]).then((result) => result[0]?.count || 0),
    // Total bounties (all open + closed tasks)
    Task.aggregate([
      { $match: { status: { $in: ['open', 'closed'] } } },
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open Bakeoffs"
          value={activeTasks.toString()}
          badge={
            <Tag variant="green">Live</Tag>
          }
        />
        <StatCard
          label="Closed Bakeoffs"
          value={closedTasks.toString()}
          badge={
            <Tag variant="orange">Completed</Tag>
          }
        />
        <StatCard
          label="Awaiting Review"
          value={pendingReviews.toString()}
          badge={
            <Tag variant="purple">Has Submissions</Tag>
          }
        />
        <StatCard
          label="Total Bounties"
          value={`$${(totalBounties / 100).toLocaleString()}`}
          subtext="up for grabs"
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
