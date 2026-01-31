import { forwardRef, SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full
          px-4 py-3
          bg-white
          border border-(--text-sub)
          rounded-(--radius-md)
          text-base text-(--text-main)
          outline-none
          transition-all duration-200
          cursor-pointer
          focus:border-(--accent-orange)
          focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
