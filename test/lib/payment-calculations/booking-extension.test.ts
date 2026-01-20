import { describe, it, expect } from 'vitest';
import {
  recalculatePaymentsForDateChange,
  findPaidPaymentsInRemovedRange,
  type ExistingPayment
} from '@/lib/utils/rent-payments';
import { RentPaymentStatus } from '@prisma/client';

/**
 * Tests for booking extension/modification payment recalculation
 *
 * All amounts in these functions are in CENTS (not dollars).
 *
 * Fee structure:
 * - Service fee: 3% short-term (<6 months), 1.5% long-term (>=6 months)
 *
 * Key scenarios:
 * - Extending a booking adds new payments
 * - Shortening a booking cancels future payments
 * - Date changes may affect proration amounts
 * - Service fee rate may change when crossing the 6-month threshold
 */

// Helper to create local dates (month is 0-indexed: 0=Jan, 1=Feb, etc.)
const localDate = (year: number, month: number, day: number) =>
  new Date(year, month, day);

// Helper to create a mock existing payment
function createMockPayment(
  id: string,
  dueDate: Date,
  amount: number,
  options: Partial<ExistingPayment> = {}
): ExistingPayment {
  return {
    id,
    dueDate,
    amount,
    totalAmount: options.totalAmount ?? amount,
    baseAmount: options.baseAmount ?? Math.round(amount / 1.03), // Assuming 3% service fee
    status: options.status ?? 'PENDING',
    isPaid: options.isPaid ?? false,
    stripePaymentMethodId: options.stripePaymentMethodId ?? 'pm_test',
    cancelledAt: options.cancelledAt ?? null,
  };
}

// Constants for tests
const MONTHLY_RENT_CENTS = 100000; // $1000 in cents
const PAYMENT_METHOD_ID = 'pm_test_123';

