/**
 * Charge Builder Utilities
 *
 * Creates charge definitions for itemized rent payments.
 * Each function returns a charge object that can be used to create RentPaymentCharge records.
 *
 * All amounts are in CENTS.
 */

import { FEES } from './fee-constants';
import { PERCENT_MULTIPLIER } from './payment-constants';

export type ChargeCategory =
  | 'BASE_RENT'
  | 'SECURITY_DEPOSIT'
  | 'PET_RENT'
  | 'PET_DEPOSIT'
  | 'PLATFORM_FEE'
  | 'CREDIT_CARD_FEE'
  | 'TRANSFER_FEE'
  | 'DISCOUNT'
  | 'OTHER';

export interface ChargeDefinition {
  category: ChargeCategory;
  amount: number; // Always in cents
  isApplied: boolean;
  metadata?: Record<string, any>;
}

export interface ChargeBreakdown {
  charges: ChargeDefinition[];
  totalAmount: number; // Sum of all applied charges
  baseAmount: number;  // Sum of non-fee charges
}

// ============================================================================
// BASE CHARGE BUILDERS
// ============================================================================

/**
 * Create a base rent charge
 * @param amount - Rent amount in cents
 * @param metadata - Optional metadata (e.g., prorated info, month details)
 */
export function createBaseRentCharge(
  amount: number,
  metadata?: Record<string, any>
): ChargeDefinition {
  return {
    category: 'BASE_RENT',
    amount: Math.round(amount),
    isApplied: true,
    metadata
  };
}

/**
 * Create a security deposit charge
 * @param amount - Deposit amount in cents
 */
export function createSecurityDepositCharge(amount: number): ChargeDefinition {
  return {
    category: 'SECURITY_DEPOSIT',
    amount: Math.round(amount),
    isApplied: true
  };
}

/**
 * Create a pet rent charge
 * @param petCount - Number of pets
 * @param petRentPerPet - Rent per pet in cents
 */
export function createPetRentCharge(
  petCount: number,
  petRentPerPet: number
): ChargeDefinition {
  return {
    category: 'PET_RENT',
    amount: Math.round(petCount * petRentPerPet),
    isApplied: true,
    metadata: {
      petCount,
      petRentPerPet
    }
  };
}

/**
 * Create a pet deposit charge
 * @param petCount - Number of pets
 * @param petDepositPerPet - Deposit per pet in cents
 */
export function createPetDepositCharge(
  petCount: number,
  petDepositPerPet: number
): ChargeDefinition {
  return {
    category: 'PET_DEPOSIT',
    amount: Math.round(petCount * petDepositPerPet),
    isApplied: true,
    metadata: {
      petCount,
      petDepositPerPet
    }
  };
}

// ============================================================================
// FEE CHARGE BUILDERS
// ============================================================================

/**
 * Create a platform fee charge (service fee)
 * @param baseAmount - Base amount to calculate fee from (in cents)
 * @param durationMonths - Booking duration in months
 */
export function createPlatformFeeCharge(
  baseAmount: number,
  durationMonths: number
): ChargeDefinition {
  const rate = durationMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS
    ? FEES.SERVICE_FEE.LONG_TERM_RATE
    : FEES.SERVICE_FEE.SHORT_TERM_RATE;

  return {
    category: 'PLATFORM_FEE',
    amount: Math.round(baseAmount * rate),
    isApplied: true,
    metadata: {
      rate: rate * PERCENT_MULTIPLIER, // Store as percentage
      durationMonths,
      rateType: durationMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS ? 'long_term' : 'short_term'
    }
  };
}

/**
 * Create a credit card processing fee charge
 * Uses 3% self-inclusive formula
 * @param baseAmount - Base amount to calculate fee from (in cents)
 * @param isApplied - Whether the fee is currently applied (default: true)
 */
export function createCreditCardFeeCharge(
  baseAmount: number,
  isApplied: boolean = true
): ChargeDefinition {
  // Self-inclusive calculation: totalWithFee = baseAmount / (1 - 0.03)
  const totalWithFee = baseAmount / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
  const feeAmount = totalWithFee - baseAmount;

  return {
    category: 'CREDIT_CARD_FEE',
    amount: Math.round(feeAmount),
    isApplied,
    metadata: {
      rate: FEES.CREDIT_CARD_FEE.PERCENTAGE * PERCENT_MULTIPLIER, // Store as percentage
      baseAmount,
      calculation: 'self_inclusive'
    }
  };
}

/**
 * Create a transfer fee charge (flat $7 for deposits)
 */
export function createTransferFeeCharge(): ChargeDefinition {
  return {
    category: 'TRANSFER_FEE',
    amount: FEES.TRANSFER_FEE_CENTS,
    isApplied: true,
    metadata: {
      flatFee: true
    }
  };
}

/**
 * Create a discount charge (negative amount)
 * @param amount - Discount amount in cents (will be made negative)
 * @param reason - Reason for discount
 */
export function createDiscountCharge(
  amount: number,
  reason?: string
): ChargeDefinition {
  return {
    category: 'DISCOUNT',
    amount: -Math.abs(Math.round(amount)), // Ensure negative
    isApplied: true,
    metadata: {
      reason
    }
  };
}

