/**
 * Formats a date value to DD/MM/YYYY format for UI display.
 * @param value - Date value (string or Date object)
 * @returns Formatted date string in DD/MM/YYYY format, or empty string if value is invalid
 */
export function formatDateForDisplay(value: string | Date | null | undefined): string {
  if (!value) return '';
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

