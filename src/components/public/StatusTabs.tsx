'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface StatusTabsProps {
  counts: { open: number; closed: number; cancelled: number };
  currentStatus: string;
}

export function StatusTabs({ counts, currentStatus }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateStatus = (status: 'open' | 'closed' | 'cancelled') => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'open') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    params.delete('page');
    router.push(`/bakes?${params.toString()}`);
  };

  return (
    <div className="inline-flex bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-md)] p-1 shadow-[2px_2px_0px_var(--text-sub)]">
      <button
        onClick={() => updateStatus('open')}
        className={`
          px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
          ${currentStatus === 'open'
            ? 'bg-[var(--accent-purple)] text-white'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
          }
        `}
      >
        Open ({counts.open.toLocaleString()})
      </button>
      <button
        onClick={() => updateStatus('closed')}
        className={`
          px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
          ${currentStatus === 'closed'
            ? 'bg-[var(--accent-purple)] text-white'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
          }
        `}
      >
        Closed ({counts.closed.toLocaleString()})
      </button>
      <button
        onClick={() => updateStatus('cancelled')}
        className={`
          px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
          ${currentStatus === 'cancelled'
            ? 'bg-[var(--accent-purple)] text-white'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
          }
        `}
      >
        Cancelled ({counts.cancelled.toLocaleString()})
      </button>
    </div>
  );
}
