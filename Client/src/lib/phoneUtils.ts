/**
 * Formats a phone number to Israeli format: 050-123-4567
 * 
 * Handles various input formats:
 * - 0501234567 -> 050-123-4567
 * - 050-123-4567 -> 050-123-4567 (already formatted)
 * - 972501234567 -> 050-123-4567 (removes country code)
 * - +972 54-588-8195 -> 054-588-8195 (removes country code, plus, spaces)
 * - 972545888195 -> 054-588-8195 (removes country code)
 * - 050 123 4567 -> 050-123-4567 (removes spaces)
 * - 545888195 -> 054-588-8195 (adds leading 0)
 * 
 * @param phone - The phone number to format (string or number)
 * @returns Formatted phone number in Israeli format (XXX-XXX-XXXX) or original value if cannot be formatted
 * 
 * @example
 * formatPhoneNumber("0501234567") // Returns "050-123-4567"
 * formatPhoneNumber("050-123-4567") // Returns "050-123-4567"
 * formatPhoneNumber("972501234567") // Returns "050-123-4567"
 * formatPhoneNumber("+972 54-588-8195") // Returns "054-588-8195"
 * formatPhoneNumber("972545888195") // Returns "054-588-8195"
 */
export function formatPhoneNumber(phone: string | number | null | undefined): string {
  if (!phone) return "";
  
  // Convert to string and remove all non-digit characters (removes +, spaces, dashes, etc.)
  const digitsOnly = String(phone).replace(/\D/g, "");
  
  // If no digits found, return empty string
  if (digitsOnly.length === 0) return "";
  
  let normalizedDigits = digitsOnly;
  
  // Handle with country code (12 digits starting with 972)
  // Also handles cases like +972 54-588-8195 which becomes 972545888195 after removing non-digits
  if (digitsOnly.length === 12 && digitsOnly.startsWith("972")) {
    normalizedDigits = digitsOnly.slice(3); // Remove country code (972)
  }
  // Handle 11 digits that might be 972 + 9 digits (without leading 0)
  else if (digitsOnly.length === 11 && digitsOnly.startsWith("972")) {
    normalizedDigits = digitsOnly.slice(3); // Remove country code
  }
  
  // Now normalize to 10 digits starting with 05
  // Handle 10 digits starting with 05 (correct format)
  if (normalizedDigits.length === 10 && normalizedDigits.startsWith("05")) {
    return `${normalizedDigits.slice(0, 3)}-${normalizedDigits.slice(3, 6)}-${normalizedDigits.slice(6)}`;
  }
  
  // Handle 9 digits starting with 5 (missing leading 0)
  if (normalizedDigits.length === 9 && normalizedDigits.startsWith("5")) {
    return `0${normalizedDigits.slice(0, 2)}-${normalizedDigits.slice(2, 5)}-${normalizedDigits.slice(5)}`;
  }
  
  // If it doesn't match expected patterns for Israeli phone numbers, 
  // return the original value (might be a different format or invalid)
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

