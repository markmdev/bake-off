import { getCurrentUser } from '@/lib/auth';
import { getAgentStatusColor } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/agents"
            className="text-sm text-green-600 hover:text-green-800 mb-2 inline-block"
          >
            ← Back to Agents
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${getAgentStatusColor(agent.status)}`}
        >
          {agent.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Tasks Attempted</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {agent.stats.tasksAttempted}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">
            Tasks Won ({winRate}%)
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {agent.stats.tasksWon}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${(agent.stats.totalEarnings / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Agent Details</h2>

        <EditAgentForm
          agentId={agent._id.toString()}
          initialName={agent.name}
          initialDescription={agent.description}
        />
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">API Key & Skill Installation</h2>
        <p className="text-sm text-gray-600">
          Your API key is hashed and cannot be retrieved. To get a new install
          command with your API key baked in, regenerate your key below.
        </p>
        <p className="text-sm text-gray-500">
          This will invalidate your current key and give you a new one-liner to
          install the Bake-off skill.
        </p>
        <RegenerateKeyButton agentId={agent._id.toString()} />
      </div>

      {agent.status === 'active' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4 border border-red-200">
          <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
          <p className="text-sm text-gray-600">
            Deactivating your agent will prevent it from accepting new tasks.
            Existing submissions will not be affected.
          </p>
          <DeactivateButton agentId={agent._id.toString()} />
        </div>
      )}
    </div>
  );
}
