/**
 * Format milliseconds remaining as a human-readable duration string.
 * Examples: "2d 5h", "3h 45m", "12m", "Expired"
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format time remaining until a deadline as a human-readable string.
 */
export function formatDeadline(deadline: Date): string {
  const ms = deadline.getTime() - Date.now();
  return formatTimeRemaining(ms);
}
