/**
 * Utility functions for number validation in forms
 */

export const MAX_ALLOWED_NUMBER = 10000000;

/**
 * Formats a number with commas for display
 * @param value The number or string to format
 * @returns The formatted string with commas
 */
export function formatNumberWithCommas(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
  if (isNaN(numValue)) return '';
  return numValue.toLocaleString('en-US');
}

/**
 * Removes commas from a number string and returns the raw number
 * @param value The formatted string with commas
 * @returns The raw number string without commas
 */
export function removeCommasFromNumber(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Server-side validation to cap numeric values at the maximum allowed limit
 * This provides security against malicious clients bypassing client-side validation
 */
export function capNumberValue(value: number | null | undefined, maxValue: number = MAX_ALLOWED_NUMBER): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || isNaN(value)) return null;
  if (value < 0) return 0;
  return Math.min(value, maxValue);
}

/**
 * Validates and caps a number string to the maximum allowed value
 * @param value The string value to validate
 * @param allowDecimals Whether to allow decimal points
 * @param maxValue Maximum allowed value (defaults to MAX_ALLOWED_NUMBER)
 * @param formatWithCommas Whether to format the output with commas
 * @returns The validated and capped string value
 */
export function validateAndCapNumber(
  value: string, 
  allowDecimals: boolean = false, 
  maxValue: number = MAX_ALLOWED_NUMBER,
  formatWithCommas: boolean = false
): string {
  // Remove all non-numeric characters (except decimal point if allowed, and commas)
  const regex = allowDecimals ? /[^0-9.,]/g : /[^0-9,]/g;
  let cleaned = value.replace(regex, '');
  
  // Remove commas for validation
  const rawNumber = removeCommasFromNumber(cleaned);
  
  // Handle decimal point validation if decimals are allowed
  if (allowDecimals) {
    // Only allow one decimal point
    const parts = rawNumber.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    } else {
      cleaned = rawNumber;
    }
  } else {
    cleaned = rawNumber;
  }
  
  // Convert to number and check against maximum
  const numValue = parseFloat(cleaned);
  if (!isNaN(numValue) && numValue > maxValue) {
    const cappedValue = maxValue.toString();
    return formatWithCommas ? formatNumberWithCommas(cappedValue) : cappedValue;
  }
  
  // Return formatted or raw value
  if (formatWithCommas && cleaned && !isNaN(parseFloat(cleaned))) {
    return formatNumberWithCommas(cleaned);
  }
  
  return cleaned;
}

/**
 * Creates an onChange handler that validates and caps numbers
 * @param onChange The original onChange handler
 * @param allowDecimals Whether to allow decimal points
 * @param maxValue Maximum allowed value (defaults to MAX_ALLOWED_NUMBER)
 * @param formatWithCommas Whether to format the display value with commas
 * @returns A new onChange handler with validation
 */
export function createNumberChangeHandler(
  onChange: (value: string) => void,
  allowDecimals: boolean = false,
  maxValue: number = MAX_ALLOWED_NUMBER,
  formatWithCommas: boolean = false
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedValue = validateAndCapNumber(e.target.value, allowDecimals, maxValue, formatWithCommas);
    onChange(validatedValue);
  };
}

/**
 * Creates an onBlur handler that ensures the value doesn't exceed the maximum
 * @param value Current value
 * @param onChange The onChange handler
 * @param allowDecimals Whether to allow decimal points
 * @param onCapped Optional callback when value is capped
 * @param maxValue Maximum allowed value (defaults to MAX_ALLOWED_NUMBER)
 * @param formatWithCommas Whether to format the display value with commas
 * @returns An onBlur handler that caps the value
 */
export function createNumberBlurHandler(
  value: string,
  onChange: (value: string) => void,
  allowDecimals: boolean = false,
  onCapped?: (originalValue: string, cappedValue: string) => void,
  maxValue: number = MAX_ALLOWED_NUMBER,
  formatWithCommas: boolean = false
) {
  return () => {
    const validatedValue = validateAndCapNumber(value, allowDecimals, maxValue, formatWithCommas);
    if (validatedValue !== value) {
      onChange(validatedValue);
      if (onCapped) {
        onCapped(value, validatedValue);
      }
    }
  };
}