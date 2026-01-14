/**
 * Fee structure for Matchbook platform
 *
 * TRANSFER FEE: Flat $7 fee charged for deposit transfers
 *   - Applied to security deposits and pet deposits
 *   - Always a flat rate regardless of deposit amount or trip duration
 *
 * SERVICE FEE: Percentage-based fee charged on monthly rent
 *   - 3% for trips shorter than 6 months
 *   - 1.5% for trips 6 months or longer
 *   - Applied to the monthly rent amount (base rent + pet rent)
 *   - NOT applied to deposits
 *
 * CREDIT CARD FEE: 3% self-inclusive processing fee
 *   - Applied when using credit/debit cards
 *   - No fee for ACH bank transfers
 *   - Self-inclusive calculation ensures we receive the intended amount
 *
 * IMPORTANT: Credit Card Fee Calculation
 * We use a self-inclusive 3% formula:
 *   totalToCharge = baseAmount / (1 - 0.03)
 *
 * Example: If base amount is $227:
 *   totalToCharge = $227 / 0.97 = $234.02
 *   creditCardFee = $234.02 - $227 = $7.02
 *   We receive: $227 ✓
 *
 * For complete payment specification, see /docs/payment-spec.md
 *
 * @module fee-constants
 */

import { PERCENT_MULTIPLIER, roundToCents, CENTS_PER_DOLLAR } from './payment-constants';

export const FEES = {
  /**
   * Flat deposit transfer fee for all deposit transactions
   * This is a fixed $7 fee regardless of deposit amount
   */
  TRANSFER_FEE_DOLLARS: 7,
  TRANSFER_FEE_CENTS: 700,
  
  /**
   * Service fee percentages based on trip duration
   * Applied to monthly rent amounts only
   */
  SERVICE_FEE: {
    /** 3% rate for trips shorter than 6 months */
    SHORT_TERM_RATE: 0.03,
    /** 1.5% rate for trips 6 months or longer */
    LONG_TERM_RATE: 0.015,
    /** Threshold in months for rate change */
    THRESHOLD_MONTHS: 6
  },
  
  /**
   * Credit card processing fee
   * 3% fee applied to ALL payments when using credit card
   * No fee for bank transfers (ACH)
   */
  CREDIT_CARD_FEE: {
    PERCENTAGE: 0.03   // 3%
  }
} as const;

/**
 * Calculate the service fee rate based on trip duration
 * @param tripMonths - Number of months for the trip
 * @returns The applicable service fee rate (0.03 or 0.015)
 */
export function getServiceFeeRate(tripMonths: number): number {
  return tripMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS
    ? FEES.SERVICE_FEE.LONG_TERM_RATE
    : FEES.SERVICE_FEE.SHORT_TERM_RATE;
}

/**
 * Calculate the service fee amount for a given rent
 * @param monthlyRent - The monthly rent amount
 * @param tripMonths - Number of months for the trip
 * @returns The calculated service fee amount
 */
export function calculateServiceFee(monthlyRent: number, tripMonths: number): number {
  const rate = getServiceFeeRate(tripMonths);
  return monthlyRent * rate;
}

/**
 * Get the deposit transfer fee amount
 * @returns The flat deposit transfer fee amount ($7)
 */
export function getTransferFee(): number {
  return FEES.TRANSFER_FEE_DOLLARS;
}

/**
 * Format fee rate as percentage for display
 * @param rate - The fee rate as decimal (e.g., 0.03)
 * @returns Formatted percentage string (e.g., "3%")
 */
export function formatFeeRate(rate: number): string {
  return `${(rate * PERCENT_MULTIPLIER).toFixed(1).replace(/\.0$/, '')}%`;
}

/**
 * Calculate credit card processing fee for a given amount
 * Uses 3% self-inclusive rate
 * @param amount - The amount we want to receive after fees
 * @returns The credit card processing fee
 */
export function calculateCreditCardFee(amount: number): number {
  // Self-inclusive calculation: totalAmount = baseAmount / (1 - 0.03)
  const totalWithFee = amount / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
  return roundToCents(totalWithFee - amount);
}

/**
 * Calculate the total amount to charge including credit card fee
 *
 * @param baseAmount - The base amount before fees
 * @returns The total amount to charge the customer
 *
 * @example
 * // If we want to receive $227 (deposits + deposit transfer fee)
 * const total = calculateTotalWithStripeCardFee(227); // Returns 234.02
 * // Fee is $7.02, total charged is $234.02, we receive $227
 */
export function calculateTotalWithStripeCardFee(baseAmount: number): number {
  return baseAmount + calculateCreditCardFee(baseAmount);
}

/**
 * Reverse calculate the base amount from a total that includes credit card fees
 * Used when we receive a total amount and need to determine the base
 *
 * @param totalWithFee - The total amount including credit card fees
 * @returns The base amount before fees
 *
 * @example
 * // If customer was charged $234.02
 * const base = reverseCalculateBaseAmount(234.02); // Returns 227
 */
export function reverseCalculateBaseAmount(totalWithFee: number): number {
  return roundToCents(totalWithFee / (1 + FEES.CREDIT_CARD_FEE.PERCENTAGE));
}

/**
 * Calculate total amount including credit card fee if applicable
 * @param amount - The base payment amount
 * @param isUsingCard - Whether payment method is credit card
 * @returns Total amount including processing fee if using card
 */
export function calculateTotalWithCardFee(amount: number, isUsingCard: boolean): number {
  return isUsingCard ? amount + calculateCreditCardFee(amount) : amount;
}