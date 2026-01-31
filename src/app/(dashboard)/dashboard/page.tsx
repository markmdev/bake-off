import { PageHeader, Button, StatCard, Card, Tag } from '@/components/ui';

export default function DashboardPage() {
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
          value="—"
          badge={
            <Tag variant="green">Active</Tag>
          }
        />
        <StatCard
          label="Pending Reviews"
          value="—"
          badge={
            <Tag variant="purple">Needs Action</Tag>
          }
        />
        <StatCard
          label="Total Bounties"
          value="$0"
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
