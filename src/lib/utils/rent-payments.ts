import { Prisma, RentPaymentStatus } from '@prisma/client';
import { FEES } from '@/lib/fee-constants';
import { calculateTripMonths } from '@/lib/payment-calculations';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentRecalculationResult {
  paymentsToCreate: Prisma.RentPaymentCreateManyInput[];
  paymentsToUpdate: {
    id: string;
    amount: number;
    totalAmount: number;
    baseAmount: number;
  }[];
  paymentIdsToCancel: string[];
  serviceFeeRateChanged: boolean;
  oldRate: number;
  newRate: number;
}

export interface ExistingPayment {
  id: string;
  dueDate: Date;
  amount: number;
  totalAmount: number | null;
  baseAmount: number | null;
  status: RentPaymentStatus;
  isPaid: boolean;
  stripePaymentMethodId: string | null;
  cancelledAt: Date | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a unique key for a month (YYYY-MM format)
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if a payment is immutable (cannot be modified)
 * Payments are immutable if they've been paid or are being processed
 */
function isPaymentImmutable(payment: ExistingPayment): boolean {
  const immutableStatuses: RentPaymentStatus[] = ['SUCCEEDED', 'PROCESSING'];
  return (
    payment.isPaid ||
    immutableStatuses.includes(payment.status) ||
    payment.cancelledAt !== null
  );
}

/**
 * Get the service fee rate based on trip duration
 */
function getServiceFeeRate(tripMonths: number): number {
  return tripMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS
    ? FEES.SERVICE_FEE.LONG_TERM_RATE
    : FEES.SERVICE_FEE.SHORT_TERM_RATE;
}

/**
 * Calculate the number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if a date is the last day of its month
 */
function isLastDayOfMonth(date: Date): boolean {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.getDate() === 1;
}

/**
 * Calculate prorated rent for a partial month (in cents)
 */
function calculateProratedAmount(
  monthlyRentCents: number,
  daysToCharge: number,
  daysInMonth: number
): number {
  return Math.round((monthlyRentCents * daysToCharge) / daysInMonth);
}

/**
 * Calculate the total amount including service fee (in cents)
 */
function calculateTotalWithServiceFee(baseAmountCents: number, serviceFeeRate: number): number {
  const serviceFee = Math.round(baseAmountCents * serviceFeeRate);
  return baseAmountCents + serviceFee;
}

// ============================================================================
// IDEAL PAYMENT SCHEDULE GENERATION
// ============================================================================

interface IdealPayment {
  monthKey: string;
  dueDate: Date;
  baseAmount: number; // cents
  totalAmount: number; // cents (includes service fee)
  isFirstMonth: boolean;
  isLastMonth: boolean;
  daysToCharge: number;
  daysInMonth: number;
}

/**
 * Generate the ideal payment schedule for a date range
 * All amounts in cents
 */
function generateIdealPaymentSchedule(
  startDate: Date,
  endDate: Date,
  monthlyRentCents: number,
  serviceFeeRate: number
): IdealPayment[] {
  const payments: IdealPayment[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Start from the first of the month of start date
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  let isFirst = true;

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthKey = getMonthKey(currentDate);
    const daysInMonth = getDaysInMonth(year, month);
    const monthEnd = new Date(year, month + 1, 0);

    // Determine if this is the first or last month
    const isFirstMonth = isFirst && start.getDate() > 1;
    const isLastMonth =
      month === end.getMonth() &&
      year === end.getFullYear() &&
      end.getDate() < daysInMonth;

    let daysToCharge: number;
    let dueDate: Date;

    if (isFirstMonth) {
      // First month: charge from start date to end of month
      daysToCharge = daysInMonth - start.getDate() + 1;
      dueDate = new Date(start);
    } else if (isLastMonth) {
      // Last month: charge from 1st to end date
      daysToCharge = end.getDate();
      dueDate = new Date(year, month, 1);
    } else {
      // Full month
      daysToCharge = daysInMonth;
      dueDate = new Date(year, month, 1);
    }

    const baseAmount = isFirstMonth || isLastMonth
      ? calculateProratedAmount(monthlyRentCents, daysToCharge, daysInMonth)
      : monthlyRentCents;

    const totalAmount = calculateTotalWithServiceFee(baseAmount, serviceFeeRate);

    payments.push({
      monthKey,
      dueDate,
      baseAmount,
      totalAmount,
      isFirstMonth: isFirst,
      isLastMonth,
      daysToCharge,
      daysInMonth,
    });

    // Move to next month
    currentDate = new Date(year, month + 1, 1);
    isFirst = false;
  }

  return payments;
}

// ============================================================================
// MAIN RECALCULATION FUNCTION
// ============================================================================

/**
 * Recalculate rent payments when booking dates change
 *
 * This function compares existing payments with an ideal new schedule
 * and determines which payments to create, update, or cancel.
 *
 * All amounts are in CENTS.
 *
 * @param existingPayments - Current rent payments for the booking
 * @param originalStartDate - Original booking start date
 * @param originalEndDate - Original booking end date
 * @param newStartDate - New booking start date
 * @param newEndDate - New booking end date
 * @param monthlyRentCents - Monthly rent in cents
 * @param stripePaymentMethodId - Stripe payment method ID for new payments
 * @returns Object containing payments to create, update, and cancel
 */
export function recalculatePaymentsForDateChange(
  existingPayments: ExistingPayment[],
  originalStartDate: Date,
  originalEndDate: Date,
  newStartDate: Date,
  newEndDate: Date,
  monthlyRentCents: number,
  stripePaymentMethodId: string | null
): PaymentRecalculationResult {
  // Calculate trip durations and service fee rates
  const oldTripMonths = calculateTripMonths(originalStartDate, originalEndDate);
  const newTripMonths = calculateTripMonths(newStartDate, newEndDate);

  const oldRate = getServiceFeeRate(oldTripMonths);
  const newRate = getServiceFeeRate(newTripMonths);
  const serviceFeeRateChanged = oldRate !== newRate;

  // Generate the ideal new payment schedule
  const idealPayments = generateIdealPaymentSchedule(
    newStartDate,
    newEndDate,
    monthlyRentCents,
    newRate
  );

  // Create a map of existing payments by month key
  const existingByMonth = new Map<string, ExistingPayment>();
  for (const payment of existingPayments) {
    if (!payment.cancelledAt) {
      const monthKey = getMonthKey(payment.dueDate);
      existingByMonth.set(monthKey, payment);
    }
  }

  // Create a set of ideal month keys
  const idealMonthKeys = new Set(idealPayments.map(p => p.monthKey));

  // Results
  const paymentsToCreate: Prisma.RentPaymentCreateManyInput[] = [];
  const paymentsToUpdate: PaymentRecalculationResult['paymentsToUpdate'] = [];
  const paymentIdsToCancel: string[] = [];

  // Process each ideal payment
  for (const ideal of idealPayments) {
    const existing = existingByMonth.get(ideal.monthKey);

    if (!existing) {
      // No existing payment for this month - create new one
      paymentsToCreate.push({
        bookingId: '', // Will be set by caller
        amount: ideal.totalAmount, // Legacy field
        totalAmount: ideal.totalAmount,
        baseAmount: ideal.baseAmount,
        dueDate: ideal.dueDate,
        stripePaymentMethodId: stripePaymentMethodId,
        paymentAuthorizedAt: ideal.isFirstMonth ? new Date() : null,
        type: 'MONTHLY_RENT',
        status: 'PENDING',
      });
    } else if (!isPaymentImmutable(existing)) {
      // Existing mutable payment - check if it needs updating
      const existingBase = existing.baseAmount ?? existing.amount;
      const existingTotal = existing.totalAmount ?? existing.amount;

      // Update if amounts differ or if service fee rate changed
      if (
        existingBase !== ideal.baseAmount ||
        existingTotal !== ideal.totalAmount ||
        serviceFeeRateChanged
      ) {
        paymentsToUpdate.push({
          id: existing.id,
          amount: ideal.totalAmount, // Legacy field
          totalAmount: ideal.totalAmount,
          baseAmount: ideal.baseAmount,
        });
      }
    }
    // If payment is immutable, leave it alone
  }

  // Find payments to cancel (existing payments not in ideal schedule)
  for (const [monthKey, existing] of existingByMonth) {
    if (!idealMonthKeys.has(monthKey)) {
      // This month is no longer in the booking range
      if (isPaymentImmutable(existing)) {
        // This is a problem - we can't cancel a paid payment
        // The caller should check for this before calling
        throw new Error(
          `Cannot shorten booking: paid payment exists for ${monthKey}`
        );
      }
      paymentIdsToCancel.push(existing.id);
    }
  }

  return {
    paymentsToCreate,
    paymentsToUpdate,
    paymentIdsToCancel,
    serviceFeeRateChanged,
    oldRate,
    newRate,
  };
}

/**
 * Find paid payments in a date range that would be removed
 * Use this to validate before calling recalculatePaymentsForDateChange
 */
export function findPaidPaymentsInRemovedRange(
  existingPayments: ExistingPayment[],
  newEndDate: Date
): ExistingPayment[] {
  return existingPayments.filter(payment => {
    if (payment.cancelledAt) return false;
    const paymentMonth = new Date(payment.dueDate);
    paymentMonth.setDate(1); // Normalize to first of month

    // Check if payment is after the new end date
    const newEndMonth = new Date(newEndDate);
    newEndMonth.setDate(1);

    const isAfterNewEnd = paymentMonth > newEndMonth;
    return isAfterNewEnd && isPaymentImmutable(payment);
  });
}

// ============================================================================
// LEGACY FUNCTION (for backward compatibility)
// ============================================================================

/**
 * Utility function to generate scheduled rent payments with pro-rating
 * Calculates first and last month pro-rated amounts based on actual days
 */
export function generateRentPayments(
  bookingId: string,
  monthlyRent: number,
  startDate: Date,
  endDate: Date,
  stripePaymentMethodId: string
): Prisma.RentPaymentCreateManyInput[] {
  const payments: Prisma.RentPaymentCreateManyInput[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Start from the first of the month after start date (or same month if starts on 1st)
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);

  // If booking starts after the 1st, add a pro-rated payment for the partial month
  if (start.getDate() > 1) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const daysFromStart = daysInMonth - start.getDate() + 1;
    const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);

    payments.push({
      bookingId,
      amount: proRatedAmount,
      dueDate: start,
      stripePaymentMethodId,
      paymentAuthorizedAt: new Date(),
      type: 'MONTHLY_RENT',
    });

    // Move to next month for regular payments
    currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }

  // Generate monthly payments on the 1st of each month
  while (currentDate <= end) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Check if this is the last month and we need pro-rating
    if (monthEnd > end && end.getDate() < monthEnd.getDate()) {
      const daysInMonth = monthEnd.getDate();
      const daysToEnd = end.getDate();
      const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth);

      payments.push({
        bookingId,
        amount: proRatedAmount,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
      });
    }

    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return payments;
}
