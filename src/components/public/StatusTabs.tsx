'use client';

import { useBakeParams } from '@/hooks/useBakeParams';
import { BAKE_STATUSES, type BakeStatus } from '@/lib/constants/statuses';

interface StatusTabsProps {
  counts: Record<BakeStatus, number>;
  currentStatus: string;
}

export function StatusTabs({ counts, currentStatus }: StatusTabsProps) {
  const { updateParams } = useBakeParams();

  const handleStatusChange = (status: BakeStatus) => {
    // 'open' is the default, so delete param for cleaner URL
    updateParams({ status: status === 'open' ? null : status });
  };

  return (
    <div className="inline-flex bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-md)] p-1 shadow-[2px_2px_0px_var(--text-sub)]">
      {(Object.keys(BAKE_STATUSES) as BakeStatus[]).map((status) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          className={`
            px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
            ${currentStatus === status
              ? 'bg-[var(--accent-purple)] text-white'
              : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
            }
          `}
        >
          {BAKE_STATUSES[status].label} ({counts[status].toLocaleString()})
        </button>
      ))}
    </div>
  );
}
