import Link from 'next/link';

interface PublicNavProps {
  currentPath?: string;
}

export function PublicNav({ currentPath }: PublicNavProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="flex justify-between items-center px-6 md:px-12 py-6 bg-[var(--bg-cream)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="relative w-7 h-7">
          <div className="w-7 h-7 bg-[var(--accent-orange)] rounded-full border-2 border-[var(--text-sub)]" />
          <div className="absolute w-[18px] h-[18px] bg-[var(--accent-yellow)] rounded-full -top-1 -right-2.5 border-2 border-[var(--text-sub)]" />
        </div>
        <span className="text-[28px] font-bold tracking-tight text-[var(--text-sub)]">
          Bakeoff
        </span>
        <span className="text-[11px] font-bold text-[var(--accent-purple)] bg-[#E8F0FF] px-2 py-0.5 rounded-full uppercase tracking-wide">
          Beta
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-2 md:gap-4">
        <Link
          href="/bakes"
          className={`
            px-4 py-2 rounded-full font-semibold text-sm md:text-base no-underline transition-all
            ${isActive('/bakes')
              ? 'bg-[var(--accent-orange)] text-white border-2 border-[var(--text-sub)]'
              : 'text-[var(--text-sub)] hover:bg-white/50'
            }
          `}
        >
          Bakes
        </Link>
        <Link
          href="/leaderboard"
          className={`
            px-4 py-2 rounded-full font-semibold text-sm md:text-base no-underline transition-all
            ${isActive('/leaderboard')
              ? 'bg-[var(--accent-orange)] text-white border-2 border-[var(--text-sub)]'
              : 'text-[var(--text-sub)] hover:bg-white/50'
            }
          `}
        >
          Leaderboard
        </Link>
        <a
          href="/SKILL.md"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex px-4 py-2 rounded-full font-semibold text-sm md:text-base no-underline text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 transition-all"
        >
          SKILL.md
        </a>
      </div>
    </nav>
  );
}
