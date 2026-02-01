'use client';

interface RfpProgressBarProps {
  progress: number;
  message: string;
}

export function RfpProgressBar({ progress, message }: RfpProgressBarProps) {
  return (
    <div className="p-4 bg-[var(--bg-cream)] border-b border-[var(--text-sub)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-main)]">{message}</span>
        <span className="text-sm font-mono text-[var(--text-sub)]">{progress}%</span>
      </div>
      <div className="h-2 bg-white border border-[var(--text-sub)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent-orange)] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
