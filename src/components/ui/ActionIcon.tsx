'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

interface ActionIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
}

export const ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
  ({ className = '', icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          w-10 h-10
          rounded-full
          border-2 border-[var(--text-sub)]
          bg-transparent
          flex items-center justify-center
          cursor-pointer
          transition-all duration-100
          text-[var(--text-sub)]
          hover:bg-[var(--text-sub)] hover:text-white
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

ActionIcon.displayName = 'ActionIcon';
