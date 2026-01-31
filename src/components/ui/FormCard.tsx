import { HTMLAttributes, forwardRef } from 'react';

type FormCardProps = HTMLAttributes<HTMLDivElement>;

export const FormCard = forwardRef<HTMLDivElement, FormCardProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white
          border-2 border-(--text-sub)
          rounded-(--radius-lg)
          p-10
          shadow-(--shadow-hard)
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormCard.displayName = 'FormCard';
