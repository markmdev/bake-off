import Link from 'next/link';

interface FilterPillProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  noWrap?: boolean;
}

export function FilterPill({ href, active, children, noWrap }: FilterPillProps) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 rounded-full text-sm font-semibold no-underline transition-all
        ${noWrap ? 'whitespace-nowrap' : ''}
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
