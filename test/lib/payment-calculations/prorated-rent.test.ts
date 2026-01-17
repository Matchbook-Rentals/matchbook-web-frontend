import { describe, it, expect } from 'vitest';
import { calculateProratedRent, generatePaymentSchedule } from '@/lib/payment-calculations';

// Helper to create local dates (month is 0-indexed: 0=Jan, 1=Feb, etc.)
const localDate = (year: number, month: number, day: number) => new Date(year, month, day);

describe('calculateProratedRent', () => {
  describe('Full month - no proration needed', () => {
    it('should return full amount when starting on 1st with no end date', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 1));

      expect(result.isProrated).toBe(false);
      expect(result.amount).toBe(1000);
      expect(result.daysInMonth).toBe(31);
      expect(result.daysToCharge).toBe(31);
    });

    it('should return full amount when starting on 1st and ending on last day', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 0, 1),
        localDate(2025, 0, 31)
      );

      expect(result.isProrated).toBe(false);
      expect(result.amount).toBe(1000);
    });

    it('should return full amount for February 1 to February 28 (non-leap)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 1, 1),
        localDate(2025, 1, 28)
      );

      expect(result.isProrated).toBe(false);
      expect(result.amount).toBe(1000);
      expect(result.daysInMonth).toBe(28);
    });

    it('should return full amount for February 1 to February 29 (leap year)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2024, 1, 1),
        localDate(2024, 1, 29)
      );

      expect(result.isProrated).toBe(false);
      expect(result.amount).toBe(1000);
      expect(result.daysInMonth).toBe(29);
    });
  });

  describe('First month proration - mid-month start', () => {
    it('should correctly prorate January 15 start (17 days of 31)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 15));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(31);
      expect(result.daysToCharge).toBe(17); // 31 - 15 + 1 = 17
      // Expected: 1000 * 17 / 31 = 548.39
      expect(result.amount).toBeCloseTo(548.39, 2);
    });

    it('should correctly prorate January 25 start (7 days of 31)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 25));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(31);
      expect(result.daysToCharge).toBe(7); // 31 - 25 + 1 = 7
      // Expected: 1000 * 7 / 31 = 225.81
      expect(result.amount).toBeCloseTo(225.81, 2);
    });

    it('should correctly prorate February 15 start in non-leap year (14 days of 28)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 1, 15));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(28);
      expect(result.daysToCharge).toBe(14); // 28 - 15 + 1 = 14
      // Expected: 1000 * 14 / 28 = 500.00
      expect(result.amount).toBe(500);
    });

    it('should correctly prorate February 15 start in leap year (15 days of 29)', () => {
      const result = calculateProratedRent(1000, localDate(2024, 1, 15));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(29);
      expect(result.daysToCharge).toBe(15); // 29 - 15 + 1 = 15
      // Expected: 1000 * 15 / 29 = 517.24
      expect(result.amount).toBeCloseTo(517.24, 2);
    });

    it('should correctly prorate start on 2nd (almost full month)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 2));

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(30); // 31 - 2 + 1 = 30
      // Expected: 1000 * 30 / 31 = 967.74
      expect(result.amount).toBeCloseTo(967.74, 2);
    });

    it('should correctly prorate start on last day of month (1 day)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 31));

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(1);
      // Expected: 1000 * 1 / 31 = 32.26
      expect(result.amount).toBeCloseTo(32.26, 2);
    });
  });

  describe('Last month proration - end before month end', () => {
    it('should correctly prorate February 1 to February 15 (non-leap year)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 1, 1),
        localDate(2025, 1, 15)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(28);
      expect(result.daysToCharge).toBe(15);
      // Expected: 1000 * 15 / 28 = 535.71
      expect(result.amount).toBeCloseTo(535.71, 2);
    });

    it('should correctly prorate February 1 to February 15 (leap year)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2024, 1, 1),
        localDate(2024, 1, 15)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(29);
      expect(result.daysToCharge).toBe(15);
      // Expected: 1000 * 15 / 29 = 517.24
      expect(result.amount).toBeCloseTo(517.24, 2);
    });

    it('should correctly prorate March 1 to March 20 (20 days of 31)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 2, 1),
        localDate(2025, 2, 20)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(20);
      // Expected: 1000 * 20 / 31 = 645.16
      expect(result.amount).toBeCloseTo(645.16, 2);
    });

    it('should correctly prorate to 2nd day of month (almost empty)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 1, 1),
        localDate(2025, 1, 2)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(2);
      // Expected: 1000 * 2 / 28 = 71.43
      expect(result.amount).toBeCloseTo(71.43, 2);
    });
  });

  describe('February edge cases', () => {
    it('should handle February 28 end in non-leap year as full month', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 1, 1),
        localDate(2025, 1, 28)
      );

      expect(result.isProrated).toBe(false);
      expect(result.daysInMonth).toBe(28);
      expect(result.amount).toBe(1000);
    });

    it('should handle February 28 end in leap year as prorated', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2024, 1, 1),
        localDate(2024, 1, 28)
      );

      // In leap year, Feb 28 is NOT the last day, so this should be prorated
      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(29);
      expect(result.daysToCharge).toBe(28);
      // Expected: 1000 * 28 / 29 = 965.52
      expect(result.amount).toBeCloseTo(965.52, 2);
    });

    it('should handle February 29 end in leap year as full month', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2024, 1, 1),
        localDate(2024, 1, 29)
      );

      expect(result.isProrated).toBe(false);
      expect(result.daysInMonth).toBe(29);
      expect(result.amount).toBe(1000);
    });

    it('should correctly prorate February 20 start (non-leap)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 1, 20));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(28);
      expect(result.daysToCharge).toBe(9); // 28 - 20 + 1 = 9
      // Expected: 1000 * 9 / 28 = 321.43
      expect(result.amount).toBeCloseTo(321.43, 2);
    });

    it('should correctly prorate February 20 start (leap year)', () => {
      const result = calculateProratedRent(1000, localDate(2024, 1, 20));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(29);
      expect(result.daysToCharge).toBe(10); // 29 - 20 + 1 = 10
      // Expected: 1000 * 10 / 29 = 344.83
      expect(result.amount).toBeCloseTo(344.83, 2);
    });
  });

  describe('Very short stays', () => {
    it('should correctly prorate 4-day stay at end of January', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 28));

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(4); // 31 - 28 + 1 = 4
      // Expected: 1000 * 4 / 31 = 129.03
      expect(result.amount).toBeCloseTo(129.03, 2);
    });

    it('should correctly prorate 4-day stay at end of February', () => {
      const result = calculateProratedRent(1000, localDate(2025, 1, 25));

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(4); // 28 - 25 + 1 = 4
      // Expected: 1000 * 4 / 28 = 142.86
      expect(result.amount).toBeCloseTo(142.86, 2);
    });

    it('should correctly prorate single day stay', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 1, 1),
        localDate(2025, 1, 1)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysToCharge).toBe(1);
      // Expected: 1000 * 1 / 28 = 35.71
      expect(result.amount).toBeCloseTo(35.71, 2);
    });
  });

  describe('Different rent amounts', () => {
    it('should correctly prorate $1500 rent (January 15)', () => {
      const result = calculateProratedRent(1500, localDate(2025, 0, 15));

      expect(result.daysToCharge).toBe(17);
      // Expected: 1500 * 17 / 31 = 822.58
      expect(result.amount).toBeCloseTo(822.58, 2);
    });

    it('should correctly prorate $2500 rent (January 15)', () => {
      const result = calculateProratedRent(2500, localDate(2025, 0, 15));

      expect(result.daysToCharge).toBe(17);
      // Expected: 2500 * 17 / 31 = 1370.97
      expect(result.amount).toBeCloseTo(1370.97, 2);
    });

    it('should correctly prorate $750 rent (January 15)', () => {
      const result = calculateProratedRent(750, localDate(2025, 0, 15));

      expect(result.daysToCharge).toBe(17);
      // Expected: 750 * 17 / 31 = 411.29
      expect(result.amount).toBeCloseTo(411.29, 2);
    });

    it('should correctly prorate $3000 rent (February 15, non-leap)', () => {
      const result = calculateProratedRent(3000, localDate(2025, 1, 15));

      expect(result.daysToCharge).toBe(14);
      // Expected: 3000 * 14 / 28 = 1500.00
      expect(result.amount).toBe(1500);
    });
  });

  describe('30-day months', () => {
    it('should correctly prorate April 15 start (16 days of 30)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 3, 15));

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(30);
      expect(result.daysToCharge).toBe(16); // 30 - 15 + 1 = 16
      // Expected: 1000 * 16 / 30 = 533.33
      expect(result.amount).toBeCloseTo(533.33, 2);
    });

    it('should correctly prorate June 1 to June 20 (20 days of 30)', () => {
      const result = calculateProratedRent(
        1000,
        localDate(2025, 5, 1),
        localDate(2025, 5, 20)
      );

      expect(result.isProrated).toBe(true);
      expect(result.daysInMonth).toBe(30);
      expect(result.daysToCharge).toBe(20);
      // Expected: 1000 * 20 / 30 = 666.67
      expect(result.amount).toBeCloseTo(666.67, 2);
    });

    it('should handle September (30 days) correctly', () => {
      const result = calculateProratedRent(1000, localDate(2025, 8, 15));

      expect(result.daysInMonth).toBe(30);
      expect(result.daysToCharge).toBe(16);
      // Expected: 1000 * 16 / 30 = 533.33
      expect(result.amount).toBeCloseTo(533.33, 2);
    });
  });

  describe('Daily rate accuracy', () => {
    it('should calculate correct daily rate for January', () => {
      const result = calculateProratedRent(1000, localDate(2025, 0, 15));

      // Daily rate: 1000 / 31 = 32.258...
      expect(result.dailyRate).toBeCloseTo(32.26, 2);
    });

    it('should calculate correct daily rate for February (non-leap)', () => {
      const result = calculateProratedRent(1000, localDate(2025, 1, 15));

      // Daily rate: 1000 / 28 = 35.714...
      expect(result.dailyRate).toBeCloseTo(35.71, 2);
    });

    it('should calculate correct daily rate for February (leap)', () => {
      const result = calculateProratedRent(1000, localDate(2024, 1, 15));

      // Daily rate: 1000 / 29 = 34.483...
      expect(result.dailyRate).toBeCloseTo(34.48, 2);
    });
  });
});

