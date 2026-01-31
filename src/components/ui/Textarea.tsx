import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full
          px-4 py-3
          bg-white
          border border-[var(--text-sub)]
          rounded-[var(--radius-md)]
          text-base text-[var(--text-main)]
          outline-none
          transition-all duration-200
          placeholder:text-[var(--text-sub)] placeholder:opacity-40
          focus:border-[var(--accent-orange)]
          focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-y min-h-[120px]
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
