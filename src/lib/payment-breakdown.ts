/**
 * Payment Breakdown Utilities
 *
 * Calculates itemized breakdowns for rent payments including:
 * - Base monthly rent
 * - Pet rent
 * - Service fees (duration-dependent)
 * - Credit card processing fees
 */

import { FEES, getServiceFeeRate } from './fee-constants';

export interface PaymentBreakdown {
  // Base components
  baseRent: number;
  petRent: number;
  serviceFee: number;
  serviceFeeRate: number;
  creditCardFee: number;

  // Calculated totals
  subtotal: number; // Base + pet + service fee
  total: number; // Subtotal + credit card fee

  // Meta information
  tripMonths: number;
  isUsingCard: boolean;
  petCount: number;
}

export interface PaymentBreakdownInput {
  baseMonthlyRent: number; // in dollars
  petRentPerPet?: number; // in dollars
  petCount?: number;
  tripStartDate: Date;
  tripEndDate: Date;
  isUsingCard?: boolean;
}

/**
 * Calculate the duration of a trip in months
 */
function calculateTripMonths(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 30);
}

/**
 * Calculate itemized breakdown for a rent payment
 */
export function calculatePaymentBreakdown(input: PaymentBreakdownInput): PaymentBreakdown {
  const {
    baseMonthlyRent,
    petRentPerPet = 0,
    petCount = 0,
    tripStartDate,
    tripEndDate,
    isUsingCard = false
  } = input;

  // Calculate trip duration
  const tripMonths = calculateTripMonths(tripStartDate, tripEndDate);

  // Calculate components
  const baseRent = baseMonthlyRent;
  const petRent = petRentPerPet * petCount;
  const serviceFeeRate = getServiceFeeRate(tripMonths);
  const serviceFee = Math.round((baseRent + petRent) * serviceFeeRate * 100) / 100;

  // Calculate subtotal (before credit card fee)
  const subtotal = baseRent + petRent + serviceFee;

  // Calculate credit card fee if applicable
  const creditCardFee = isUsingCard ?
    Math.round(((subtotal + FEES.CREDIT_CARD_FEE.FIXED) / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE) - subtotal) * 100) / 100 :
    0;

  // Calculate total
  const total = subtotal + creditCardFee;

  return {
    baseRent,
    petRent,
    serviceFee,
    serviceFeeRate,
    creditCardFee,
    subtotal,
    total,
    tripMonths,
    isUsingCard,
    petCount
  };
}

/**
 * Calculate what the base rent amount should be from a total payment amount
 * This is useful for reverse-calculating when a payment amount is modified
 */
export function reverseCalculateBaseRent(
  totalAmount: number,
  input: Omit<PaymentBreakdownInput, 'baseMonthlyRent'>
): number {
  const {
    petRentPerPet = 0,
    petCount = 0,
    tripStartDate,
    tripEndDate,
    isUsingCard = false
  } = input;

  const tripMonths = calculateTripMonths(tripStartDate, tripEndDate);
  const serviceFeeRate = getServiceFeeRate(tripMonths);
  const petRent = petRentPerPet * petCount;

  // If using card, first remove the credit card fee
  let amountBeforeCcFee = totalAmount;
  if (isUsingCard) {
    // Reverse the credit card fee calculation
    amountBeforeCcFee = totalAmount * (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE) - FEES.CREDIT_CARD_FEE.FIXED;
  }

  // Now solve for base rent: amountBeforeCcFee = baseRent + petRent + serviceFee
  // where serviceFee = (baseRent + petRent) * serviceFeeRate
  // So: amountBeforeCcFee = baseRent + petRent + (baseRent + petRent) * serviceFeeRate
  // So: amountBeforeCcFee = (baseRent + petRent) * (1 + serviceFeeRate)
  // So: baseRent + petRent = amountBeforeCcFee / (1 + serviceFeeRate)
  // So: baseRent = (amountBeforeCcFee / (1 + serviceFeeRate)) - petRent

  const baseRentPlusPetRent = amountBeforeCcFee / (1 + serviceFeeRate);
  const baseRent = baseRentPlusPetRent - petRent;

  return Math.max(0, Math.round(baseRent * 100) / 100);
}

/**
 * Format a payment breakdown for display
 */
export function formatPaymentBreakdown(breakdown: PaymentBreakdown) {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(1)}%`;

  return {
    baseRent: formatCurrency(breakdown.baseRent),
    petRent: formatCurrency(breakdown.petRent),
    serviceFee: `${formatCurrency(breakdown.serviceFee)} (${formatPercentage(breakdown.serviceFeeRate)})`,
    creditCardFee: formatCurrency(breakdown.creditCardFee),
    subtotal: formatCurrency(breakdown.subtotal),
    total: formatCurrency(breakdown.total),
    serviceFeeRate: formatPercentage(breakdown.serviceFeeRate)
  };
}

/**
 * Check if a payment amount has been modified from the calculated amount
 */
export function isPaymentModified(
  actualAmount: number,
  calculatedBreakdown: PaymentBreakdown,
  tolerance: number = 0.01
): boolean {
  return Math.abs(actualAmount - calculatedBreakdown.total) > tolerance;
}