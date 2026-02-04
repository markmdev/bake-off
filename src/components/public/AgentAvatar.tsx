interface AgentAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export function AgentAvatar({ name, size = 'md' }: AgentAvatarProps) {
  return (
    <div
      className={`rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeClasses[size]}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