// ============================================================================
// CHARGE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate total amount from charges
 * @param charges - Array of charge definitions
 * @returns Total amount (sum of all applied charges)
 */
export function calculateTotalFromCharges(charges: ChargeDefinition[]): number {
  return charges
    .filter(c => c.isApplied)
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Calculate base amount from charges (excludes fees)
 * @param charges - Array of charge definitions
 * @returns Base amount (sum of non-fee charges)
 */
export function calculateBaseFromCharges(charges: ChargeDefinition[]): number {
  const baseCategories: ChargeCategory[] = [
    'BASE_RENT',
    'SECURITY_DEPOSIT',
    'PET_RENT',
    'PET_DEPOSIT'
  ];

  return charges
    .filter(c => c.isApplied && baseCategories.includes(c.category))
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Build complete charge breakdown
 * @param charges - Array of charge definitions
 * @returns Charge breakdown with totals
 */
export function buildChargeBreakdown(charges: ChargeDefinition[]): ChargeBreakdown {
  return {
    charges,
    totalAmount: calculateTotalFromCharges(charges),
    baseAmount: calculateBaseFromCharges(charges)
  };
}

/**
 * Find charge by category
 * @param charges - Array of charge definitions
 * @param category - Category to find
 * @returns Charge definition or undefined
 */
export function findChargeByCategory(
  charges: ChargeDefinition[],
  category: ChargeCategory
): ChargeDefinition | undefined {
  return charges.find(c => c.category === category);
}

/**
 * Toggle charge application status
 * @param charge - Charge to toggle
 * @returns Updated charge
 */
export function toggleChargeApplication(charge: ChargeDefinition): ChargeDefinition {
  return {
    ...charge,
    isApplied: !charge.isApplied
  };
}

/**
 * Validate charge breakdown (ensure totals match)
 * @param charges - Array of charge definitions
 * @param expectedTotal - Expected total amount
 * @returns Whether validation passes
 */
export function validateChargeBreakdown(
  charges: ChargeDefinition[],
  expectedTotal: number
): { valid: boolean; actualTotal: number; difference: number } {
  const actualTotal = calculateTotalFromCharges(charges);
  const difference = Math.abs(actualTotal - expectedTotal);

  // Allow 1 cent difference due to rounding
  const valid = difference <= 1;

  return {
    valid,
    actualTotal,
    difference
  };
}

// ============================================================================
// MONTHLY RENT PAYMENT CHARGE BUILDERS
// ============================================================================

/**
 * Build charges for a monthly rent payment
 * @param baseRent - Base monthly rent in cents
 * @param petRent - Monthly pet rent in cents (if any)
 * @param durationMonths - Total booking duration in months
 * @param includeCardFee - Whether to include credit card fee
 * @param isProrated - Whether rent is prorated
 * @param proratedInfo - Proration details if applicable
 */
export function buildMonthlyRentCharges(params: {
  baseRent: number;
  petRent?: number;
  durationMonths: number;
  includeCardFee: boolean;
  isProrated?: boolean;
  proratedInfo?: {
    daysInMonth: number;
    daysToCharge: number;
  };
}): ChargeBreakdown {
  const charges: ChargeDefinition[] = [];

  // Base rent charge
  charges.push(createBaseRentCharge(
    params.baseRent,
    params.isProrated ? params.proratedInfo : undefined
  ));

  // Pet rent charge (if applicable)
  if (params.petRent && params.petRent > 0) {
    charges.push({
      category: 'PET_RENT',
      amount: Math.round(params.petRent),
      isApplied: true,
      metadata: params.isProrated ? params.proratedInfo : undefined
    });
  }

  // Calculate base amount (rent + pet rent)
  const baseAmount = params.baseRent + (params.petRent || 0);

  // Platform fee (service fee)
  charges.push(createPlatformFeeCharge(baseAmount, params.durationMonths));

  // Credit card fee (if applicable)
  if (params.includeCardFee) {
    // Card fee is calculated on base amount + platform fee
    const amountBeforeCardFee = calculateTotalFromCharges(charges);
    charges.push(createCreditCardFeeCharge(amountBeforeCardFee, true));
  }

  return buildChargeBreakdown(charges);
}

/**
 * Build charges for initial deposit payment (not monthly rent)
 * @param securityDeposit - Security deposit in cents
 * @param petDeposit - Pet deposit in cents (if any)
 * @param includeCardFee - Whether to include credit card fee
 */
export function buildDepositCharges(params: {
  securityDeposit: number;
  petDeposit?: number;
  includeCardFee: boolean;
}): ChargeBreakdown {
  const charges: ChargeDefinition[] = [];

  // Security deposit
  charges.push(createSecurityDepositCharge(params.securityDeposit));

  // Pet deposit (if applicable)
  if (params.petDeposit && params.petDeposit > 0) {
    charges.push(createPetDepositCharge(1, params.petDeposit));
  }

  // Transfer fee (flat $7)
  charges.push(createTransferFeeCharge());

  // Credit card fee (if applicable)
  if (params.includeCardFee) {
    const amountBeforeCardFee = calculateTotalFromCharges(charges);
    charges.push(createCreditCardFeeCharge(amountBeforeCardFee, true));
  }

  return buildChargeBreakdown(charges);
}
