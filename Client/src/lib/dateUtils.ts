import dayjs from "dayjs";

/**
 * Formats a date value to DD/MM/YYYY format for UI display.
 * This is the standard date format used throughout the application.
 * 
 * @param value - Date value (string, Date object, or null/undefined)
 * @returns Formatted date string in DD/MM/YYYY format, or empty string if value is invalid
 * 
 * @example
 * formatDateForDisplay("2024-01-15T00:00:00.000Z") // Returns "15/01/2024"
 * formatDateForDisplay(new Date()) // Returns formatted date
 * formatDateForDisplay(null) // Returns ""
 */
export function formatDateForDisplay(value: string | Date | null | undefined): string {
  if (!value) return "";
  
  // Handle Date objects
  if (value instanceof Date) {
    try {
      return dayjs(value).format("DD/MM/YYYY");
    } catch {
      return "";
    }
  }

  // Handle string values
  let dateStr = String(value).trim();
  
  // If the string contains ellipsis (truncated display), try to extract the date part
  // or reconstruct from the visible part
  if (dateStr.includes("...")) {
    // Try to find the actual date value from the row data if possible
    // For now, we'll try to parse what we have
    const parts = dateStr.split("...");
    // If we have something after the ellipsis that looks like time, it's likely a partial ISO string
    if (parts.length > 1) {
      const afterEllipsis = parts[parts.length - 1];
      // If it's just time, we can't reconstruct the date - return empty or try to parse anyway
      // The actual value might be in the database, so dayjs might still work
    }
  }

  try {
    // Try to parse the value as-is (dayjs is quite flexible)
    const parsed = dayjs(dateStr);
    if (parsed.isValid()) {
      return parsed.format("DD/MM/YYYY");
    }
  } catch {
    // If parsing fails, try to extract date from ISO string patterns
    const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      try {
        return dayjs(isoMatch[1]).format("DD/MM/YYYY");
      } catch {
        // Ignore
      }
    }
  }

  // If all parsing fails, return empty string for corrupted dates
  // or return the original value if it doesn't look like a date
  if (isDateValue(value)) {
    return ""; // Return empty for corrupted date values
  }
  
  return String(value);
}

/**
 * Formats a date value to DD/MM/YYYY HH:mm format for UI display with time.
 * 
 * @param value - Date value (string, Date object, or null/undefined)
 * @returns Formatted date string in DD/MM/YYYY HH:mm format, or empty string if value is invalid
 * 
 * @example
 * formatDateTimeForDisplay("2024-01-15T14:30:00.000Z") // Returns "15/01/2024 14:30"
 */
export function formatDateTimeForDisplay(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    return dayjs(value).format("DD/MM/YYYY HH:mm");
  } catch {
    return String(value);
  }
}

/**
 * Checks if a value appears to be a date string or Date object.
 * This function detects various date formats including ISO strings,
 * partial ISO strings, and common date patterns.
 * 
 * @param value - Value to check
 * @returns true if the value appears to be a date, false otherwise
 */
export function isDateValue(value: any): boolean {
  if (value instanceof Date) return true;
  if (typeof value !== "string") return false;
  if (!value || value.trim() === "") return false;

  const dateStr = value.trim();

  // If string contains ellipsis, it might be a truncated date string - try to extract the date part
  if (dateStr.includes("...")) {
    // Extract the part after the ellipsis
    const afterEllipsis = dateStr.split("...").pop() || "";
    // If it looks like a time/date pattern, treat it as a date
    if (/^\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(afterEllipsis) || /\.\d{3}Z$/.test(afterEllipsis)) {
      return true;
    }
  }

  // Common date patterns to check
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // YYYY-MM-DDThh:mm
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // YYYY-MM-DDThh:mm:ss
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$/, // ISO date with milliseconds
    /\.\d{3}Z$/, // Partial ISO string ending with .000Z (catches "...00:00:00.000Z" and "00:00:00.000Z")
    /\d{2}:\d{2}:\d{2}\.\d{3}Z/, // Time pattern with milliseconds anywhere (catches "...00:00:00.000Z")
    /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
    /T\d{2}:\d{2}/, // Contains time pattern (T followed by time)
  ];

  return datePatterns.some((pattern) => pattern.test(dateStr));
}

/**
 * Converts a date value from any format (ISO, Date object, etc.) to DD/MM/YYYY format for editing.
 * This is used when populating date inputs in edit dialogs.
 * 
 * @param value - Date value (string, Date object, or null/undefined)
 * @returns Formatted date string in DD/MM/YYYY format, or empty string if value is invalid
 * 
 * @example
 * formatDateForEdit("2024-01-15T00:00:00.000Z") // Returns "15/01/2024"
 * formatDateForEdit("2024-01-15") // Returns "15/01/2024"
 * formatDateForEdit(new Date()) // Returns formatted date
 */
export function formatDateForEdit(value: string | Date | null | undefined): string {
  return formatDateForDisplay(value);
}

/**
 * Converts a date string from DD/MM/YYYY format to ISO format (YYYY-MM-DD) for API submission.
 * This is used when submitting dates from edit dialogs to the backend.
 * 
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns ISO date string in YYYY-MM-DD format, or empty string if invalid
 * 
 * @example
 * parseDateForSubmit("15/01/2024") // Returns "2024-01-15"
 * parseDateForSubmit("invalid") // Returns ""
 */
export function parseDateForSubmit(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  
  const trimmed = dateStr.trim();
  if (!trimmed) return "";
  
  // Try to parse DD/MM/YYYY format
  const ddMmYyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    try {
      const parsed = dayjs(`${year}-${month}-${day}`);
      if (parsed.isValid()) {
        return parsed.format("YYYY-MM-DD");
      }
    } catch {
      return "";
    }
  }
  
  // If already in YYYY-MM-DD format, return as-is if valid
  const yyyyMmDdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyyMmDdMatch) {
    try {
      const parsed = dayjs(trimmed);
      if (parsed.isValid()) {
        return trimmed;
      }
    } catch {
      return "";
    }
  }
  
  // Try to parse with dayjs (it's flexible)
  try {
    const parsed = dayjs(trimmed);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }
  } catch {
    // Ignore
  }
  
  return "";
}

