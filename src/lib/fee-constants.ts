/**
 * Fee structure for Matchbook platform
 * 
 * TRANSFER FEE: Flat $5 fee charged for deposit transfers
 *   - Applied to security deposits and pet deposits
 *   - Always a flat rate regardless of deposit amount or trip duration
 * 
 * SERVICE FEE: Percentage-based fee charged on monthly rent
 *   - 3% for trips 6 months or shorter
 *   - 1.5% for trips longer than 6 months
 *   - Applied to the monthly rent amount (base rent + pet rent)
 *   - NOT applied to deposits
 * 
 * CREDIT CARD FEE: Stripe's processing fee (2.9% + $0.30)
 *   - Applied when using credit/debit cards
 *   - No fee for ACH bank transfers
 *   - Uses inclusive calculation to ensure we receive the intended amount
 * 
 * IMPORTANT: Stripe Fee Calculation
 * When charging via Stripe, they deduct their fee (2.9% + $0.30) from the total.
 * To ensure we receive the intended amount, we use an inclusive formula:
 *   totalToCharge = (desiredAmount + 0.30) / (1 - 0.029)
 * 
 * Example: If we need $100 after fees:
 *   totalToCharge = (100 + 0.30) / (1 - 0.029) = $103.30
 *   Stripe takes: $103.30 * 0.029 + $0.30 = $3.30
 *   We receive: $103.30 - $3.30 = $100.00 ✓
 * 
 * @module fee-constants
 */

export const FEES = {
  /**
   * Flat transfer fee for all deposit transactions
   * This is a fixed $5 fee regardless of deposit amount
   */
  TRANSFER_FEE: 5,
  
  /**
   * Service fee percentages based on trip duration
   * Applied to monthly rent amounts only
   */
  SERVICE_FEE: {
    /** 3% rate for trips 6 months or shorter */
    SHORT_TERM_RATE: 0.03,
    /** 1.5% rate for trips longer than 6 months */
    LONG_TERM_RATE: 0.015,
    /** Threshold in months for rate change */
    THRESHOLD_MONTHS: 6
  },
  
  /**
   * Credit card processing fee (Stripe's actual fees)
   * 2.9% + $0.30 fee applied to ALL payments when using credit card
   * No fee for bank transfers (ACH)
   */
  CREDIT_CARD_FEE: {
    PERCENTAGE: 0.029,  // 2.9%
    FIXED: 0.30        // $0.30
  }
} as const;

/**
 * Calculate the service fee rate based on trip duration
 * @param tripMonths - Number of months for the trip
 * @returns The applicable service fee rate (0.03 or 0.015)
 */
export function getServiceFeeRate(tripMonths: number): number {
  return tripMonths > FEES.SERVICE_FEE.THRESHOLD_MONTHS 
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
 * Get the transfer fee amount
 * @returns The flat transfer fee amount ($5)
 */
export function getTransferFee(): number {
  return FEES.TRANSFER_FEE;
}

/**
 * Format fee rate as percentage for display
 * @param rate - The fee rate as decimal (e.g., 0.03)
 * @returns Formatted percentage string (e.g., "3%")
 */
export function formatFeeRate(rate: number): string {
  return `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
}

/**
 * Calculate credit card processing fee for a given amount
 * Uses Stripe's fee structure: 2.9% + $0.30
 * Formula: totalAmount = (baseAmount + 0.30) / (1 - 0.029)
 * @param amount - The base payment amount
 * @returns The credit card processing fee
 */
export function calculateCreditCardFee(amount: number): number {
  // Calculate what the total needs to be so that after Stripe takes their cut,
  // we receive the intended amount
  const totalWithFee = (amount + FEES.CREDIT_CARD_FEE.FIXED) / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
  // The fee is the difference between total and base
  return totalWithFee - amount;
}

/**
 * Calculate the total amount to charge including Stripe's credit card fee
 * This ensures that after Stripe deducts their fee, we receive the desired amount
 * 
 * @param baseAmount - The amount we want to receive after fees
 * @returns The total amount to charge the customer
 * 
 * @example
 * // If we want to receive $227 (deposits + transfer fee)
 * const total = calculateTotalWithStripeCardFee(227); // Returns 234.11
 * // Stripe will deduct $7.11, leaving us with $227
 */
export function calculateTotalWithStripeCardFee(baseAmount: number): number {
  return (baseAmount + FEES.CREDIT_CARD_FEE.FIXED) / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
}

/**
 * Reverse calculate the base amount from a total that includes Stripe fees
 * Used when we receive a total amount and need to determine the base
 * 
 * @param totalWithFee - The total amount including Stripe fees
 * @returns The base amount before fees
 * 
 * @example
 * // If customer was charged $234.11
 * const base = reverseCalculateBaseAmount(234.11); // Returns 227
 */
export function reverseCalculateBaseAmount(totalWithFee: number): number {
  return totalWithFee * (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE) - FEES.CREDIT_CARD_FEE.FIXED;
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