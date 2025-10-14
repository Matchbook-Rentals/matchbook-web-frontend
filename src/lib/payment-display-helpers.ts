/**
 * Payment Display Helpers
 *
 * Provides backward-compatible functions for displaying payment information.
 * Handles both legacy (amount field only) and new (itemized charges) payment models.
 *
 * Use these helpers in UI components to ensure consistent display regardless
 * of whether a payment has been migrated to the new charge-based system.
 */

import { RentPaymentChargeCategory } from '@prisma/client';
import {
  centsToDollars,
  formatCentsAsCurrency,
  CENTS_PRECISION,
  DUE_SOON_THRESHOLD_MS
} from './payment-constants';

// ============================================================================
// TYPES
// ============================================================================

export interface RentPaymentCharge {
  id: string;
  rentPaymentId: string;
  category: RentPaymentChargeCategory;
  amount: number;
  isApplied: boolean;
  appliedAt: Date;
  removedAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentPaymentWithCharges {
  id: string;
  amount: number; // Legacy field
  totalAmount?: number | null; // New field
  baseAmount?: number | null; // New field
  dueDate: Date;
  isPaid: boolean;
  charges?: RentPaymentCharge[];
}

export interface ChargeBreakdownDisplay {
  baseRent: number;
  petRent: number;
  securityDeposit: number;
  petDeposit: number;
  platformFee: number;
  creditCardFee: number;
  transferFee: number;
  discounts: number;
  other: number;
  total: number;
  hasCharges: boolean;
}

// ============================================================================
// CORE HELPERS
// ============================================================================

/**
 * Get the total payment amount (backward compatible)
 * Prioritizes totalAmount (new) over amount (legacy)
 *
 * @param payment - Rent payment object
 * @returns Total amount in cents
 */
export function getPaymentTotal(payment: RentPaymentWithCharges): number {
  // Prefer totalAmount if available (new system)
  if (payment.totalAmount !== null && payment.totalAmount !== undefined) {
    return payment.totalAmount;
  }

  // Fallback to amount (legacy system)
  return payment.amount;
}

/**
 * Get the base payment amount (before fees)
 *
 * @param payment - Rent payment object
 * @returns Base amount in cents
 */
export function getPaymentBase(payment: RentPaymentWithCharges): number {
  // Prefer baseAmount if available (new system)
  if (payment.baseAmount !== null && payment.baseAmount !== undefined) {
    return payment.baseAmount;
  }

  // Fallback to amount (legacy system - no separate base)
  return payment.amount;
}

/**
 * Check if payment has itemized charges
 *
 * @param payment - Rent payment object
 * @returns Whether payment has charges
 */
export function hasItemizedCharges(payment: RentPaymentWithCharges): boolean {
  return Boolean(payment.charges && payment.charges.length > 0);
}

/**
 * Check if payment has been migrated to new system
 *
 * @param payment - Rent payment object
 * @returns Whether payment uses new charge system
 */
export function isPaymentMigrated(payment: RentPaymentWithCharges): boolean {
  return Boolean(
    payment.totalAmount !== null &&
    payment.totalAmount !== undefined &&
    payment.charges &&
    payment.charges.length > 0
  );
}

// ============================================================================
// CHARGE BREAKDOWN HELPERS
// ============================================================================

/**
 * Get detailed charge breakdown for display
 *
 * @param payment - Rent payment object
 * @returns Charge breakdown with all categories
 */
export function getChargeBreakdown(payment: RentPaymentWithCharges): ChargeBreakdownDisplay {
  const breakdown: ChargeBreakdownDisplay = {
    baseRent: 0,
    petRent: 0,
    securityDeposit: 0,
    petDeposit: 0,
    platformFee: 0,
    creditCardFee: 0,
    transferFee: 0,
    discounts: 0,
    other: 0,
    total: 0,
    hasCharges: false
  };

  // If no charges, return empty breakdown
  if (!payment.charges || payment.charges.length === 0) {
    breakdown.total = payment.amount;
    return breakdown;
  }

  breakdown.hasCharges = true;

  // Sum up charges by category
  payment.charges.forEach((charge) => {
    if (!charge.isApplied) return; // Skip unapplied charges

    switch (charge.category) {
      case 'BASE_RENT':
        breakdown.baseRent += charge.amount;
        break;
      case 'PET_RENT':
        breakdown.petRent += charge.amount;
        break;
      case 'SECURITY_DEPOSIT':
        breakdown.securityDeposit += charge.amount;
        break;
      case 'PET_DEPOSIT':
        breakdown.petDeposit += charge.amount;
        break;
      case 'PLATFORM_FEE':
        breakdown.platformFee += charge.amount;
        break;
      case 'CREDIT_CARD_FEE':
        breakdown.creditCardFee += charge.amount;
        break;
      case 'TRANSFER_FEE':
        breakdown.transferFee += charge.amount;
        break;
      case 'DISCOUNT':
        breakdown.discounts += charge.amount; // Negative amount
        break;
      case 'OTHER':
        breakdown.other += charge.amount;
        break;
    }
  });

  breakdown.total = getPaymentTotal(payment);

  return breakdown;
}

/**
 * Get charge amount for specific category
 *
 * @param payment - Rent payment object
 * @param category - Charge category to find
 * @returns Charge amount in cents (0 if not found)
 */
export function getChargeAmount(
  payment: RentPaymentWithCharges,
  category: RentPaymentChargeCategory
): number {
  if (!payment.charges) return 0;

  const charge = payment.charges.find(
    (c) => c.category === category && c.isApplied
  );

  return charge ? charge.amount : 0;
}

/**
 * Check if payment has a specific charge applied
 *
 * @param payment - Rent payment object
 * @param category - Charge category to check
 * @returns Whether charge is applied
 */
export function hasCharge(
  payment: RentPaymentWithCharges,
  category: RentPaymentChargeCategory
): boolean {
  if (!payment.charges) return false;

  return payment.charges.some(
    (c) => c.category === category && c.isApplied
  );
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format payment amount for display
 *
 * @param amountInCents - Amount in cents
 * @param includeSign - Whether to include dollar sign
 * @returns Formatted currency string
 */
export function formatPaymentAmount(
  amountInCents: number,
  includeSign: boolean = true
): string {
  return formatCentsAsCurrency(amountInCents, includeSign);
}

/**
 * Format charge category for display
 *
 * @param category - Charge category
 * @returns Human-readable label
 */
export function formatChargeCategory(category: RentPaymentChargeCategory): string {
  const labels: Record<RentPaymentChargeCategory, string> = {
    BASE_RENT: 'Base Rent',
    PET_RENT: 'Pet Rent',
    SECURITY_DEPOSIT: 'Security Deposit',
    PET_DEPOSIT: 'Pet Deposit',
    PLATFORM_FEE: 'Service Fee',
    CREDIT_CARD_FEE: 'Card Processing Fee',
    TRANSFER_FEE: 'Transfer Fee',
    DISCOUNT: 'Discount',
    OTHER: 'Other'
  };

  return labels[category] || category;
}

/**
 * Get payment status display text
 *
 * @param payment - Rent payment object
 * @returns Status text
 */
export function getPaymentStatusText(payment: RentPaymentWithCharges): string {
  if (payment.isPaid) {
    return 'Paid';
  }

  const now = new Date();
  const dueDate = new Date(payment.dueDate);

  if (dueDate < now) {
    return 'Overdue';
  } else if (dueDate.getTime() - now.getTime() < DUE_SOON_THRESHOLD_MS) {
    return 'Due Soon';
  }

  return 'Upcoming';
}

/**
 * Get payment status color class
 *
 * @param payment - Rent payment object
 * @returns Tailwind color class
 */
export function getPaymentStatusColor(payment: RentPaymentWithCharges): string {
  if (payment.isPaid) {
    return 'text-green-600';
  }

  const now = new Date();
  const dueDate = new Date(payment.dueDate);

  if (dueDate < now) {
    return 'text-red-600';
  } else if (dueDate.getTime() - now.getTime() < DUE_SOON_THRESHOLD_MS) {
    return 'text-yellow-600';
  }

  return 'text-gray-600';
}

// ============================================================================
// SUMMARY HELPERS
// ============================================================================

/**
 * Calculate total of multiple payments
 *
 * @param payments - Array of rent payments
 * @returns Total amount in cents
 */
export function calculatePaymentsTotal(payments: RentPaymentWithCharges[]): number {
  return payments.reduce((sum, payment) => sum + getPaymentTotal(payment), 0);
}

/**
 * Group payments by status
 *
 * @param payments - Array of rent payments
 * @returns Grouped payments
 */
export function groupPaymentsByStatus(payments: RentPaymentWithCharges[]): {
  paid: RentPaymentWithCharges[];
  overdue: RentPaymentWithCharges[];
  upcoming: RentPaymentWithCharges[];
} {
  const now = new Date();

  return {
    paid: payments.filter((p) => p.isPaid),
    overdue: payments.filter((p) => !p.isPaid && new Date(p.dueDate) < now),
    upcoming: payments.filter((p) => !p.isPaid && new Date(p.dueDate) >= now)
  };
}

/**
 * Get next upcoming payment
 *
 * @param payments - Array of rent payments
 * @returns Next payment or undefined
 */
export function getNextPayment(
  payments: RentPaymentWithCharges[]
): RentPaymentWithCharges | undefined {
  const upcoming = payments
    .filter((p) => !p.isPaid && new Date(p.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return upcoming[0];
}

/**
 * Calculate payment statistics
 *
 * @param payments - Array of rent payments
 * @returns Payment statistics
 */
export function calculatePaymentStats(payments: RentPaymentWithCharges[]): {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalPayments: number;
  paidPayments: number;
  upcomingPayments: number;
  overduePayments: number;
} {
  const grouped = groupPaymentsByStatus(payments);

  return {
    totalAmount: calculatePaymentsTotal(payments),
    paidAmount: calculatePaymentsTotal(grouped.paid),
    remainingAmount: calculatePaymentsTotal([...grouped.overdue, ...grouped.upcoming]),
    totalPayments: payments.length,
    paidPayments: grouped.paid.length,
    upcomingPayments: grouped.upcoming.length,
    overduePayments: grouped.overdue.length
  };
}
