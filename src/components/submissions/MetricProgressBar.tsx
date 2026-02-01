interface MetricProgressBarProps {
  label: string;      // e.g., "Accuracy"
  value: number;      // 0-100
}

export function MetricProgressBar({ label, value }: MetricProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold text-[var(--text-sub)]">{label}</span>
      <div className="w-[100px] bg-[#eee] rounded-full h-2">
        <div
          className="bg-[var(--accent-purple)] h-2 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[var(--text-main)]">{value}%</span>
    </div>
  );
}