describe('recalculatePaymentsForDateChange', () => {
  describe('Basic Extension Tests', () => {
    it('should add new payment when extending by 1 month', () => {
      // Original: Jan 15 → Feb 15 (2 payments)
      // New: Jan 15 → Mar 15 (3 payments)
      // Trip is still under 6 months, so 3% service fee rate stays the same
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 15), 56484, {
          baseAmount: 54839, // 17/31 of $1000
          totalAmount: 56484, // + 3% service fee = 54839 + 1645 = 56484
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 55178, {
          baseAmount: 53571, // 15/28 of $1000
          totalAmount: 55178, // + 3% service fee = 53571 + 1607 = 55178
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 15),
        localDate(2025, 1, 15),
        localDate(2025, 0, 15),
        localDate(2025, 2, 15), // Extend to Mar 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Should create 1 new payment for March
      expect(result.paymentsToCreate.length).toBe(1);
      expect(result.paymentsToCreate[0].dueDate).toEqual(localDate(2025, 2, 1));

      // Feb payment should be updated to full month
      // Jan payment also gets updated because the base amounts change based on new trip duration
      expect(result.paymentsToUpdate.length).toBeGreaterThanOrEqual(1);
      const febUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_2');
      expect(febUpdate).toBeDefined();
      expect(febUpdate!.baseAmount).toBe(100000); // Full month

      // No payments should be cancelled
      expect(result.paymentIdsToCancel.length).toBe(0);
    });

    it('should add 5 payments when extending from 1 month to 6 months', () => {
      // Original: Jan 15 → Feb 15 (2 payments)
      // New: Jan 15 → Jul 15 (7 payments)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 15), 56662, {
          baseAmount: 54839,
          totalAmount: 56662,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 55178, {
          baseAmount: 53571,
          totalAmount: 55178,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 15),
        localDate(2025, 1, 15),
        localDate(2025, 0, 15),
        localDate(2025, 6, 15), // Extend to Jul 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Should create 5 new payments (Mar, Apr, May, Jun, Jul)
      expect(result.paymentsToCreate.length).toBe(5);

      // Service fee should change from 3% to 1.5% (crossed 6-month threshold)
      expect(result.serviceFeeRateChanged).toBe(true);
      expect(result.oldRate).toBe(0.03);
      expect(result.newRate).toBe(0.015);
    });

    it('should cancel payment when shortening by 1 month', () => {
      // Original: Jan 1 → Mar 31 (3 payments)
      // New: Jan 1 → Feb 28 (2 payments)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_3', localDate(2025, 2, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 2, 31),
        localDate(2025, 0, 1),
        localDate(2025, 1, 28), // Shorten to Feb 28
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Mar payment should be cancelled
      expect(result.paymentIdsToCancel.length).toBe(1);
      expect(result.paymentIdsToCancel[0]).toBe('pay_3');

      // No new payments should be created
      expect(result.paymentsToCreate.length).toBe(0);
    });
  });

  describe('Proration Change Tests', () => {
    it('should update last month from prorated to full when extending to end of month', () => {
      // Original: Jan 1 → Feb 15 (Feb prorated)
      // New: Jan 1 → Feb 28 (Feb full)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 55178, {
          baseAmount: 53571, // 15/28 of $1000
          totalAmount: 55178,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 15),
        localDate(2025, 0, 1),
        localDate(2025, 1, 28), // Extend to end of Feb
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb payment should be updated to full month
      expect(result.paymentsToUpdate.length).toBe(1);
      expect(result.paymentsToUpdate[0].id).toBe('pay_2');
      expect(result.paymentsToUpdate[0].baseAmount).toBe(100000); // Full month now
    });

    it('should update last month from full to prorated when shortening', () => {
      // Original: Jan 1 → Feb 28 (Feb full)
      // New: Jan 1 → Feb 15 (Feb prorated)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 28),
        localDate(2025, 0, 1),
        localDate(2025, 1, 15), // Shorten to Feb 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb payment should be updated to prorated (15/28)
      expect(result.paymentsToUpdate.length).toBe(1);
      expect(result.paymentsToUpdate[0].id).toBe('pay_2');
      // 15/28 of $1000 = $535.71 = 53571 cents
      expect(result.paymentsToUpdate[0].baseAmount).toBe(53571);
    });

    it('should handle middle month becoming last month with proration', () => {
      // Original: Jan 1 → Mar 31 (3 full months)
      // New: Jan 1 → Feb 20 (1 full + 1 prorated, Mar cancelled)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_3', localDate(2025, 2, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 2, 31),
        localDate(2025, 0, 1),
        localDate(2025, 1, 20), // Shorten to Feb 20
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Mar should be cancelled
      expect(result.paymentIdsToCancel.length).toBe(1);
      expect(result.paymentIdsToCancel[0]).toBe('pay_3');

      // Feb should be updated to prorated (20/28)
      expect(result.paymentsToUpdate.length).toBe(1);
      expect(result.paymentsToUpdate[0].id).toBe('pay_2');
      // 20/28 of $1000 = $714.29 = 71429 cents
      expect(result.paymentsToUpdate[0].baseAmount).toBe(71429);
    });
  });

  describe('Service Fee Threshold Tests', () => {
    it('should change from 3% to 1.5% when extending from 5 to 7 months', () => {
      // Create 5 existing payments (under threshold)
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 5; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 103000, {
            baseAmount: 100000,
            totalAmount: 103000,
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 4, 31), // 5 months
        localDate(2025, 0, 1),
        localDate(2025, 6, 31), // Extend to 7 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      expect(result.serviceFeeRateChanged).toBe(true);
      expect(result.oldRate).toBe(0.03);
      expect(result.newRate).toBe(0.015);

      // All unpaid existing payments should be updated with new rate
      // (assuming all are unpaid/pending)
      expect(result.paymentsToUpdate.length).toBe(5);
    });

    it('should change from 1.5% to 3% when shortening from 7 to 5 months', () => {
      // Create 7 existing payments (over threshold, 1.5% rate)
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 7; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 101500, {
            baseAmount: 100000,
            totalAmount: 101500, // 1.5% service fee
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 6, 31), // 7 months
        localDate(2025, 0, 1),
        localDate(2025, 4, 31), // Shorten to 5 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      expect(result.serviceFeeRateChanged).toBe(true);
      expect(result.oldRate).toBe(0.015);
      expect(result.newRate).toBe(0.03);

      // Jun and Jul should be cancelled
      expect(result.paymentIdsToCancel.length).toBe(2);

      // Remaining 5 payments should be updated with new 3% rate
      expect(result.paymentsToUpdate.length).toBe(5);
    });

    it('should stay at 3% when extending from 3 to 5 months', () => {
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 3; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 103000, {
            baseAmount: 100000,
            totalAmount: 103000,
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 2, 31), // 3 months
        localDate(2025, 0, 1),
        localDate(2025, 4, 31), // Extend to 5 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      expect(result.serviceFeeRateChanged).toBe(false);
      expect(result.oldRate).toBe(0.03);
      expect(result.newRate).toBe(0.03);
    });

    it('should stay at 1.5% when extending from 7 to 9 months', () => {
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 7; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 101500, {
            baseAmount: 100000,
            totalAmount: 101500,
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 6, 31), // 7 months
        localDate(2025, 0, 1),
        localDate(2025, 8, 30), // Extend to 9 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      expect(result.serviceFeeRateChanged).toBe(false);
      expect(result.oldRate).toBe(0.015);
      expect(result.newRate).toBe(0.015);
    });

    it('should change to 1.5% when extending to exactly 6 months', () => {
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 5; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 103000, {
            baseAmount: 100000,
            totalAmount: 103000,
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 4, 31), // 5 months
        localDate(2025, 0, 1),
        localDate(2025, 5, 30), // Extend to 6 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      expect(result.serviceFeeRateChanged).toBe(true);
      expect(result.newRate).toBe(0.015);
    });
  });

  describe('February Edge Cases', () => {
    it('should handle non-leap year February full month correctly', () => {
      // Feb 1 → Feb 28, 2025 (non-leap) = full month
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 1, 1),
        localDate(2025, 1, 28),
        localDate(2025, 1, 1),
        localDate(2025, 1, 28), // Same dates
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // No changes needed
      expect(result.paymentsToUpdate.length).toBe(0);
      expect(result.paymentsToCreate.length).toBe(0);
      expect(result.paymentIdsToCancel.length).toBe(0);
    });

    it('should prorate Feb 28 correctly in leap year 2024', () => {
      // Feb 1 → Feb 28, 2024 (leap year) = prorated (28/29 days)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2024, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2024, 1, 1),
        localDate(2024, 1, 29), // Was full month (29 days)
        localDate(2024, 1, 1),
        localDate(2024, 1, 28), // Shorten to 28 days
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb should be prorated (28/29)
      expect(result.paymentsToUpdate.length).toBe(1);
      // 28/29 of $1000 = $965.52 = 96552 cents
      expect(result.paymentsToUpdate[0].baseAmount).toBe(96552);
    });

    it('should handle extending into leap year Feb correctly', () => {
      // Original: Jan 15, 2024 → Feb 15, 2024
      // New: Jan 15, 2024 → Feb 29, 2024 (full month in leap year)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2024, 0, 15), 56484, {
          baseAmount: 54839, // 17/31 of $1000
          totalAmount: 56484, // + 3% = 54839 + 1645
        }),
        createMockPayment('pay_2', localDate(2024, 1, 1), 53241, {
          baseAmount: 51724, // 15/29 of $1000 in leap year
          totalAmount: 53241, // + 3% = 51724 + 1552
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2024, 0, 15),
        localDate(2024, 1, 15),
        localDate(2024, 0, 15),
        localDate(2024, 1, 29), // Extend to Feb 29
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb should be updated to full month (29 days in leap year)
      // Jan may also be updated if amounts differ slightly
      const febUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_2');
      expect(febUpdate).toBeDefined();
      expect(febUpdate!.baseAmount).toBe(100000); // Full month
    });
  });

  describe('Long-Term Booking Tests', () => {
    it('should handle 12-month booking extension', () => {
      // Create 6 existing payments
      const existingPayments: ExistingPayment[] = [];
      for (let i = 0; i < 6; i++) {
        existingPayments.push(
          createMockPayment(`pay_${i}`, localDate(2025, i, 1), 101500, {
            baseAmount: 100000,
            totalAmount: 101500,
          })
        );
      }

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 5, 30), // 6 months
        localDate(2025, 0, 1),
        localDate(2025, 11, 31), // Extend to 12 months
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Should create 6 new payments (Jul-Dec)
      expect(result.paymentsToCreate.length).toBe(6);

      // Rate should stay at 1.5%
      expect(result.serviceFeeRateChanged).toBe(false);
      expect(result.newRate).toBe(0.015);
    });

    it('should handle year-spanning booking correctly', () => {
      // Nov 15, 2025 → Feb 15, 2026 (4 months, 3% service fee)
      // Extended to Nov 15, 2025 → Mar 15, 2026 (5 months, still 3% service fee)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 10, 15), 53227, {
          baseAmount: 51667, // 16/30 of $1000 (Nov has 30 days)
          totalAmount: 53227, // + 3%
        }),
        createMockPayment('pay_2', localDate(2025, 11, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_3', localDate(2026, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_4', localDate(2026, 1, 1), 55178, {
          baseAmount: 53571, // prorated 15/28
          totalAmount: 55178,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 10, 15),
        localDate(2026, 1, 15),
        localDate(2025, 10, 15),
        localDate(2026, 2, 15), // Extend to Mar 15, 2026
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Should create 1 new payment for Mar 2026
      expect(result.paymentsToCreate.length).toBe(1);

      // Feb 2026 should be updated to full month
      const febUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_4');
      expect(febUpdate).toBeDefined();
      expect(febUpdate!.baseAmount).toBe(100000); // Full month
    });
  });

  describe('Immutable Payment Tests', () => {
    it('should preserve paid payments and only add new ones', () => {
      // Jan payment paid, extend to March
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 15), 56662, {
          baseAmount: 54839,
          totalAmount: 56662,
          status: 'SUCCEEDED',
          isPaid: true,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 55178, {
          baseAmount: 53571,
          totalAmount: 55178,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 15),
        localDate(2025, 1, 15),
        localDate(2025, 0, 15),
        localDate(2025, 2, 15), // Extend to Mar 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Jan payment is immutable, should not be updated
      const janUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_1');
      expect(janUpdate).toBeUndefined();

      // Feb should be updated
      const febUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_2');
      expect(febUpdate).toBeDefined();
    });

    it('should throw error when trying to cancel a paid payment', () => {
      // Mar payment is paid, but we want to shorten to Feb
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_3', localDate(2025, 2, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          status: 'SUCCEEDED',
          isPaid: true,
        }),
      ];

      expect(() =>
        recalculatePaymentsForDateChange(
          existingPayments,
          localDate(2025, 0, 1),
          localDate(2025, 2, 31),
          localDate(2025, 0, 1),
          localDate(2025, 1, 28), // Shorten to Feb 28
          MONTHLY_RENT_CENTS,
          PAYMENT_METHOD_ID
        )
      ).toThrow(/Cannot shorten booking.*paid payment/);
    });

    it('should not update PROCESSING payments', () => {
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          status: 'PROCESSING',
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 28),
        localDate(2025, 0, 1),
        localDate(2025, 2, 31), // Extend to Mar 31
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Jan (PROCESSING) should not be updated
      const janUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_1');
      expect(janUpdate).toBeUndefined();
    });

    it('should update AUTHORIZED payments (not captured yet)', () => {
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          status: 'AUTHORIZED',
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 28),
        localDate(2025, 0, 1),
        localDate(2025, 5, 30), // Extend to 6 months (rate changes)
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // AUTHORIZED should be updated (rate changed)
      const janUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_1');
      expect(janUpdate).toBeDefined();
    });

    it('should handle mix of paid and unpaid payments', () => {
      // Jan and Feb paid, extend to Apr
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          status: 'SUCCEEDED',
          isPaid: true,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          status: 'SUCCEEDED',
          isPaid: true,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 28),
        localDate(2025, 0, 1),
        localDate(2025, 3, 30), // Extend to Apr 30
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Jan and Feb unchanged (paid)
      expect(result.paymentsToUpdate.length).toBe(0);

      // Mar and Apr should be created
      expect(result.paymentsToCreate.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same start date with end extension', () => {
      // Original: Jan 15 → Feb 15 (2 payments, ~1 month)
      // New: Jan 15 → Feb 28 (2 payments, ~1.5 months)
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 15), 56484, {
          baseAmount: 54839, // 17/31 of $1000
          totalAmount: 56484, // + 3%
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 55178, {
          baseAmount: 53571, // 15/28 prorated
          totalAmount: 55178, // + 3%
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 15),
        localDate(2025, 1, 15),
        localDate(2025, 0, 15), // Same start
        localDate(2025, 1, 28), // Extend to end of Feb
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb should be updated to full month
      const febUpdate = result.paymentsToUpdate.find((p) => p.id === 'pay_2');
      expect(febUpdate).toBeDefined();
      expect(febUpdate!.baseAmount).toBe(100000);

      // No new payments
      expect(result.paymentsToCreate.length).toBe(0);
    });

    it('should handle single day extension correctly', () => {
      // Jan 1 → Jan 30 extended to Jan 1 → Jan 31
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 99687, {
          baseAmount: 96774, // 30/31 of $1000
          totalAmount: 99687,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 0, 30),
        localDate(2025, 0, 1),
        localDate(2025, 0, 31), // Extend by 1 day
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Jan should be updated to full month
      expect(result.paymentsToUpdate.length).toBe(1);
      expect(result.paymentsToUpdate[0].baseAmount).toBe(100000); // Full month
    });

    it('should handle 30-day months correctly', () => {
      // April has 30 days
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 3, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 3, 1),
        localDate(2025, 3, 30),
        localDate(2025, 3, 1),
        localDate(2025, 3, 15), // Shorten to Apr 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Apr should be prorated (15/30)
      expect(result.paymentsToUpdate.length).toBe(1);
      // 15/30 of $1000 = $500 = 50000 cents
      expect(result.paymentsToUpdate[0].baseAmount).toBe(50000);
    });

    it('should handle very short stay extended correctly', () => {
      // Jan 28 → Jan 31 (4 days) extended to Jan 28 → Feb 15
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 28), 13289, {
          baseAmount: 12903, // 4/31 of $1000
          totalAmount: 13289,
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 28),
        localDate(2025, 0, 31),
        localDate(2025, 0, 28),
        localDate(2025, 1, 15), // Extend to Feb 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Jan payment unchanged (same month)
      // Feb payment should be created
      expect(result.paymentsToCreate.length).toBe(1);
      // Feb 1-15 = 15/28 of $1000 = $535.71 = 53571 cents
      expect(result.paymentsToCreate[0].baseAmount).toBe(53571);
    });

    it('should skip already cancelled payments', () => {
      const existingPayments: ExistingPayment[] = [
        createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
        }),
        createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
          baseAmount: 100000,
          totalAmount: 103000,
          cancelledAt: new Date(), // Already cancelled
        }),
      ];

      const result = recalculatePaymentsForDateChange(
        existingPayments,
        localDate(2025, 0, 1),
        localDate(2025, 1, 28),
        localDate(2025, 0, 1),
        localDate(2025, 1, 28), // Same dates
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Feb should be created (the existing one is cancelled)
      expect(result.paymentsToCreate.length).toBe(1);
    });
  });

  describe('Amount Calculation Verification', () => {
    it('should calculate correct amounts for Jan 15 to Jul 15 at $1000/month', () => {
      // This is a fresh calculation (no existing payments)
      const result = recalculatePaymentsForDateChange(
        [], // No existing payments
        localDate(2025, 0, 1), // Dummy original dates
        localDate(2025, 0, 1),
        localDate(2025, 0, 15),
        localDate(2025, 6, 15), // Jan 15 to Jul 15
        MONTHLY_RENT_CENTS,
        PAYMENT_METHOD_ID
      );

      // Should create 7 payments
      expect(result.paymentsToCreate.length).toBe(7);

      // Service fee rate should be 1.5% (>= 6 months)
      expect(result.newRate).toBe(0.015);

      // Verify amounts (all should be in cents)
      const payments = result.paymentsToCreate;

      // Jan: 17/31 days = $548.39 base, + 1.5% = ~$556.62 total
      const janPayment = payments.find(
        (p) => p.dueDate.getMonth() === 0 && p.dueDate.getDate() === 15
      );
      expect(janPayment?.baseAmount).toBe(54839); // 54839 cents
      // Allow 1 cent tolerance for rounding: 54839 * 1.015 = 55661.585 → 55661 or 55662
      expect(janPayment?.totalAmount).toBeGreaterThanOrEqual(55661);
      expect(janPayment?.totalAmount).toBeLessThanOrEqual(55662);

      // Feb: Full month = $1000 base, + 1.5% = $1015 total
      const febPayment = payments.find(
        (p) => p.dueDate.getMonth() === 1 && p.dueDate.getDate() === 1
      );
      expect(febPayment?.baseAmount).toBe(100000);
      expect(febPayment?.totalAmount).toBe(101500);

      // Jul: 15/31 days = $483.87 base, + 1.5% = ~$491.13 total
      const julPayment = payments.find(
        (p) => p.dueDate.getMonth() === 6 && p.dueDate.getDate() === 1
      );
      expect(julPayment?.baseAmount).toBe(48387);
      // Allow 1 cent tolerance: 48387 * 1.015 = 49112.805 → 49112 or 49113
      expect(julPayment?.totalAmount).toBeGreaterThanOrEqual(49112);
      expect(julPayment?.totalAmount).toBeLessThanOrEqual(49113);
    });
  });
});

