'use client';

import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-semibold cursor-pointer
  transition-all duration-100 ease-in-out
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const variants = {
  primary: `
    bg-(--accent-orange) text-white
    border-2 border-(--text-sub)
    rounded-(--radius-pill)
    shadow-(--shadow-hard)
    hover:bg-[#e06a20]
    active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--text-sub)]
  `,
  secondary: `
    bg-white text-(--text-main)
    border border-(--text-sub)
    rounded-(--radius-pill)
    hover:bg-(--bg-cream)
  `,
  danger: `
    bg-red-600 text-white
    border-2 border-(--text-sub)
    rounded-(--radius-pill)
    shadow-(--shadow-hard)
    hover:bg-red-700
    active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--text-sub)]
  `,
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    if ('href' in props && props.href) {
      const { href, ...linkProps } = props as ButtonAsLink;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClassName}
          {...linkProps}
        >
          {children}
        </Link>
      );
    }

    const { type = 'button', ...buttonProps } = props as ButtonAsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={combinedClassName}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
