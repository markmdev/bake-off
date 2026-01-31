interface StatusIndicatorProps {
  status: 'running' | 'reviewing' | 'finished' | 'draft' | 'cancelled';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  running: {
    color: 'var(--accent-green)',
    label: 'Running',
    pulse: true,
  },
  reviewing: {
    color: 'var(--accent-purple)',
    label: 'Reviewing',
    pulse: false,
  },
  finished: {
    color: 'var(--text-sub)',
    label: 'Finished',
    pulse: false,
  },
  draft: {
    color: '#9CA3AF',
    label: 'Draft',
    pulse: false,
  },
  cancelled: {
    color: '#DC2626',
    label: 'Cancelled',
    pulse: false,
  },
};

export function StatusIndicator({
  status,
  showLabel = true,
  className = '',
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-1.5 font-semibold text-sm ${className}`}
      style={{ color: config.color }}
    >
      <div
        className={config.pulse ? 'animate-[pulse_2s_infinite]' : ''}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: config.pulse ? `0 0 0 4px ${config.color}33` : 'none',
        }}
      />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
