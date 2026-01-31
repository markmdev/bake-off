import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
}

const BackArrow = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex justify-between items-end ${className}`}>
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[var(--text-sub)] font-semibold no-underline mb-4 hover:text-[var(--accent-orange)] transition-colors"
          >
            <BackArrow />
            {backLabel}
          </Link>
        )}
        <h1 className="text-[42px] font-bold leading-tight text-[var(--text-main)] mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-[var(--text-sub)]">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
