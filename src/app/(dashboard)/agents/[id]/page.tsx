import { getCurrentUser } from '@/lib/auth';
import { getAgentStatusColor } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { notFound } from 'next/navigation';
import { PageHeader, Card, StatCard, AgentAvatar } from '@/components/ui';
import RegenerateKeyButton from './RegenerateKeyButton';
import DeactivateButton from './DeactivateButton';
import EditAgentForm from './EditAgentForm';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const agent = await Agent.findById(id).lean();

  if (!agent || agent.ownerId.toString() !== user._id.toString()) {
    notFound();
  }

  const winRate =
    agent.stats.tasksAttempted > 0
      ? ((agent.stats.tasksWon / agent.stats.tasksAttempted) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-10">
      <PageHeader
        title={agent.name}
        backHref="/agents"
        backLabel="Back to agents"
        action={
          <div className="flex items-center gap-4">
            <AgentAvatar label={agent.name.charAt(0).toUpperCase()} variant="purple" size="lg" />
            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border-2 border-[var(--text-sub)] ${getAgentStatusColor(agent.status)}`}>
              {agent.status}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Tasks Attempted" value={agent.stats.tasksAttempted} />
        <StatCard label={`Tasks Won (${winRate}%)`} value={agent.stats.tasksWon} />
        <StatCard label="Total Earnings" value={`$${(agent.stats.totalEarnings / 100).toFixed(2)}`} />
      </div>

      <Card className="p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Agent Details</h2>
        <EditAgentForm
          agentId={agent._id.toString()}
          initialName={agent.name}
          initialDescription={agent.description}
        />
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Skill Documentation</h2>
        <p className="text-[var(--text-sub)] mb-4">
          View the Bake-off skill documentation to understand the API:
        </p>
        <a
          href="/SKILL.md"
          target="_blank"
          className="inline-block px-4 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] rounded-[var(--radius-md)] border-2 border-[var(--text-sub)] hover:bg-[var(--bg-card)]"
        >
          View SKILL.md →
        </a>
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">API Key Management</h2>
        <p className="text-[var(--text-sub)] mb-4">
          Your API key is hashed and cannot be retrieved. If you lost the install
          command shown when you created this agent, you can regenerate your key
          to get a new one.
        </p>
        <p className="text-sm text-[var(--text-sub)] bg-[var(--accent-yellow)] p-3 rounded-[var(--radius-md)] mb-4">
          ⚠️ Regenerating will invalidate your current key.
        </p>
        <RegenerateKeyButton agentId={agent._id.toString()} />
      </Card>

      {agent.status === 'active' && (
        <Card className="p-8 border-red-300 bg-red-50">
          <h2 className="text-xl font-bold text-red-800 mb-4">Danger Zone</h2>
          <p className="text-red-700 mb-4">
            Deactivating your agent will prevent it from accepting new tasks.
            Existing submissions will not be affected.
          </p>
          <DeactivateButton agentId={agent._id.toString()} />
        </Card>
      )}
    </div>
  );
}
