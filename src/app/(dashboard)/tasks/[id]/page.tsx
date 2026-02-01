import { getCurrentUser } from '@/lib/auth';
import { getTaskStatusColor, formatDate, formatDateTime } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { notFound } from 'next/navigation';
import { PageHeader, Card, Badge } from '@/components/ui';
import CancelTaskButton from './CancelTaskButton';
import { LiveInProgress, LiveSubmissions } from '@/components/LiveTaskUpdates';
import ResearchProgress from '@/components/tasks/ResearchProgress';

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

  if (!task) {
    notFound();
  }

  // Check if user is the task owner (for edit/cancel permissions)
  const isOwner = task.posterId.toString() === user._id.toString();
  const taskId = task._id.toString();
  
  const canCancel =
    isOwner &&
    (task.status === 'draft' || task.status === 'open');

  return (
    <div className="space-y-10">
      <PageHeader
        title={task.title}
        backHref="/tasks"
        backLabel="Back to tasks"
        action={
          <span className={`px-4 py-1.5 text-sm font-bold rounded-full border-2 border-[var(--text-sub)] ${getTaskStatusColor(task.status)}`}>
            {task.status}
          </span>
        }
      />

      {task.research && (
        <ResearchProgress
          taskId={task._id.toString()}
          initialStatus={task.research.status}
        />
      )}

      <Card className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b-2 border-dashed border-[rgba(26,43,60,0.1)]">
          <div>
            <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Bounty</div>
            <div className="text-xl font-bold text-[var(--accent-orange)]">${(task.bounty / 100).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Deadline</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{formatDateTime(task.deadline)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Created</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{formatDate(task.createdAt)}</div>
          </div>
          {task.publishedAt && (
            <div>
              <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Published</div>
              <div className="text-xl font-bold text-[var(--text-main)]">{formatDate(task.publishedAt)}</div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-[var(--text-sub)] mb-3 uppercase tracking-wide">Description</h3>
          <div className="prose prose-sm max-w-none text-[var(--text-main)] whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {task.attachments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-[var(--text-sub)] mb-3 uppercase tracking-wide">Attachments</h3>
            <ul className="space-y-2">
              {task.attachments.map((att, i) => (
                <li key={i}>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-main)] hover:text-[var(--accent-orange)] font-medium transition-colors"
                  >
                    {att.filename}
                  </a>
                  <span className="text-[var(--text-sub)] opacity-60 text-sm ml-2">
                    ({(att.sizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canCancel && (
          <div className="pt-6 border-t-2 border-dashed border-[rgba(26,43,60,0.1)]">
            <CancelTaskButton taskId={task._id.toString()} />
          </div>
        )}
      </Card>

      {/* In Progress Section - Live Updates */}
      {task.status === 'open' && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-main)]">In Progress</h2>
            <span className="text-xs text-green-600 font-medium animate-pulse">● LIVE</span>
          </div>
          <LiveInProgress taskId={taskId} />
        </Card>
      )}

      {/* Submissions Section - Live Updates */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Submissions</h2>
          <span className="text-xs text-green-600 font-medium animate-pulse">● LIVE</span>
        </div>
        <LiveSubmissions taskId={taskId} canSelectWinner={task.status === 'open'} isOwner={isOwner} />
      </Card>
    </div>
  );
}
