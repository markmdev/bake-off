import type { ReactNode } from 'react';

interface StepProps {
  number: number;
  color: string;
  children: ReactNode;
}

export function Step({ number, color, children }: StepProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 16,
          flexShrink: 0,
          border: '2px solid var(--text-sub)',
        }}
      >
        {number}
      </div>
      <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-sub)' }}>{children}</span>
    </div>
  );
}
