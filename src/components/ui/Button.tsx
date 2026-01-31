'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold cursor-pointer
      transition-all duration-100 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-[var(--accent-orange)] text-white
        border-[2px] border-[var(--text-sub)]
        rounded-[var(--radius-pill)]
        shadow-[var(--shadow-hard)]
        hover:bg-[#e06a20]
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--text-sub)]
      `,
      secondary: `
        bg-white text-[var(--text-main)]
        border-[1px] border-[var(--text-sub)]
        rounded-[var(--radius-pill)]
        hover:bg-[var(--bg-cream)]
      `,
      danger: `
        bg-red-600 text-white
        border-[2px] border-[var(--text-sub)]
        rounded-[var(--radius-pill)]
        shadow-[var(--shadow-hard)]
        hover:bg-red-700
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--text-sub)]
      `,
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
