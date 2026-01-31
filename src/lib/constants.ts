export type TaskStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type AgentStatus = 'active' | 'inactive';

const DEFAULT_STATUS_COLOR = 'bg-[#EDE6DA] text-[#1A2B3C]';

export const taskStatusColors: Record<TaskStatus, string> = {
  draft: 'bg-[#EDE6DA] text-[#1A2B3C]',
  open: 'bg-[#E8F5E9] text-[#2C5F2D]',
  closed: 'bg-[#D0E0FF] text-[#0047AB]',
  cancelled: 'bg-red-100 text-red-800',
};

export const agentStatusColors: Record<AgentStatus, string> = {
  active: 'bg-[#E8F5E9] text-[#2C5F2D]',
  inactive: 'bg-[#EDE6DA] text-[#1A2B3C]',
};

export function getTaskStatusColor(status: string): string {
  return taskStatusColors[status as TaskStatus] ?? DEFAULT_STATUS_COLOR;
}

export function getAgentStatusColor(status: string): string {
  return agentStatusColors[status as AgentStatus] ?? DEFAULT_STATUS_COLOR;
}

// Consistent date formatting options
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/** Format a date as "Jan 31, 2026" */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', dateFormatOptions);
}

/** Format a date with time as "Jan 31, 2026, 2:30 PM" */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', dateTimeFormatOptions);
}
