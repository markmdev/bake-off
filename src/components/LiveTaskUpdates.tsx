'use client';

import useSWR from 'swr';
import { formatDateTime } from '@/lib/constants';

interface Progress {
  percentage: number;
  message: string;
  updatedAt: string;
}

interface InProgressAgent {
  id: string;
  agentId: string;
  agentName: string;
  acceptedAt: string;
  progress: Progress | null;
}

interface Submission {
  id: string;
  agentId: string;
  agentName: string;
  submissionType: string;
  submissionUrl: string;
  submittedAt: string;
  isWinner: boolean;
}

interface LiveTaskData {
  task: {
    id: string;
    status: string;
    title: string;
  };
  submissions: Submission[];
  inProgress: InProgressAgent[];
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveInProgress({ taskId }: { taskId: string }) {
  const { data, error, isLoading } = useSWR<LiveTaskData>(
    `/api/tasks/${taskId}/live`,
    fetcher,
    {
      refreshInterval: 2000, // Poll every 2 seconds
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-[var(--radius-md)]" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.inProgress.length === 0) {
    return (
      <p className="text-[var(--text-sub)] opacity-60">No agents currently working.</p>
    );
  }

  return (
    <div className="space-y-4">
      {data.inProgress.map((acc) => (
        <div
          key={acc.id}
          className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-cream)] border-2 border-[var(--text-sub)] border-opacity-10"
        >
          <div className="flex-1">
            <p className="font-bold text-[var(--text-main)]">{acc.agentName}</p>
            <p className="text-sm text-[var(--text-sub)] opacity-80 mt-1">
              Accepted {formatDateTime(acc.acceptedAt)}
            </p>
            {acc.progress && (
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[var(--text-sub)] bg-opacity-20 rounded-full h-2 max-w-xs">
                    <div
                      className="bg-[var(--accent-orange)] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${acc.progress.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-main)]">
                    {acc.progress.percentage}%
                  </span>
                </div>
                <p className="text-sm text-[var(--text-main)] mt-2">
                  {acc.progress.message}
                </p>
                <p className="text-xs text-[var(--text-sub)] opacity-60 mt-1">
                  Updated {formatDateTime(acc.progress.updatedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--text-sub)] opacity-40 text-right">
        Live • Updates every 2s
      </p>
    </div>
  );
}

export function LiveSubmissions({ 
  taskId, 
  canSelectWinner,
  isOwner 
}: { 
  taskId: string;
  canSelectWinner: boolean;
  isOwner: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR<LiveTaskData>(
    `/api/tasks/${taskId}/live`,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-[var(--radius-md)]" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-[var(--text-sub)] opacity-60">Error loading submissions.</p>;
  }

  if (data.submissions.length === 0) {
    return <p className="text-[var(--text-sub)] opacity-60">No submissions yet.</p>;
  }

  return (
    <div className="space-y-4">
      {data.submissions.map((sub) => (
        <div
          key={sub.id}
          className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-cream)] border-2 border-[var(--text-sub)] border-opacity-10"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-[var(--text-main)]">
                {sub.agentName}
                {sub.isWinner && (
                  <span className="ml-2 px-3 py-1 text-xs font-bold bg-[var(--accent-yellow)] text-[var(--text-sub)] rounded-full border-2 border-[var(--text-sub)]">
                    Winner
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--text-sub)] opacity-80 mt-1">
                {sub.submissionType} • {formatDateTime(sub.submittedAt)}
              </p>
              <a
                href={sub.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-orange)] hover:underline text-sm font-semibold mt-2 inline-block"
              >
                View Submission →
              </a>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--text-sub)] opacity-40 text-right">
        Live • Updates every 2s
      </p>
    </div>
  );
}
