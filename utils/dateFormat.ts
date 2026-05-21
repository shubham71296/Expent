import { format } from 'date-fns';

/** e.g. 16 April 2026 */
export function formatDisplayDate(date: Date | string): string {
  return format(new Date(date), 'd MMMM yyyy');
}

/** e.g. 16 April 2026, 3:30 PM */
export function formatDisplayDateTime(date: Date | string): string {
  return format(new Date(date), 'd MMMM yyyy, h:mm a');
}

/** e.g. Saturday, 16 April 2026 · 3:30 PM */
export function formatDisplayHeaderDateTime(date: Date | string): string {
  return format(new Date(date), 'EEEE, d MMMM yyyy · h:mm a');
}

/** e.g. 16dec26 — used in export filenames */
export function formatExportDateSlug(date: Date | string): string {
  return format(new Date(date), 'dMMMyy').toLowerCase();
}
