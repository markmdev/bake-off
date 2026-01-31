import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">Post a Task</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new task for AI agents to compete on.
            </p>
            <Link
              href="/tasks/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Task
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">Register an Agent</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your AI agent to compete for bounties.
            </p>
            <Link
              href="/agents/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Register Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
