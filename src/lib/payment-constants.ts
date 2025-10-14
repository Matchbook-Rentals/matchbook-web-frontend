/**
 * Payment System Constants
 *
 * Centralized constants to avoid magic numbers throughout the payment system.
 * All currency, time, and payment processing constants are defined here.
 *
 * @module payment-constants
 */

// ============================================================================
// CURRENCY CONVERSION
// ============================================================================

/** Number of cents in one dollar */
export const CENTS_PER_DOLLAR = 100;

/** Number of dollars per cent (inverse of CENTS_PER_DOLLAR) */
export const DOLLARS_PER_CENT = 0.01;

// ============================================================================
// PERCENTAGE CONVERSION
// ============================================================================

/** Multiplier to convert decimal rate to percentage (0.03 → 3%) */
export const PERCENT_MULTIPLIER = 100;

/** Divisor to convert percentage to decimal rate (3% → 0.03) */
export const PERCENT_DIVISOR = 100;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

/** Milliseconds in one second */
export const MS_PER_SECOND = 1000;

/** Seconds in one minute */
export const SECONDS_PER_MINUTE = 60;

/** Minutes in one hour */
export const MINUTES_PER_HOUR = 60;

/** Hours in one day */
export const HOURS_PER_DAY = 24;

/** Milliseconds in one day */
export const MS_PER_DAY = MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

/** Days in one week */
export const DAYS_PER_WEEK = 7;

/** Milliseconds in one week */
export const MS_PER_WEEK = MS_PER_DAY * DAYS_PER_WEEK;

/** Average days per month (30.44 for precise calculations) */
export const DAYS_PER_MONTH_PRECISE = 30.44;

/** Approximate days per month (30 for simple calculations) */
export const DAYS_PER_MONTH_SIMPLE = 30;

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

/** Maximum number of retry attempts for failed payments */
export const MAX_PAYMENT_RETRIES = 3;

/** Wait time between payment method check retries (milliseconds) */
export const PAYMENT_METHOD_RETRY_DELAY_MS = 200;

/** Number of days before due date to show "due soon" status */
export const DUE_SOON_THRESHOLD_DAYS = 7;

/** Milliseconds threshold for "due soon" status */
export const DUE_SOON_THRESHOLD_MS = DUE_SOON_THRESHOLD_DAYS * MS_PER_DAY;

// ============================================================================
// ROUNDING PRECISION
// ============================================================================

/** Decimal places for currency precision */
export const CENTS_PRECISION = 2;

/** Allowed difference in cents for validation (rounding tolerance) */
export const CENTS_TOLERANCE = 1;

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Convert dollars to cents with safe rounding
 * @param dollars - Amount in dollars
 * @returns Amount in cents (integer)
 *
 * @example
 * dollarsToCents(10.99) // Returns 1099
 * dollarsToCents(10.9999) // Returns 1100 (rounded)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 *
 * @example
 * centsToDollars(1099) // Returns 10.99
 */
export function centsToDollars(cents: number): number {
  return cents / CENTS_PER_DOLLAR;
}

/**
 * Convert decimal rate to percentage string
 * @param rate - Rate as decimal (e.g., 0.03)
 * @returns Formatted percentage string (e.g., "3%")
 *
 * @example
 * rateToPercent(0.03) // Returns "3%"
 * rateToPercent(0.015) // Returns "1.5%"
 */
export function rateToPercent(rate: number): string {
  return `${(rate * PERCENT_MULTIPLIER).toFixed(1).replace(/\.0$/, '')}%`;
}

/**
 * Round amount to cents precision
 * Useful for avoiding floating point errors in dollar calculations
 *
 * @param amount - Amount in dollars
 * @returns Amount rounded to 2 decimal places
 *
 * @example
 * roundToCents(10.996) // Returns 11.00
 * roundToCents(10.994) // Returns 10.99
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * CENTS_PER_DOLLAR) / CENTS_PER_DOLLAR;
}

/**
 * Format amount in cents as currency string
 * @param cents - Amount in cents
 * @param includeSign - Whether to include $ sign (default: true)
 * @returns Formatted currency string
 *
 * @example
 * formatCentsAsCurrency(1099) // Returns "$10.99"
 * formatCentsAsCurrency(1099, false) // Returns "10.99"
 */
export function formatCentsAsCurrency(cents: number, includeSign: boolean = true): string {
  const dollars = centsToDollars(cents);
  const formatted = dollars.toFixed(CENTS_PRECISION);
  return includeSign ? `$${formatted}` : formatted;
}

/**
 * Check if two cent amounts are equal within tolerance
 * Useful for validating payment calculations with rounding
 *
 * @param amount1 - First amount in cents
 * @param amount2 - Second amount in cents
 * @returns Whether amounts are equal within tolerance
 *
 * @example
 * centsEqual(1099, 1100) // Returns true (within 1 cent tolerance)
 * centsEqual(1099, 1101) // Returns false (exceeds tolerance)
 */
export function centsEqual(amount1: number, amount2: number): boolean {
  return Math.abs(amount1 - amount2) <= CENTS_TOLERANCE;
}