describe('findPaidPaymentsInRemovedRange', () => {
  it('should find paid payments that would be removed', () => {
    const existingPayments: ExistingPayment[] = [
      createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
        status: 'PENDING',
      }),
      createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
        status: 'PENDING',
      }),
      createMockPayment('pay_3', localDate(2025, 2, 1), 103000, {
        status: 'SUCCEEDED',
        isPaid: true,
      }),
    ];

    const paidInRemoved = findPaidPaymentsInRemovedRange(
      existingPayments,
      localDate(2025, 1, 28) // New end date Feb 28
    );

    // March payment is paid and would be removed
    expect(paidInRemoved.length).toBe(1);
    expect(paidInRemoved[0].id).toBe('pay_3');
  });

  it('should return empty array when no paid payments in removed range', () => {
    const existingPayments: ExistingPayment[] = [
      createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
        status: 'PENDING',
      }),
      createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
        status: 'PENDING',
      }),
    ];

    const paidInRemoved = findPaidPaymentsInRemovedRange(
      existingPayments,
      localDate(2025, 0, 31) // New end date Jan 31
    );

    // Feb payment is unpaid, so it can be removed
    expect(paidInRemoved.length).toBe(0);
  });

  it('should ignore already cancelled payments', () => {
    const existingPayments: ExistingPayment[] = [
      createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
        status: 'SUCCEEDED',
        isPaid: true,
      }),
      createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
        status: 'SUCCEEDED',
        isPaid: true,
        cancelledAt: new Date(), // Already cancelled
      }),
    ];

    const paidInRemoved = findPaidPaymentsInRemovedRange(
      existingPayments,
      localDate(2025, 0, 31) // New end date Jan 31
    );

    // Feb payment is cancelled, so it's not a problem
    expect(paidInRemoved.length).toBe(0);
  });

  it('should find PROCESSING payments in removed range', () => {
    const existingPayments: ExistingPayment[] = [
      createMockPayment('pay_1', localDate(2025, 0, 1), 103000, {
        status: 'PENDING',
      }),
      createMockPayment('pay_2', localDate(2025, 1, 1), 103000, {
        status: 'PROCESSING', // ACH in progress
      }),
    ];

    const paidInRemoved = findPaidPaymentsInRemovedRange(
      existingPayments,
      localDate(2025, 0, 31) // New end date Jan 31
    );

    // Feb payment is processing, cannot be cancelled
    expect(paidInRemoved.length).toBe(1);
    expect(paidInRemoved[0].id).toBe('pay_2');
  });
});
