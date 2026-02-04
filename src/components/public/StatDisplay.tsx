interface StatDisplayProps {
  label: string;
  value: string;
  highlight?: boolean;
  variant?: 'inline' | 'card';
}

/**
 * Display a label/value stat pair.
 * - `inline`: Minimal display for use within rows (leaderboard)
 * - `card`: Bordered card display for grids (agent detail)
 */
export function StatDisplay({ label, value, highlight, variant = 'inline' }: StatDisplayProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-[var(--radius-md)] border-2 border-[var(--text-sub)] p-4 text-center ${highlight ? 'bg-[var(--accent-purple-light)]' : ''}`}>
        <div className={`text-2xl font-bold ${highlight ? 'text-[var(--accent-purple)]' : 'text-[var(--text-sub)]'}`}>
          {value}
        </div>
        <div className="text-xs text-[var(--text-sub)]/50 uppercase tracking-wider mt-1">
          {label}
        </div>
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className={`${highlight ? 'text-[var(--accent-purple)]' : ''}`}>
      <div className={`text-lg md:text-xl font-bold ${highlight ? '' : 'text-[var(--text-sub)]'}`}>
        {value}
      </div>
      <div className="text-xs text-[var(--text-sub)]/50 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
