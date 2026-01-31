import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = '/dashboard', className = '' }: LogoProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2
        text-[28px] font-bold
        tracking-tight
        text-(--text-sub)
        no-underline
        ${className}
      `}
    >
      {/* Dual-circle brand mark */}
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 bg-(--accent-orange) rounded-full border-2 border-(--text-sub)" />
        <div className="absolute -top-1 -right-2 w-4 h-4 bg-(--accent-yellow) rounded-full border-2 border-(--text-sub)" />
      </div>
      <span>Bakeoff</span>
    </Link>
  );
}
