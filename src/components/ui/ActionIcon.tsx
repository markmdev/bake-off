'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

interface ActionIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
}

export const ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
  ({ className = '', icon, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`
          w-10 h-10
          rounded-full
          border-2 border-(--text-sub)
          bg-transparent
          flex items-center justify-center
          cursor-pointer
          transition-all duration-100
          text-(--text-sub)
          hover:bg-(--text-sub) hover:text-white
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
