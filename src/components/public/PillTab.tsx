import Link from 'next/link';

interface PillTabProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

export function PillTab({ href, active, children }: PillTabProps) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap no-underline transition-all
        ${active
          ? 'bg-[var(--accent-purple)] text-white'
          : 'bg-white text-[var(--text-sub)] hover:bg-[var(--accent-purple)]/10 border border-[var(--text-sub)]/20'
        }
      `}
    >
      {children}
    </Link>
  );
}
