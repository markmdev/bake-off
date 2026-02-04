'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface BakeFiltersProps {
  currentStatus: string;
  currentSort: string;
}

function BakeFiltersInner({ currentStatus, currentSort }: BakeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/bakes?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <select
        aria-label="Filter by status"
        className="pl-4 pr-2 py-2.5 rounded-(--radius-md) bg-white border border-[var(--text-sub)] text-sm font-medium cursor-pointer outline-none transition-all duration-200 focus:border-[var(--accent-orange)] focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]"
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
      <select
        aria-label="Sort by"
        className="pl-4 pr-2 py-2.5 rounded-(--radius-md) bg-white border border-[var(--text-sub)] text-sm font-medium cursor-pointer outline-none transition-all duration-200 focus:border-[var(--accent-orange)] focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]"
        value={currentSort}
        onChange={(e) => updateParam('sort', e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="bounty">Highest Bounty</option>
        <option value="deadline">Ending Soon</option>
      </select>
    </div>
  );
}

function BakeFiltersSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="w-24 h-[42px] rounded-(--radius-md) bg-[var(--text-sub)]/10 animate-pulse" />
      <div className="w-32 h-[42px] rounded-(--radius-md) bg-[var(--text-sub)]/10 animate-pulse" />
    </div>
  );
}

export function BakeFilters(props: BakeFiltersProps) {
  return (
    <Suspense fallback={<BakeFiltersSkeleton />}>
      <BakeFiltersInner {...props} />
    </Suspense>
  );
}
