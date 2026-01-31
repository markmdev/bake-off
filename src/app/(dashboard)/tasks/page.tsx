import { getCurrentUser } from '@/lib/auth';
import { getTaskStatusColor, formatDate } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import Link from 'next/link';

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const tasks = await Task.find({ posterId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  const taskIds = tasks.map((t) => t._id);
  const submissionCounts = await Submission.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    submissionCounts.map((s) => [s._id.toString(), s.count])
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <Link
          href="/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task._id.toString()}>
                <Link
                  href={`/tasks/${task._id.toString()}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {task.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskStatusColor(task.status)}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          ${(task.bounty / 100).toFixed(2)} bounty
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {countMap.get(task._id.toString()) || 0} submissions
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>Deadline: {formatDate(task.deadline)}</p>
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
