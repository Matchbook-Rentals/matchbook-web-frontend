import { describe, it, expect } from 'vitest';
import { generateRentPayments } from '@/app/actions/bookings';

/**
 * Tests for generateRentPayments function
 *
 * This function creates RentPayment records for bookings.
 * It uses Math.round() for amounts (rounds to whole dollars).
 *
 * Key behaviors:
 * - First payment due on start date (if starting after 1st, prorated)
 * - Monthly payments due on 1st of each subsequent month
 * - Last month prorated if ending before month end
 * - First payment has paymentAuthorizedAt set, others are null
 *
 * NOTE: Uses local date construction (new Date(year, month, day)) to avoid
 * timezone issues that occur with ISO string parsing (new Date('YYYY-MM-DD')).
 */

// Helper to create local dates (month is 0-indexed: 0=Jan, 1=Feb, etc.)
const localDate = (year: number, month: number, day: number) => new Date(year, month, day);

describe('generateRentPayments', async () => {
  const mockBookingId = 'test-booking-123';
  const mockPaymentMethodId = 'pm_test_123';

  describe('User scenario: January 15 to February 15, $1000 rent', async () => {
    it('should create 2 payments for Jan 15 to Feb 15', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15, 2025
        localDate(2025, 1, 15), // Feb 15, 2025
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(2);
    });

    it('should correctly prorate first payment (Jan 15-31: 17 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 1, 15), // Feb 15
        mockPaymentMethodId
      );

      // First payment: Jan 15-31 (17 days of 31)
      // Math.round(1000 * 17 / 31) = Math.round(548.39) = 548
      expect(payments[0].amount).toBe(548);
      expect(payments[0].dueDate).toEqual(localDate(2025, 0, 15));
      expect(payments[0].paymentAuthorizedAt).not.toBeNull();
      expect(payments[0].type).toBe('MONTHLY_RENT');
    });

    it('should correctly prorate second payment (Feb 1-15: 15 days of 28)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 1, 15), // Feb 15
        mockPaymentMethodId
      );

      // Second payment: Feb 1-15 (15 days of 28 in 2025)
      // Math.round(1000 * 15 / 28) = Math.round(535.71) = 536
      expect(payments[1].amount).toBe(536);
      expect(payments[1].dueDate).toEqual(localDate(2025, 1, 1));
      expect(payments[1].paymentAuthorizedAt).toBeNull();
    });

    it('should calculate different amount in leap year (Feb has 29 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2024, 0, 15), // Jan 15, 2024 (leap year)
        localDate(2024, 1, 15), // Feb 15, 2024
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(2);

      // January payment same: 548
      expect(payments[0].amount).toBe(548);

      // Feb payment different: 15 days of 29
      // Math.round(1000 * 15 / 29) = Math.round(517.24) = 517
      expect(payments[1].amount).toBe(517);
    });
  });

  describe('First month proration only', async () => {
    it('should create single prorated payment for partial first month', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 17 days of 31: Math.round(1000 * 17 / 31) = 548
      expect(payments[0].amount).toBe(548);
      expect(payments[0].dueDate).toEqual(localDate(2025, 0, 15));
    });

    it('should handle late start (January 25: 7 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 25), // Jan 25
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 7 days of 31: Math.round(1000 * 7 / 31) = Math.round(225.81) = 226
      expect(payments[0].amount).toBe(226);
    });

    it('should handle almost full month (January 2: 30 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 2), // Jan 2
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 30 days of 31: Math.round(1000 * 30 / 31) = Math.round(967.74) = 968
      expect(payments[0].amount).toBe(968);
    });
  });

  describe('Full months only (no proration)', async () => {
    it('should create single full payment for January 1-31', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(1000);
      expect(payments[0].dueDate).toEqual(localDate(2025, 0, 1));
    });

    it('should create 3 full payments for Jan 1 to Mar 31', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 2, 31), // Mar 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(3);
      expect(payments[0].amount).toBe(1000);
      expect(payments[1].amount).toBe(1000);
      expect(payments[2].amount).toBe(1000);

      expect(payments[0].dueDate).toEqual(localDate(2025, 0, 1));
      expect(payments[1].dueDate).toEqual(localDate(2025, 1, 1));
      expect(payments[2].dueDate).toEqual(localDate(2025, 2, 1));
    });

    it('should handle full February (non-leap)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 1, 1), // Feb 1
        localDate(2025, 1, 28), // Feb 28
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(1000);
    });

    it('should handle full February (leap year)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2024, 1, 1), // Feb 1, 2024 (leap year)
        localDate(2024, 1, 29), // Feb 29
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(1000);
    });
  });

  describe('Last month proration only', async () => {
    it('should prorate last month when ending early', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 1, 1), // Feb 1
        localDate(2025, 1, 15), // Feb 15
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 15 days of 28: Math.round(1000 * 15 / 28) = 536
      expect(payments[0].amount).toBe(536);
    });

    it('should prorate multi-month with early ending', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 1, 15), // Feb 15
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(2);
      expect(payments[0].amount).toBe(1000); // Full January
      expect(payments[1].amount).toBe(536);   // 15 days of 28 in February
    });
  });

  describe('February edge cases', async () => {
    it('should correctly calculate Feb 15 start (non-leap: 14 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 1, 15), // Feb 15
        localDate(2025, 1, 28), // Feb 28
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 14 days of 28: Math.round(1000 * 14 / 28) = 500
      expect(payments[0].amount).toBe(500);
    });

    it('should correctly calculate Feb 15 start (leap year: 15 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2024, 1, 15), // Feb 15, 2024 (leap year)
        localDate(2024, 1, 29), // Feb 29
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 15 days of 29: Math.round(1000 * 15 / 29) = 517
      expect(payments[0].amount).toBe(517);
    });

    it('should correctly handle Feb 28 end in leap year (prorated)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2024, 1, 1), // Feb 1, 2024 (leap year)
        localDate(2024, 1, 28), // Feb 28 (not last day in leap year!)
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // In leap year, Feb 28 is not the last day, so prorated
      // 28 days of 29: Math.round(1000 * 28 / 29) = 966
      expect(payments[0].amount).toBe(966);
    });

    it('should handle Feb 20 start (non-leap: 9 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 1, 20), // Feb 20
        localDate(2025, 1, 28), // Feb 28
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 9 days of 28: Math.round(1000 * 9 / 28) = Math.round(321.43) = 321
      expect(payments[0].amount).toBe(321);
    });

    it('should handle Feb 20 start (leap year: 10 days)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2024, 1, 20), // Feb 20, 2024 (leap year)
        localDate(2024, 1, 29), // Feb 29
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 10 days of 29: Math.round(1000 * 10 / 29) = Math.round(344.83) = 345
      expect(payments[0].amount).toBe(345);
    });
  });

  describe('Different rent amounts', async () => {
    it('should correctly prorate $1500 rent', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1500,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      // 17 days of 31: Math.round(1500 * 17 / 31) = Math.round(822.58) = 823
      expect(payments[0].amount).toBe(823);
    });

    it('should correctly prorate $2500 rent', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        2500,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      // 17 days of 31: Math.round(2500 * 17 / 31) = Math.round(1370.97) = 1371
      expect(payments[0].amount).toBe(1371);
    });

    it('should correctly prorate $750 rent', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        750,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      // 17 days of 31: Math.round(750 * 17 / 31) = Math.round(411.29) = 411
      expect(payments[0].amount).toBe(411);
    });
  });

  describe('30-day months', async () => {
    it('should correctly prorate April 15 start (16 days of 30)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 3, 15), // Apr 15
        localDate(2025, 3, 30), // Apr 30
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 16 days of 30: Math.round(1000 * 16 / 30) = Math.round(533.33) = 533
      expect(payments[0].amount).toBe(533);
    });

    it('should correctly prorate June 1 to June 20 (20 days of 30)', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 5, 1), // Jun 1
        localDate(2025, 5, 20), // Jun 20
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 20 days of 30: Math.round(1000 * 20 / 30) = Math.round(666.67) = 667
      expect(payments[0].amount).toBe(667);
    });
  });

  describe('Long-term bookings (6+ months)', async () => {
    it('should generate 7 payments for Jan 15 to Jul 15', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 6, 15), // Jul 15
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(7);

      // First: prorated Jan (17 days)
      expect(payments[0].amount).toBe(548);
      expect(payments[0].dueDate).toEqual(localDate(2025, 0, 15));

      // Feb through Jun: full months
      expect(payments[1].amount).toBe(1000);
      expect(payments[1].dueDate).toEqual(localDate(2025, 1, 1));
      expect(payments[2].amount).toBe(1000);
      expect(payments[3].amount).toBe(1000);
      expect(payments[4].amount).toBe(1000);
      expect(payments[5].amount).toBe(1000);

      // Last: prorated Jul (15 days of 31)
      // Math.round(1000 * 15 / 31) = Math.round(483.87) = 484
      expect(payments[6].amount).toBe(484);
      expect(payments[6].dueDate).toEqual(localDate(2025, 6, 1));
    });

    it('should generate full year of payments', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 11, 31), // Dec 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(12);

      // All should be full amounts
      payments.forEach((payment) => {
        expect(payment.amount).toBe(1000);
      });
    });
  });

  describe('Payment metadata', async () => {
    it('should set correct bookingId on all payments', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 2, 31), // Mar 31
        mockPaymentMethodId
      );

      payments.forEach((payment) => {
        expect(payment.bookingId).toBe(mockBookingId);
      });
    });

    it('should set correct stripePaymentMethodId on all payments', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 2, 31), // Mar 31
        mockPaymentMethodId
      );

      payments.forEach((payment) => {
        expect(payment.stripePaymentMethodId).toBe(mockPaymentMethodId);
      });
    });

    it('should only authorize first payment', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 15), // Jan 15
        localDate(2025, 2, 15), // Mar 15
        mockPaymentMethodId
      );

      expect(payments[0].paymentAuthorizedAt).not.toBeNull();
      expect(payments[1].paymentAuthorizedAt).toBeNull();
      expect(payments[2].paymentAuthorizedAt).toBeNull();
    });

    it('should set type to MONTHLY_RENT for all payments', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 1), // Jan 1
        localDate(2025, 2, 31), // Mar 31
        mockPaymentMethodId
      );

      payments.forEach((payment) => {
        expect(payment.type).toBe('MONTHLY_RENT');
      });
    });
  });

  describe('Very short stays', async () => {
    it('should handle 4-day stay at end of January', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 0, 28), // Jan 28
        localDate(2025, 0, 31), // Jan 31
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 4 days of 31: Math.round(1000 * 4 / 31) = Math.round(129.03) = 129
      expect(payments[0].amount).toBe(129);
    });

    it('should handle 4-day stay at end of February', async () => {
      const payments = await generateRentPayments(
        mockBookingId,
        1000,
        localDate(2025, 1, 25), // Feb 25
        localDate(2025, 1, 28), // Feb 28
        mockPaymentMethodId
      );

      expect(payments).toHaveLength(1);
      // 4 days of 28: Math.round(1000 * 4 / 28) = Math.round(142.86) = 143
      expect(payments[0].amount).toBe(143);
    });
  });
});
