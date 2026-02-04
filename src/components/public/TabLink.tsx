import Link from 'next/link';

interface TabLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

export function TabLink({ href, isActive, children }: TabLinkProps) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }`}
    >
      {children}
    </Link>
  );
}
