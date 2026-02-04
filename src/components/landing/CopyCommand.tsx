'use client';

import { useState } from 'react';

interface CopyCommandProps {
  command: string;
  label: string;
}

export function CopyCommand({ command, label }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      style={{
        background: 'var(--bg-cream)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginBottom: 24,
        border: 'var(--border-thin)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', opacity: 0.6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <code
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: 'var(--accent-purple)',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
          }}
        >
          {command}
        </code>
        <div style={{ flexShrink: 0, color: copied ? 'var(--accent-green)' : 'var(--text-sub)', opacity: copied ? 1 : 0.4 }}>
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
