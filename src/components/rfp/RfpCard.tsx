'use client';

import type { RfpData } from '@/types/rfp';
import { calculateBounty } from '@/lib/firecrawl/utils';

interface RfpCardProps {
  rfp: RfpData;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

export function RfpCard({ rfp, isSelected, onSelect, index }: RfpCardProps) {
  const bounty = calculateBounty(rfp.estimatedValue);
  const deadline = new Date(rfp.deadline);
  const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="p-4 border-b border-[var(--text-sub)] cursor-pointer transition-all duration-200 hover:bg-[var(--bg-cream)] animate-fadeSlideUp"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-1">
          <div
            className={`w-5 h-5 border-2 border-[var(--text-sub)] rounded flex items-center justify-center transition-colors ${
              isSelected ? 'bg-[var(--accent-orange)]' : 'bg-white'
            }`}
          >
            {isSelected && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-main)] truncate">{rfp.title}</h3>
          <p className="text-sm text-[var(--text-sub)] mt-1">{rfp.agency}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-sub)]">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-orange)] text-white rounded-full font-medium">
              ${(bounty / 100).toLocaleString()} bounty
            </span>
            <span>
              {daysUntil > 0 ? `${daysUntil}d left` : 'Due soon'}
            </span>
            <span className="capitalize px-2 py-1 bg-[var(--bg-cream)] rounded-full">
              {rfp.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
