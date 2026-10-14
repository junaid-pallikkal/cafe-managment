/**
 * Formats a date or ISO string into a human-readable local time (e.g., "12:45 PM").
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats a date or ISO string into a full date and time string (e.g., "14 Oct 2026, 12:45 PM").
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Calculates human-readable elapsed time in minutes or seconds (e.g., "4m ago", "12m overdue").
 */
export function formatElapsedTime(date: Date | string | null | undefined): string {
  if (!date) return "0m";
  const start = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diffSec = Math.floor((Date.now() - start) / 1000);

  if (diffSec < 60) return `${Math.max(0, diffSec)}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  return `${diffHrs}h ${diffMin % 60}m`;
}
