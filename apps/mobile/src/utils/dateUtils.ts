import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

/**
 * Formats a timestamp for chat list display (WhatsApp style)
 * - Today: HH:mm
 * - Yesterday: "אתמול"
 * - This week: Day name
 * - Older: DD/MM/YYYY
 */
export function formatChatTimestamp(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const d = dayjs(date);
    if (!d.isValid()) return '';

    if (d.isToday()) {
      return d.format('HH:mm');
    }

    if (d.isYesterday()) {
      return 'אתמול';
    }

    // Within last 7 days: show day name
    const daysAgo = dayjs().diff(d, 'day');
    if (daysAgo < 7) {
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      return dayNames[d.day()];
    }

    // Older: DD/MM/YYYY
    return d.format('DD/MM/YYYY');
  } catch {
    return '';
  }
}

/**
 * Formats a date for display in DD/MM/YYYY format
 */
export function formatDateForDisplay(value: string | Date | null | undefined): string {
  if (!value) return '';
  
  try {
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format('DD/MM/YYYY');
    }
  } catch {
    return '';
  }
  
  return '';
}

/**
 * Formats a date-time for display in DD/MM/YYYY HH:mm format
 */
export function formatDateTimeForDisplay(value: string | Date | null | undefined): string {
  if (!value) return '';
  
  try {
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format('DD/MM/YYYY HH:mm');
    }
  } catch {
    return '';
  }
  
  return '';
}
