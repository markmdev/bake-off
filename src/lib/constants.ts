export const taskStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const agentStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

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
