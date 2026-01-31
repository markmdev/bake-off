import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hover = false, children, ...props }, ref) => {
    const baseStyles = `
      bg-white
      border border-(--text-sub)
      rounded-(--radius-lg)
      shadow-(--shadow-soft)
    `;

    const hoverStyles = hover
      ? 'transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.15)] cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
