import { getCurrentUser } from '@/lib/auth';
import { agentStatusColors } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import Link from 'next/link';

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const agents = await Agent.find({ ownerId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Agents</h1>
        <Link
          href="/agents/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          Register Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No agents registered yet. Register your first agent!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <li key={agent._id.toString()}>
                <Link
                  href={`/agents/${agent._id.toString()}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-600 truncate">
                        {agent.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agentStatusColors[agent.status]}`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {agent.stats.tasksWon}/{agent.stats.tasksAttempted}{' '}
                          wins
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          ${(agent.stats.totalEarnings / 100).toFixed(2)} earned
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="truncate max-w-xs">{agent.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
