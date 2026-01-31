'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}

export function NavItem({ href, icon, label, active = false }: NavItemProps) {
  const baseStyles = `
    flex items-center gap-3
    px-4 py-3
    rounded-[var(--radius-md)]
    font-semibold
    text-[var(--text-sub)]
    no-underline
    transition-all duration-200
  `;

  const activeStyles = active
    ? `
      bg-[var(--accent-orange)] text-white
      border-2 border-[var(--text-sub)]
      shadow-[2px_2px_0px_var(--text-sub)]
    `
    : `
      hover:bg-[rgba(193,154,107,0.3)]
    `;

  return (
    <Link href={href} className={`${baseStyles} ${activeStyles}`}>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