describe('generatePaymentSchedule', () => {
  describe('User scenario: January 15 to February 15', () => {
    it('should generate correct payment schedule for Jan 15 to Feb 15', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 15), endDate: localDate(2025, 1, 15) },
        1000, // monthly rent
        0,    // no pet rent
        true  // include service fee
      );

      expect(schedule.length).toBe(2);

      // First payment: January 15-31 (17 days)
      expect(schedule[0].isProrated).toBe(true);
      expect(schedule[0].breakdown?.rent).toBeCloseTo(548.39, 0); // Allow rounding
      // Service fee: 3% of prorated rent
      expect(schedule[0].breakdown?.serviceFee).toBeCloseTo(16.45, 0);

      // Second payment: February 1-15 (15 days of 28)
      expect(schedule[1].isProrated).toBe(true);
      expect(schedule[1].breakdown?.rent).toBeCloseTo(535.71, 0);
      expect(schedule[1].breakdown?.serviceFee).toBeCloseTo(16.07, 0);
    });

    it('should generate correct payment schedule for Jan 15 to Feb 15 (leap year)', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2024, 0, 15), endDate: localDate(2024, 1, 15) },
        1000,
        0,
        true
      );

      expect(schedule.length).toBe(2);

      // First payment: January 15-31 (17 days)
      expect(schedule[0].breakdown?.rent).toBeCloseTo(548.39, 0);

      // Second payment: February 1-15 (15 days of 29)
      // Expected: 1000 * 15 / 29 = 517.24
      expect(schedule[1].breakdown?.rent).toBeCloseTo(517.24, 0);
    });
  });

  describe('Full month stays', () => {
    it('should not prorate for January 1 to January 31', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      expect(schedule.length).toBe(1);
      expect(schedule[0].isProrated).toBe(false);
      expect(schedule[0].breakdown?.rent).toBe(1000);
    });

    it('should handle multi-month full stays', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 2, 31) },
        1000,
        0,
        true
      );

      expect(schedule.length).toBe(3);
      expect(schedule[0].isProrated).toBe(false);
      expect(schedule[1].isProrated).toBe(false);
      expect(schedule[2].isProrated).toBe(false);
    });
  });

  describe('Service fee calculation', () => {
    it('should apply 3% service fee for short-term stays (< 6 months)', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      // 3% of $1000 = $30
      expect(schedule[0].breakdown?.serviceFee).toBe(30);
      expect(schedule[0].amount).toBe(1030);
    });

    it('should apply 1.5% service fee for long-term stays (>= 6 months)', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 6, 31) },
        1000,
        0,
        true
      );

      // For >= 6 months, rate is 1.5%
      // First month: 1.5% of $1000 = $15
      expect(schedule[0].breakdown?.serviceFee).toBe(15);
    });
  });

  describe('Pet rent', () => {
    it('should include pet rent in proration calculations', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 15), endDate: localDate(2025, 0, 31) },
        1000,  // monthly rent
        100,   // pet rent
        true
      );

      expect(schedule.length).toBe(1);
      // Total monthly: $1100, prorated for 17 days of 31
      // Expected rent portion: 1000 * 17 / 31 = 548.39
      // Expected pet rent portion: 100 * 17 / 31 = 54.84
      expect(schedule[0].breakdown?.rent).toBeCloseTo(548.39, 0);
      expect(schedule[0].breakdown?.petRent).toBeCloseTo(54.84, 0);
    });
  });

  describe('Itemized charges in payment schedule', () => {
    it('should include charges array in each payment', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      expect(schedule[0].charges).toBeDefined();
      expect(Array.isArray(schedule[0].charges)).toBe(true);
      expect(schedule[0].charges!.length).toBeGreaterThan(0);
    });

    it('should include BASE_RENT charge', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      const baseRentCharge = schedule[0].charges?.find(c => c.category === 'BASE_RENT');
      expect(baseRentCharge).toBeDefined();
      expect(baseRentCharge?.isApplied).toBe(true);
    });

    it('should include PLATFORM_FEE charge with correct rate metadata', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      const platformFee = schedule[0].charges?.find(c => c.category === 'PLATFORM_FEE');
      expect(platformFee).toBeDefined();
      expect(platformFee?.isApplied).toBe(true);
      // Metadata should include rate info
      expect(platformFee?.metadata).toBeDefined();
    });

    it('should include PET_RENT charge when pet rent is specified', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        100, // pet rent
        true
      );

      const petRentCharge = schedule[0].charges?.find(c => c.category === 'PET_RENT');
      expect(petRentCharge).toBeDefined();
      expect(petRentCharge?.isApplied).toBe(true);
    });

    it('should include baseAmount and totalAmount fields', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000,
        0,
        true
      );

      expect(schedule[0].baseAmount).toBeDefined();
      expect(schedule[0].totalAmount).toBeDefined();
      // totalAmount should be greater than baseAmount (includes fees)
      expect(schedule[0].totalAmount).toBeGreaterThan(schedule[0].baseAmount!);
    });

    it('should have charges in cents (not dollars)', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 0, 1), endDate: localDate(2025, 0, 31) },
        1000, // $1000 rent
        0,
        true
      );

      const baseRentCharge = schedule[0].charges?.find(c => c.category === 'BASE_RENT');
      // $1000 in cents = 100000
      expect(baseRentCharge?.amount).toBe(100000);
    });
  });

  describe('Complete booking scenario: Feb 10 to Dec 31', () => {
    it('should generate 11 payments with correct totals', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 1, 10), endDate: localDate(2025, 11, 31) },
        1000,
        0,
        true
      );

      expect(schedule.length).toBe(11);

      // First payment: Feb 10-28 (19 days of 28)
      expect(schedule[0].isProrated).toBe(true);
      // 1000 * 19 / 28 = 678.57
      expect(schedule[0].breakdown?.rent).toBeCloseTo(678.57, 0);

      // Payments 2-11 should be full months
      for (let i = 1; i < 11; i++) {
        expect(schedule[i].breakdown?.rent).toBe(1000);
      }
    });

    it('should apply long-term rate (1.5%) for 11-month stay', () => {
      const schedule = generatePaymentSchedule(
        { startDate: localDate(2025, 1, 10), endDate: localDate(2025, 11, 31) },
        1000,
        0,
        true
      );

      // 11 months >= 6, so 1.5% rate
      // First month: 1.5% of $678.57 = $10.18
      expect(schedule[0].breakdown?.serviceFee).toBeCloseTo(10.18, 0);

      // Full month: 1.5% of $1000 = $15
      expect(schedule[1].breakdown?.serviceFee).toBe(15);
    });
  });
});
