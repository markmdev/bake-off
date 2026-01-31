import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count?: number;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', count, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center justify-center
          px-2.5 py-0.5
          rounded-[var(--radius-pill)]
          text-sm font-semibold
          bg-[var(--accent-purple)] text-white
          ${className}
        `}
        {...props}
      >
        {count !== undefined ? count : children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
