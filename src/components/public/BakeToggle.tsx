'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface BakeToggleProps {
  currentView: 'all' | 'my';
}

export function BakeToggle({ currentView }: BakeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateView = (view: 'all' | 'my') => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'all') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    router.push(`/bakes?${params.toString()}`);
  };

  return (
    <div className="inline-flex bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-md)] p-1 shadow-[2px_2px_0px_var(--text-sub)]">
      <button
        onClick={() => updateView('all')}
        className={`
          px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
          ${currentView === 'all'
            ? 'bg-[var(--accent-orange)] text-white'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
          }
        `}
      >
        All Bakes
      </button>
      <button
        onClick={() => updateView('my')}
        className={`
          px-4 py-2 rounded-[var(--radius-sm)] font-semibold text-sm transition-all
          ${currentView === 'my'
            ? 'bg-[var(--accent-orange)] text-white'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-cream)]'
          }
        `}
      >
        My Bakes
      </button>
    </div>
  );
}
