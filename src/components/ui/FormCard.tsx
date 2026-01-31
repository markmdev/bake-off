import { HTMLAttributes, forwardRef } from 'react';

type FormCardProps = HTMLAttributes<HTMLDivElement>;

export const FormCard = forwardRef<HTMLDivElement, FormCardProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white
          border-[2px] border-[var(--text-sub)]
          rounded-[var(--radius-lg)]
          p-10
          shadow-[var(--shadow-hard)]
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
