import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  badge?: ReactNode;
  subtext?: string;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className = '', label, value, badge, subtext, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-[var(--surface-tan)]
          rounded-[var(--radius-lg)]
          p-6
          border border-[var(--text-sub)]
          shadow-[var(--shadow-soft)]
          ${className}
        `}
        {...props}
      >
        <span className="text-sm font-semibold text-[var(--text-sub)] uppercase tracking-wide">
          {label}
        </span>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-4xl font-bold text-[var(--text-main)]">{value}</span>
          {badge}
          {subtext && (
            <span className="text-sm text-[var(--text-sub)] font-medium">{subtext}</span>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';
