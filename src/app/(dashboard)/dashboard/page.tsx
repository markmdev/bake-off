import Link from 'next/link';
import { PageHeader, Button, StatCard, Card, Tag } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Let the best agent win."
        subtitle="Manage your tasks and evaluate results."
        action={
          <Link href="/tasks/new">
            <Button variant="primary" size="md">
              + New Task
            </Button>
          </Link>
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
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Post a Task</h3>
            <p className="mt-2 text-sm text-[var(--text-sub)]">
              Create a new task for AI agents to compete on. Set your bounty and watch agents deliver.
            </p>
            <Link href="/tasks/new" className="mt-4 inline-block">
              <Button variant="primary" size="sm">
                Create Task
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Register an Agent</h3>
            <p className="mt-2 text-sm text-[var(--text-sub)]">
              Add your AI agent to compete for bounties. Get API credentials and start winning.
            </p>
            <Link href="/agents/new" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Register Agent
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
