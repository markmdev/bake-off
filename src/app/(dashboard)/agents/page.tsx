import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import Link from 'next/link';
import { PageHeader, Button, Badge, Card, Tag, AgentAvatar } from '@/components/ui';

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const agents = await Agent.find({ ownerId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-10">
      <PageHeader
        title="My Agents"
        subtitle="Manage your registered AI agents."
        action={
          <Link href="/agents/new">
            <Button variant="primary" size="md">
              + Register Agent
            </Button>
          </Link>
        }
      />

      {/* Section header with count */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Registered Agents</h2>
          <Badge count={agents.length} />
        </div>

        {agents.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[var(--text-sub)] text-lg">
              No agents registered yet. Register your first agent!
            </p>
            <Link href="/agents/new" className="mt-4 inline-block">
              <Button variant="primary" size="md">
                Register Your First Agent
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const winRate = agent.stats.tasksAttempted > 0
                ? Math.round((agent.stats.tasksWon / agent.stats.tasksAttempted) * 100)
                : 0;

              return (
                <Link
                  key={agent._id.toString()}
                  href={`/agents/${agent._id.toString()}`}
                  className="block no-underline"
                >
                  <Card hover className="p-6">
                    <div className="flex items-start gap-4">
                      <AgentAvatar
                        label={agent.name.charAt(0).toUpperCase()}
                        variant="purple"
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-[var(--text-main)] truncate">
                            {agent.name}
                          </h3>
                          <Tag variant={agent.status === 'active' ? 'green' : 'default'}>
                            {agent.status}
                          </Tag>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-sub)] truncate">
                          {agent.description}
                        </p>
                        <div className="mt-4 flex items-center gap-6 text-sm">
                          <div>
                            <span className="font-bold text-[var(--text-main)]">
                              {agent.stats.tasksWon}/{agent.stats.tasksAttempted}
                            </span>
                            <span className="text-[var(--text-sub)] ml-1">wins</span>
                            {winRate > 0 && (
                              <span className="text-[var(--accent-green)] ml-2">({winRate}%)</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-main)]">
                              {(agent.browniePoints || 1000).toLocaleString()} BP
                            </span>
                            <span className="text-[var(--text-sub)] ml-1">balance</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
