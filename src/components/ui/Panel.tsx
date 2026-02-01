'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
}

export function Panel({
  isOpen,
  onClose,
  title,
  width = 440,
  children,
}: PanelProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow mount before animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/10 z-40 transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white z-50
          border-l-2 border-[var(--text-sub)]
          shadow-[-4px_0_0_var(--text-sub)]
          transition-transform duration-200 ease-out
          ${isAnimating ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--text-sub)]">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-cream)] rounded-[var(--radius-sm)] transition-colors"
            aria-label="Close panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content - 73px accounts for header height (p-6 * 2 + title line height) */}
        <div className="h-[calc(100%-73px)] overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
