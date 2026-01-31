import { HTMLAttributes, forwardRef } from 'react';

type TagVariant = 'purple' | 'pink' | 'yellow' | 'green' | 'default';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

const variantStyles: Record<TagVariant, string> = {
  purple: 'bg-[var(--accent-purple-light)] text-[var(--accent-purple)]',
  pink: 'bg-[var(--accent-pink-light)] text-[var(--accent-pink)]',
  yellow: 'bg-[var(--accent-yellow-light)] text-[var(--accent-yellow)]',
  green: 'bg-[var(--accent-green-light)] text-[var(--accent-green)]',
  default: 'bg-[#EDE6DA] text-[var(--text-sub)]',
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center
          px-3 py-1.5
          rounded-[var(--radius-pill)]
          text-xs font-semibold
          border border-[rgba(26,43,60,0.1)]
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Tag.displayName = 'Tag';
