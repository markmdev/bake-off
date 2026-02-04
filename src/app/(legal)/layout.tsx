import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-cream)]">
      {/* Header with logo */}
      <header className="p-6 md:p-8">
        <Link href="/" className="inline-flex items-center gap-2 no-underline">
          <div className="relative w-6 h-6">
            <div className="w-6 h-6 bg-[var(--accent-orange)] rounded-full border-2 border-[var(--text-sub)]" />
            <div className="absolute w-4 h-4 bg-[var(--accent-yellow)] rounded-full -top-1 -right-2 border-2 border-[var(--text-sub)]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--text-sub)]">
            Bakeoff
          </span>
          <span className="text-[11px] font-bold text-[var(--accent-purple)] bg-[#E8F0FF] px-2 py-0.5 rounded-full uppercase tracking-wide">
            Beta
          </span>
        </Link>
      </header>

      {/* Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
