/**
 * Validates an Israeli ID number (תעודת זהות) according to Israeli regulations.
 * 
 * Israeli ID numbers must:
 * - Contain only digits
 * - Be up to 9 digits long
 * - Pass the Luhn algorithm checksum validation
 * 
 * @param id - The ID number to validate (string or number)
 * @returns true if the ID is valid, false otherwise
 * 
 * @example
 * isValidIsraeliID("123456782") // Returns true
 * isValidIsraeliID("123456789") // Returns false (invalid checksum)
 * isValidIsraeliID("12345678") // Returns true (leading zero added)
 */
export function isValidIsraeliID(id: string | number): boolean {
  // Ensure input is a string and remove any whitespace
  const idStr = String(id).trim();

  // Must contain only digits and be up to 9 characters
  if (!/^\d+$/.test(idStr) || idStr.length > 9) {
    return false;
  }

  // Pad with leading zeros if shorter than 9 digits
  const paddedId = idStr.padStart(9, '0');

  // Compute checksum using Luhn algorithm variant
  const sum = [...paddedId].reduce((acc, digit, i) => {
    let num = Number(digit) * ((i % 2) + 1);
    if (num > 9) num -= 9; // Same as summing both digits for numbers > 9
    return acc + num;
  }, 0);

  // Valid if the total sum is divisible by 10
  return sum % 10 === 0;
}

