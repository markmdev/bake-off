'use client';

import { forwardRef, TextareaHTMLAttributes, useRef, useCallback, useState, useEffect } from 'react';

type MarkdownTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const MarkdownTextarea = forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  ({ className = '', onKeyDown, onChange, defaultValue, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = useState(defaultValue?.toString() || '');

    // Sync with controlled value
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value.toString());
      }
    }, [value]);

    const getTextareaRef = () => {
      if (typeof ref === 'function') return internalRef.current;
      return ref?.current || internalRef.current;
    };

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = getTextareaRef();
        if (!textarea) return;

        const { selectionStart, selectionEnd } = textarea;
        const currentValue = textarea.value;

        // Handle Enter key for list continuation
        if (e.key === 'Enter' && !e.shiftKey) {
          const beforeCursor = currentValue.substring(0, selectionStart);
          const lines = beforeCursor.split('\n');
          const currentLine = lines[lines.length - 1];

          // Check for bullet points (* or -)
          const bulletMatch = currentLine.match(/^(\s*)([\*\-])\s+(.*)$/);
          if (bulletMatch) {
            const [, indent, marker, content] = bulletMatch;
            // If line is empty bullet, remove it
            if (!content.trim()) {
              e.preventDefault();
              const lineStart = beforeCursor.lastIndexOf('\n') + 1;
              const newValue = currentValue.substring(0, lineStart) + currentValue.substring(selectionStart);
              updateValue(newValue, lineStart);
              return;
            }
            // Continue bullet list
            e.preventDefault();
            const insertion = `\n${indent}${marker} `;
            const newValue = currentValue.substring(0, selectionStart) + insertion + currentValue.substring(selectionEnd);
            updateValue(newValue, selectionStart + insertion.length);
            return;
          }

          // Check for numbered lists
          const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (numberedMatch) {
            const [, indent, num, content] = numberedMatch;
            // If line is empty numbered item, remove it
            if (!content.trim()) {
              e.preventDefault();
              const lineStart = beforeCursor.lastIndexOf('\n') + 1;
              const newValue = currentValue.substring(0, lineStart) + currentValue.substring(selectionStart);
              updateValue(newValue, lineStart);
              return;
            }
            // Continue numbered list
            e.preventDefault();
            const nextNum = parseInt(num) + 1;
            const insertion = `\n${indent}${nextNum}. `;
            const newValue = currentValue.substring(0, selectionStart) + insertion + currentValue.substring(selectionEnd);
            updateValue(newValue, selectionStart + insertion.length);
            return;
          }

          // Check for checkbox lists
          const checkboxMatch = currentLine.match(/^(\s*)([\*\-])\s+\[([ x])\]\s+(.*)$/i);
          if (checkboxMatch) {
            const [, indent, marker, , content] = checkboxMatch;
            // If line is empty checkbox, remove it
            if (!content.trim()) {
              e.preventDefault();
              const lineStart = beforeCursor.lastIndexOf('\n') + 1;
              const newValue = currentValue.substring(0, lineStart) + currentValue.substring(selectionStart);
              updateValue(newValue, lineStart);
              return;
            }
            // Continue checkbox list
            e.preventDefault();
            const insertion = `\n${indent}${marker} [ ] `;
            const newValue = currentValue.substring(0, selectionStart) + insertion + currentValue.substring(selectionEnd);
            updateValue(newValue, selectionStart + insertion.length);
            return;
          }
        }

        // Handle Tab for indentation
        if (e.key === 'Tab') {
          e.preventDefault();
          const beforeCursor = currentValue.substring(0, selectionStart);
          const afterCursor = currentValue.substring(selectionEnd);

          if (e.shiftKey) {
            // Outdent: remove leading spaces/tab from current line
            const lineStart = beforeCursor.lastIndexOf('\n') + 1;
            const lineContent = currentValue.substring(lineStart, selectionStart);
            if (lineContent.startsWith('  ')) {
              const newValue = currentValue.substring(0, lineStart) + lineContent.substring(2) + afterCursor;
              updateValue(newValue, selectionStart - 2);
            } else if (lineContent.startsWith('\t')) {
              const newValue = currentValue.substring(0, lineStart) + lineContent.substring(1) + afterCursor;
              updateValue(newValue, selectionStart - 1);
            }
          } else {
            // Indent: add two spaces
            const newValue = beforeCursor + '  ' + afterCursor;
            updateValue(newValue, selectionStart + 2);
          }
          return;
        }

        // Pass through to parent handler
        onKeyDown?.(e);
      },
      [onKeyDown]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = getTextareaRef();
        if (!textarea) return;

        let newValue = e.target.value;
        let cursorPos = textarea.selectionStart;
        const prevValue = internalValue;

        // Only process if something was added (not deleted)
        if (newValue.length > prevValue.length) {
          const insertedChar = newValue.charAt(cursorPos - 1);
          const beforeInsert = newValue.substring(0, cursorPos - 1);
          const afterInsert = newValue.substring(cursorPos);

          // Check if we just typed a space after * or - at start of line
          if (insertedChar === ' ') {
            const lines = beforeInsert.split('\n');
            const currentLine = lines[lines.length - 1];

            // Convert "* " or "- " at line start to bullet
            if (currentLine === '*' || currentLine === '-') {
              // Already a valid markdown bullet, keep as is
            }

            // Convert "1. " etc to numbered list (already valid markdown)
            // No conversion needed, markdown is already correct
          }

          // Auto-close brackets and quotes
          const pairs: Record<string, string> = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            "'": "'",
            '`': '`',
          };

          if (pairs[insertedChar] && !afterInsert.startsWith(pairs[insertedChar])) {
            // Check if we should auto-close (not if next char is alphanumeric)
            const nextChar = afterInsert.charAt(0);
            if (!nextChar || /[\s\n\r,.\-)]/.test(nextChar)) {
              newValue = beforeInsert + insertedChar + pairs[insertedChar] + afterInsert;
              // Cursor stays between the pair
            }
          }

          // Bold with ** - when typing second *
          if (insertedChar === '*' && beforeInsert.endsWith('*') && !beforeInsert.endsWith('**')) {
            // User typed **, don't auto-complete yet, wait for closing
          }
        }

        // Update state
        if (value === undefined) {
          setInternalValue(newValue);
        }

        // Create synthetic event with new value
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        onChange?.(syntheticEvent);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          const ta = getTextareaRef();
          if (ta) {
            ta.selectionStart = cursorPos;
            ta.selectionEnd = cursorPos;
          }
        });
      },
      [onChange, internalValue, value]
    );

    const updateValue = (newValue: string, cursorPos: number) => {
      const textarea = getTextareaRef();
      if (!textarea) return;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      // Create synthetic event
      const syntheticEvent = {
        target: { value: newValue, name: textarea.name },
        currentTarget: { value: newValue, name: textarea.name },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onChange?.(syntheticEvent);

      // Set cursor position after React re-render
      requestAnimationFrame(() => {
        const ta = getTextareaRef();
        if (ta) {
          ta.value = newValue;
          ta.selectionStart = cursorPos;
          ta.selectionEnd = cursorPos;
        }
      });
    };

    const combinedRef = (node: HTMLTextAreaElement | null) => {
      (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <div className="relative">
        <textarea
          ref={combinedRef}
          value={value !== undefined ? value : internalValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          className={`
            w-full
            px-4 py-3
            bg-white
            border border-(--text-sub)
            rounded-(--radius-md)
            text-base text-(--text-main)
            font-mono
            outline-none
            transition-all duration-200
            placeholder:text-(--text-sub) placeholder:opacity-40
            focus:border-(--accent-orange)
            focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-y min-h-[120px]
            ${className}
          `}
          {...props}
        />
        <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-none">
          <span className="text-xs text-(--text-sub) opacity-40 bg-white px-1">
            Markdown
          </span>
        </div>
      </div>
    );
  }
);

MarkdownTextarea.displayName = 'MarkdownTextarea';
