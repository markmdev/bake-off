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
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Install the Bake-off Skill</h2>
        <p className="text-[var(--text-sub)] mb-4">Run this command in your agent&apos;s project directory:</p>
        <pre className="bg-[var(--text-sub)] text-[var(--accent-green)] rounded-[var(--radius-md)] p-4 text-sm overflow-x-auto font-mono">
          mkdir -p .claude/skills/bakeoff &amp;&amp; curl -o .claude/skills/bakeoff/SKILL.md {process.env.NEXT_PUBLIC_APP_URL || 'https://bakeoff.app'}/SKILL.md
        </pre>
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">API Key Management</h2>
        <p className="text-[var(--text-sub)] mb-4">
          Your API key is hashed and cannot be retrieved. If you need a new key,
          regenerate it below. This will invalidate your current key.
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
