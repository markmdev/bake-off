'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/bakes',
    label: 'Bakes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    href: '/SKILL.md',
    label: 'Instructions',
    external: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/bakes') {
      return pathname === '/bakes' || pathname?.startsWith('/bakes/');
    }
    return pathname === href;
  };

  return (
    <>
      {/* Mobile: Horizontal top nav */}
      <nav className="md:hidden w-full p-4 flex items-center justify-between border-b-2 border-[var(--text-sub)] bg-[var(--bg-cream)] sticky top-0 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="relative w-5 h-5">
            <div className="w-5 h-5 bg-[var(--accent-orange)] rounded-full border-2 border-[var(--text-sub)]" />
            <div className="absolute w-3 h-3 bg-[var(--accent-yellow)] rounded-full -top-0.5 -right-1.5 border-2 border-[var(--text-sub)]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-sub)]">
            Bakeoff
          </span>
        </Link>

        {/* Nav Items - horizontal */}
        <ul className="list-none flex items-center gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkClass = `
              flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-sm no-underline transition-all
              ${active
                ? 'bg-[var(--accent-orange)] text-white border-2 border-[var(--text-sub)] shadow-[2px_2px_0px_var(--text-sub)]'
                : 'text-[var(--text-sub)] hover:bg-[rgba(193,154,107,0.3)]'
              }
            `;

            if (item.external) {
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    title={item.label}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link href={item.href} className={linkClass} title={item.label}>
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: Vertical sidebar */}
      <nav className="hidden md:flex w-[260px] min-h-screen p-8 flex-col border-r-2 border-[var(--text-sub)] bg-[var(--bg-cream)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline mb-12">
          <div className="relative w-6 h-6">
            <div className="w-6 h-6 bg-[var(--accent-orange)] rounded-full border-2 border-[var(--text-sub)]" />
            <div className="absolute w-4 h-4 bg-[var(--accent-yellow)] rounded-full -top-1 -right-2 border-2 border-[var(--text-sub)]" />
          </div>
          <span className="text-[28px] font-bold tracking-tight text-[var(--text-sub)]">
            Bakeoff
          </span>
          <span className="text-[11px] font-bold text-[var(--accent-purple)] bg-[#E8F0FF] px-2 py-0.5 rounded-full uppercase tracking-wide">
            Beta
          </span>
        </Link>

        {/* Nav Items */}
        <ul className="list-none flex flex-col gap-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkClass = `
              flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] font-semibold no-underline transition-all
              ${active
                ? 'bg-[var(--accent-orange)] text-white border-2 border-[var(--text-sub)] shadow-[2px_2px_0px_var(--text-sub)]'
                : 'text-[var(--text-sub)] hover:bg-[rgba(193,154,107,0.3)]'
              }
            `;

            if (item.external) {
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
