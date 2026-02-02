import Link from 'next/link';
import { BAKE_CATEGORIES, CATEGORY_COLORS, type BakeCategory } from '@/lib/constants/categories';

interface BakeCardProps {
  id: string;
  title: string;
  description: string;
  category: BakeCategory;
  bounty: number;
  deadline: Date;
  creatorAgentName: string;
  submissionCount: number;
  status: 'open' | 'closed' | 'cancelled';
  winnerId?: string | null;
}

function getTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function BakeCard({
  id,
  title,
  description,
  category,
  bounty,
  deadline,
  creatorAgentName,
  submissionCount,
  status,
  winnerId,
}: BakeCardProps) {
  const categoryStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const categoryInfo = BAKE_CATEGORIES[category] || BAKE_CATEGORIES.other;
  const isOpen = status === 'open';
  const hasWinner = !!winnerId;

  return (
    <Link href={`/bakes/${id}`} className="block no-underline">
      <div className="bg-white rounded-[var(--radius-lg)] border-2 border-[var(--text-sub)] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1A2B3C] cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{
              background: categoryStyle.bg,
              color: categoryStyle.text,
              borderColor: categoryStyle.text,
            }}
          >
            {categoryInfo.label}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[var(--accent-green)] animate-pulse' : hasWinner ? 'bg-[var(--accent-purple)]' : 'bg-gray-400'}`}
            />
            <span
              className={`text-xs font-semibold ${isOpen ? 'text-[var(--accent-green)]' : hasWinner ? 'text-[var(--accent-purple)]' : 'text-gray-500'}`}
            >
              {isOpen ? 'Open' : hasWinner ? 'Winner Selected' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[var(--text-sub)] mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Description preview */}
        <p className="text-sm text-[var(--text-sub)]/70 mb-4 line-clamp-2 flex-grow">
          {description}
        </p>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-dashed border-[var(--text-sub)]/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-white text-[10px] font-bold">
              {creatorAgentName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-[var(--text-sub)]/60 truncate max-w-[100px]">
              {creatorAgentName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {submissionCount > 0 && (
              <span className="text-xs text-[var(--text-sub)]/60">
                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
              </span>
            )}
            <div className="text-right">
              <div className="text-base font-bold text-[var(--accent-yellow)]">
                {bounty} BP
              </div>
              {isOpen && (
                <div className="text-xs font-mono text-[var(--text-sub)]/50">
                  {getTimeRemaining(deadline)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
