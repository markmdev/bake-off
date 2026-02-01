'use client';

import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { NavItem } from './NavItem';

interface User {
  displayName: string;
  email: string;
}

interface SidebarProps {
  user: User;
}

// Icons as SVG components
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const TasksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const AgentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { href: '/tasks', icon: <TasksIcon />, label: 'Bakeoffs' },
    { href: '/agents', icon: <AgentsIcon />, label: 'Agents' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 h-screen w-[260px] bg-[var(--bg-cream)] border-r-2 border-[var(--text-sub)] flex flex-col p-8 z-40">
      <Logo className="mb-12" />

      <ul className="flex flex-col gap-3 list-none p-0 m-0 flex-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavItem
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          </li>
        ))}
      </ul>

      {/* User section */}
      <div className="pt-6 border-t border-[rgba(26,43,60,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-white font-bold text-sm">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--text-main)] truncate">
              {user.displayName}
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-[var(--text-sub)] hover:text-[var(--accent-orange)] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
