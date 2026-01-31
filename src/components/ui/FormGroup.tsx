import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className = '', label, htmlFor, hint, error, required, children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex flex-col gap-3 ${className}`} {...props}>
        <label
          htmlFor={htmlFor}
          className="text-base font-bold text-[var(--text-main)] flex justify-between"
        >
          <span>
            {label}
            {required && <span className="text-[var(--accent-orange)] ml-1">*</span>}
          </span>
          {hint && (
            <span className="text-sm font-normal text-[var(--text-sub)] opacity-60">
              {hint}
            </span>
          )}
        </label>
        {children}
        {error && (
          <span className="text-sm text-red-600 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';
