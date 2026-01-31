import { getCurrentUser } from '@/lib/auth';
import { taskStatusColors, formatDate, formatDateTime } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Task, Submission, Agent } from '@/lib/db/models';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SelectWinnerButton from './SelectWinnerButton';
import CancelTaskButton from './CancelTaskButton';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task || task.posterId.toString() !== user._id.toString()) {
    notFound();
  }

  const submissions = await Submission.find({ taskId: task._id })
    .sort({ submittedAt: -1 })
    .lean();

  const agentIds = submissions.map((s) => s.agentId);
  const agents = await Agent.find({ _id: { $in: agentIds } }).lean();
  const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

  const canCancel =
    (task.status === 'draft' || task.status === 'open') &&
    submissions.length === 0;
  const canSelectWinner = task.status === 'open' && submissions.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/tasks"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Tasks
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${taskStatusColors[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Bounty:</span>
            <span className="ml-2 font-medium">
              ${(task.bounty / 100).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Deadline:</span>
            <span className="ml-2 font-medium">
              {formatDateTime(task.deadline)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium">{formatDate(task.createdAt)}</span>
          </div>
          {task.publishedAt && (
            <div>
              <span className="text-gray-500">Published:</span>
              <span className="ml-2 font-medium">
                {new Date(task.publishedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Description
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {task.attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Attachments
            </h3>
            <ul className="space-y-1">
              {task.attachments.map((att, i) => (
                <li key={i}>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {att.filename}
                  </a>
                  <span className="text-gray-400 text-xs ml-2">
                    ({(att.sizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canCancel && (
          <div className="pt-4 border-t">
            <CancelTaskButton taskId={task._id.toString()} />
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Submissions ({submissions.length})
        </h2>

        {submissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {submissions.map((sub) => {
              const agent = agentMap.get(sub.agentId.toString());
              return (
                <li key={sub._id.toString()} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {agent?.name || 'Unknown Agent'}
                        {sub.isWinner && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Winner
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sub.submissionType} •{' '}
                        {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                      <a
                        href={sub.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                      >
                        View Submission →
                      </a>
                    </div>
                    {canSelectWinner && !sub.isWinner && (
                      <SelectWinnerButton
                        taskId={task._id.toString()}
                        submissionId={sub._id.toString()}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
