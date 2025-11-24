/**
 * Formats a phone number to Israeli format: 050-123-4567
 * 
 * Handles various input formats:
 * - 0501234567 -> 050-123-4567
 * - 050-123-4567 -> 050-123-4567 (already formatted)
 * - 972501234567 -> 050-123-4567 (removes country code)
 * - 050 123 4567 -> 050-123-4567 (removes spaces)
 * 
 * @param phone - The phone number to format (string or number)
 * @returns Formatted phone number or original value if it doesn't match expected format
 * 
 * @example
 * formatPhoneNumber("0501234567") // Returns "050-123-4567"
 * formatPhoneNumber("050-123-4567") // Returns "050-123-4567"
 * formatPhoneNumber("972501234567") // Returns "050-123-4567"
 * formatPhoneNumber("invalid") // Returns "invalid"
 */
export function formatPhoneNumber(phone: string | number | null | undefined): string {
  if (!phone) return "";
  
  // Convert to string and remove all non-digit characters
  const digitsOnly = String(phone).replace(/\D/g, "");
  
  // Handle Israeli phone numbers (10 digits starting with 05)
  if (digitsOnly.length === 10 && digitsOnly.startsWith("05")) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // Handle with country code (12 digits starting with 972)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("972")) {
    const withoutCountryCode = digitsOnly.slice(3);
    if (withoutCountryCode.startsWith("05")) {
      return `${withoutCountryCode.slice(0, 3)}-${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
    }
  }
  
  // Handle 9 digits (without leading 0)
  if (digitsOnly.length === 9 && digitsOnly.startsWith("5")) {
    return `0${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 5)}-${digitsOnly.slice(5)}`;
  }
  
  // If it doesn't match expected patterns, return original value
  return String(phone);
}

/**
 * Removes formatting from a phone number, returning only digits
 * 
 * @param phone - The phone number to clean
 * @returns Phone number with only digits
 * 
 * @example
 * unformatPhoneNumber("050-123-4567") // Returns "0501234567"
 * unformatPhoneNumber("050 123 4567") // Returns "0501234567"
 */
export function unformatPhoneNumber(phone: string | number | null | undefined): string {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * Validates Israeli phone numbers.
 * Accepts:
 * - 0501234567 (10 digits starting with 05)
 * - 501234567 (missing leading 0)
 * - 972501234567 (with country code)
 */
export function isValidIsraeliPhone(phone: string | number | null | undefined): boolean {
  if (phone === null || phone === undefined) return false;
  const digitsOnly = unformatPhoneNumber(phone);

  if (digitsOnly.length === 0) return false;

  // 10 digits starting with 05
  if (digitsOnly.length === 10 && digitsOnly.startsWith("05")) {
    return true;
  }

  // 9 digits starting with 5 (missing leading 0)
  if (digitsOnly.length === 9 && digitsOnly.startsWith("5")) {
    return true;
  }

  // With country code 972 + 9 digits (without 0)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("972")) {
    const withoutCountryCode = digitsOnly.slice(3);
    if (withoutCountryCode.length === 9 && withoutCountryCode.startsWith("5")) {
      return true;
    }
  }

  return false;
}

