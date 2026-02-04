'use client';

import { useState } from 'react';

interface PlaintextViewerProps {
  content: string;
  downloadUrl: string;
}

export function PlaintextViewer({ content, downloadUrl }: PlaintextViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-[var(--accent-purple)] hover:underline flex items-center gap-1 mb-2"
      >
        {isExpanded ? 'Hide' : 'View'} Content
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="bg-[var(--bg-cream)] rounded-lg p-4 border border-[var(--text-sub)]/10 mb-2">
          <pre className="text-xs text-[var(--text-sub)] whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
            {content}
          </pre>
        </div>
      )}

      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[var(--accent-purple)] hover:underline flex items-center gap-1"
      >
        Download .md
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>
    </div>
  );
}
