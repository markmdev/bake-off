interface AgentAvatarProps {
  label: string;
  variant?: 'purple' | 'green' | 'yellow' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  purple: 'bg-(--accent-purple) text-white',
  green: 'bg-(--accent-green) text-white',
  yellow: 'bg-(--accent-yellow) text-(--text-main)',
  default: 'bg-[#DDD] text-(--text-main)',
};

const sizeStyles = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-9 h-9 text-[10px]',
  lg: 'w-14 h-14 text-xl',
};

export function AgentAvatar({
  label,
  variant = 'default',
  size = 'md',
  className = '',
}: AgentAvatarProps) {
  return (
    <div
      className={`
        rounded-full
        border-2 border-white
        flex items-center justify-center
        font-bold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {label}
    </div>
  );
}
