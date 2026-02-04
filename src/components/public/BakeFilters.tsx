'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface BakeFiltersProps {
  currentSort: string;
}

export function BakeFilters({ currentSort }: BakeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete('page'); // Reset to page 1 when changing sort
    router.push(`/bakes?${params.toString()}`);
  };

  return (
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
  );
}
