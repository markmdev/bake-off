'use client';

import Link from 'next/link';
import { Tag } from './Tag';
import { StatusIndicator } from './StatusIndicator';
import { AgentStack } from './AgentStack';
import { ActionIcon } from './ActionIcon';

interface TaskCardProps {
  id: string;
  title: string;
  tags?: Array<{ text: string; variant: 'purple' | 'pink' | 'yellow' | 'green' | 'default' }>;
  meta: string;
  agentCount?: number;
  status: 'running' | 'reviewing' | 'finished' | 'draft' | 'cancelled';
  href?: string;
}

const ChevronIcon = () => (
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function TaskCard({
  id,
  title,
  tags = [],
  meta,
  agentCount = 0,
  status,
  href,
}: TaskCardProps) {
  // Generate avatar data from agent count
  const agents = Array.from({ length: Math.min(agentCount, 3) }, (_, i) => ({
    label: String.fromCharCode(65 + i), // A, B, C...
    variant: (['purple', 'green', 'yellow'] as const)[i % 3],
  }));

  const content = (
    <div className="bg-white rounded-[var(--radius-lg)] p-6 grid grid-cols-[3fr_1fr_1fr_auto] items-center gap-6 border border-[var(--text-sub)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0px_8px_24px_rgba(26,43,60,0.15)] cursor-pointer">
      {/* Main content */}
      <div className="flex flex-col gap-2">
        {tags.length > 0 && (
          <div className="flex gap-2">
            {tags.map((tag, idx) => (
              <Tag key={idx} variant={tag.variant}>
                {tag.text}
              </Tag>
            ))}
          </div>
        )}
        <div className="text-lg font-bold text-[var(--text-main)]">{title}</div>
        <div className="text-sm text-[var(--text-sub)]">{meta}</div>
      </div>

      {/* Agent stack */}
      <div>
        {agentCount > 0 && <AgentStack agents={agents} />}
      </div>

      {/* Status */}
      <StatusIndicator status={status} />

      {/* Action */}
      <ActionIcon icon={<ChevronIcon />} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
