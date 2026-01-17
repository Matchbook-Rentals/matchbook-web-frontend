import { describe, it, expect } from 'vitest';
import {
  buildDepositCharges,
  buildMonthlyRentCharges,
  createBaseRentCharge,
  createSecurityDepositCharge,
  createPetRentCharge,
  createPetDepositCharge,
  createPlatformFeeCharge,
  createCreditCardFeeCharge,
  createTransferFeeCharge,
  createDiscountCharge,
  calculateTotalFromCharges,
  calculateBaseFromCharges,
  findChargeByCategory,
  validateChargeBreakdown
} from '@/lib/charge-builders';
import { FEES } from '@/lib/fee-constants';

/**
 * Tests for charge-builders.ts
 *
 * All amounts in these functions are in CENTS (not dollars).
 *
 * Fee structure:
 * - Transfer fee: $7 flat (700 cents)
 * - Service fee: 3% short-term (<6 months), 1.5% long-term (>=6 months)
 * - Credit card fee: 3% self-inclusive
 */

describe('Individual Charge Builders', () => {
  describe('createBaseRentCharge', () => {
    it('should create a base rent charge with correct category', () => {
      const charge = createBaseRentCharge(100000); // $1000 in cents

      expect(charge.category).toBe('BASE_RENT');
      expect(charge.amount).toBe(100000);
      expect(charge.isApplied).toBe(true);
    });

    it('should include proration metadata when provided', () => {
      const charge = createBaseRentCharge(54839, {
        daysInMonth: 31,
        daysToCharge: 17,
        dailyRate: 32.26
      });

      expect(charge.metadata).toEqual({
        daysInMonth: 31,
        daysToCharge: 17,
        dailyRate: 32.26
      });
    });
  });

  describe('createSecurityDepositCharge', () => {
    it('should create a security deposit charge', () => {
      const charge = createSecurityDepositCharge(100000); // $1000

      expect(charge.category).toBe('SECURITY_DEPOSIT');
      expect(charge.amount).toBe(100000);
      expect(charge.isApplied).toBe(true);
    });
  });

  describe('createPetRentCharge', () => {
    it('should calculate pet rent for multiple pets', () => {
      const charge = createPetRentCharge(2, 5000); // 2 pets at $50 each

      expect(charge.category).toBe('PET_RENT');
      expect(charge.amount).toBe(10000); // $100 total
      expect(charge.metadata).toEqual({
        petCount: 2,
        petRentPerPet: 5000
      });
    });

    it('should handle single pet', () => {
      const charge = createPetRentCharge(1, 7500); // 1 pet at $75

      expect(charge.amount).toBe(7500);
    });
  });

  describe('createPetDepositCharge', () => {
    it('should calculate pet deposit for multiple pets', () => {
      const charge = createPetDepositCharge(2, 25000); // 2 pets at $250 each

      expect(charge.category).toBe('PET_DEPOSIT');
      expect(charge.amount).toBe(50000); // $500 total
      expect(charge.metadata).toEqual({
        petCount: 2,
        petDepositPerPet: 25000
      });
    });
  });

  describe('createPlatformFeeCharge', () => {
    it('should apply 3% for short-term stays (<6 months)', () => {
      const charge = createPlatformFeeCharge(100000, 3); // $1000 base, 3 months

      expect(charge.category).toBe('PLATFORM_FEE');
      // 3% of $1000 = $30 = 3000 cents
      expect(charge.amount).toBe(3000);
      expect(charge.metadata?.rate).toBe(3);
      expect(charge.metadata?.rateType).toBe('short_term');
    });

    it('should apply 1.5% for long-term stays (>=6 months)', () => {
      const charge = createPlatformFeeCharge(100000, 6); // $1000 base, 6 months

      expect(charge.category).toBe('PLATFORM_FEE');
      // 1.5% of $1000 = $15 = 1500 cents
      expect(charge.amount).toBe(1500);
      expect(charge.metadata?.rate).toBe(1.5);
      expect(charge.metadata?.rateType).toBe('long_term');
    });

    it('should apply 1.5% for 12-month stays', () => {
      const charge = createPlatformFeeCharge(100000, 12);

      expect(charge.amount).toBe(1500);
      expect(charge.metadata?.rateType).toBe('long_term');
    });
  });

  describe('createCreditCardFeeCharge', () => {
    it('should calculate 3% self-inclusive credit card fee', () => {
      const charge = createCreditCardFeeCharge(100000); // $1000 base

      expect(charge.category).toBe('CREDIT_CARD_FEE');
      // Self-inclusive: total = 100000 / (1 - 0.03) = 103092.78
      // Fee = 103092.78 - 100000 = 3092.78 ≈ 3093 cents
      expect(charge.amount).toBe(3093);
      expect(charge.metadata?.calculation).toBe('self_inclusive');
    });

    it('should allow setting isApplied to false', () => {
      const charge = createCreditCardFeeCharge(100000, false);

      expect(charge.isApplied).toBe(false);
    });
  });

  describe('createTransferFeeCharge', () => {
    it('should create flat $7 transfer fee', () => {
      const charge = createTransferFeeCharge();

      expect(charge.category).toBe('TRANSFER_FEE');
      expect(charge.amount).toBe(700); // $7 = 700 cents
      expect(charge.metadata?.flatFee).toBe(true);
    });
  });

  describe('createDiscountCharge', () => {
    it('should create negative amount for discounts', () => {
      const charge = createDiscountCharge(5000, 'First month discount');

      expect(charge.category).toBe('DISCOUNT');
      expect(charge.amount).toBe(-5000); // Negative
      expect(charge.metadata?.reason).toBe('First month discount');
    });

    it('should ensure amount is always negative', () => {
      const charge = createDiscountCharge(-5000, 'Already negative');

      expect(charge.amount).toBe(-5000);
    });
  });
});

describe('buildDepositCharges', () => {
  describe('Security deposit only (no card)', () => {
    it('should include security deposit and transfer fee', () => {
      const result = buildDepositCharges({
        securityDeposit: 100000, // $1000
        includeCardFee: false
      });

      expect(result.charges).toHaveLength(2);

      const depositCharge = findChargeByCategory(result.charges, 'SECURITY_DEPOSIT');
      const transferFee = findChargeByCategory(result.charges, 'TRANSFER_FEE');

      expect(depositCharge?.amount).toBe(100000);
      expect(transferFee?.amount).toBe(700);

      // Base = deposit only
      expect(result.baseAmount).toBe(100000);
      // Total = deposit + transfer fee
      expect(result.totalAmount).toBe(100700);
    });
  });

  describe('Security deposit with card fee', () => {
    it('should include credit card fee on total', () => {
      const result = buildDepositCharges({
        securityDeposit: 100000, // $1000
        includeCardFee: true
      });

      expect(result.charges).toHaveLength(3);

      const cardFee = findChargeByCategory(result.charges, 'CREDIT_CARD_FEE');
      expect(cardFee).toBeDefined();

      // Base = $1000 deposit
      expect(result.baseAmount).toBe(100000);
      // Card fee calculated on (deposit + transfer fee) = $1007
      // Total = base + transfer + card fee
      expect(result.totalAmount).toBeGreaterThan(100700);
    });
  });

  describe('With pet deposit', () => {
    it('should include pet deposit in charges', () => {
      const result = buildDepositCharges({
        securityDeposit: 100000, // $1000
        petDeposit: 25000, // $250
        includeCardFee: false
      });

      const petDeposit = findChargeByCategory(result.charges, 'PET_DEPOSIT');
      expect(petDeposit?.amount).toBe(25000);

      // Base = security + pet deposit
      expect(result.baseAmount).toBe(125000);
      // Total = base + transfer fee
      expect(result.totalAmount).toBe(125700);
    });
  });

  describe('User scenario: $1000 deposit, $7 transfer fee', () => {
    it('should calculate correct breakdown for ACH payment', () => {
      const result = buildDepositCharges({
        securityDeposit: 100000,
        includeCardFee: false
      });

      expect(result.baseAmount).toBe(100000); // $1000
      expect(result.totalAmount).toBe(100700); // $1007
    });

    it('should calculate correct breakdown for card payment', () => {
      const result = buildDepositCharges({
        securityDeposit: 100000,
        includeCardFee: true
      });

      expect(result.baseAmount).toBe(100000); // $1000
      // Total includes card fee on $1007
      // Card fee = 1007 / 0.97 - 1007 = ~$31.14 = 3114 cents
      expect(result.totalAmount).toBeCloseTo(103814, -1); // ~$1038.14
    });
  });
});

describe('buildMonthlyRentCharges', () => {
  describe('Base rent only (short-term, no card)', () => {
    it('should include base rent and platform fee', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 100000, // $1000
        durationMonths: 3,
        includeCardFee: false
      });

      expect(result.charges).toHaveLength(2);

      const rentCharge = findChargeByCategory(result.charges, 'BASE_RENT');
      const platformFee = findChargeByCategory(result.charges, 'PLATFORM_FEE');

      expect(rentCharge?.amount).toBe(100000);
      // 3% of $1000 = $30
      expect(platformFee?.amount).toBe(3000);

      expect(result.baseAmount).toBe(100000);
      expect(result.totalAmount).toBe(103000); // $1030
    });
  });

  describe('With pet rent', () => {
    it('should include pet rent and calculate platform fee on total', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 100000, // $1000
        petRent: 10000, // $100
        durationMonths: 3,
        includeCardFee: false
      });

      expect(result.charges).toHaveLength(3);

      const petRent = findChargeByCategory(result.charges, 'PET_RENT');
      expect(petRent?.amount).toBe(10000);

      const platformFee = findChargeByCategory(result.charges, 'PLATFORM_FEE');
      // 3% of ($1000 + $100) = 3% of $1100 = $33
      expect(platformFee?.amount).toBe(3300);

      expect(result.baseAmount).toBe(110000); // $1100
      expect(result.totalAmount).toBe(113300); // $1133
    });
  });

  describe('Long-term stay (>=6 months)', () => {
    it('should apply 1.5% platform fee', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 100000,
        durationMonths: 6,
        includeCardFee: false
      });

      const platformFee = findChargeByCategory(result.charges, 'PLATFORM_FEE');
      // 1.5% of $1000 = $15
      expect(platformFee?.amount).toBe(1500);

      expect(result.totalAmount).toBe(101500); // $1015
    });
  });

  describe('With credit card fee', () => {
    it('should calculate card fee on (rent + platform fee)', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 100000,
        durationMonths: 3,
        includeCardFee: true
      });

      expect(result.charges).toHaveLength(3);

      const cardFee = findChargeByCategory(result.charges, 'CREDIT_CARD_FEE');
      expect(cardFee).toBeDefined();

      // Base + platform fee = $1030
      // Card fee = 1030 / 0.97 - 1030 ≈ $31.85
      expect(result.totalAmount).toBeGreaterThan(103000);
    });
  });

  describe('Prorated rent', () => {
    it('should include proration metadata', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 54839, // Prorated $548.39
        durationMonths: 1,
        includeCardFee: false,
        isProrated: true,
        proratedInfo: {
          daysInMonth: 31,
          daysToCharge: 17
        }
      });

      const rentCharge = findChargeByCategory(result.charges, 'BASE_RENT');
      expect(rentCharge?.metadata).toEqual({
        daysInMonth: 31,
        daysToCharge: 17
      });
    });
  });

  describe('User scenario: $1000/month, 1 month stay, 3% service fee', () => {
    it('should calculate correct breakdown', () => {
      const result = buildMonthlyRentCharges({
        baseRent: 100000,
        durationMonths: 1,
        includeCardFee: false
      });

      expect(result.baseAmount).toBe(100000); // $1000
      expect(result.totalAmount).toBe(103000); // $1030 with 3% fee
    });
  });
});

describe('Charge Calculation Helpers', () => {
  describe('calculateTotalFromCharges', () => {
    it('should sum only applied charges', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true },
        { category: 'PLATFORM_FEE' as const, amount: 3000, isApplied: true },
        { category: 'CREDIT_CARD_FEE' as const, amount: 3000, isApplied: false }
      ];

      expect(calculateTotalFromCharges(charges)).toBe(103000);
    });

    it('should handle discounts (negative amounts)', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true },
        { category: 'DISCOUNT' as const, amount: -5000, isApplied: true }
      ];

      expect(calculateTotalFromCharges(charges)).toBe(95000);
    });
  });

  describe('calculateBaseFromCharges', () => {
    it('should sum only base charges (not fees)', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true },
        { category: 'PET_RENT' as const, amount: 10000, isApplied: true },
        { category: 'PLATFORM_FEE' as const, amount: 3300, isApplied: true },
        { category: 'CREDIT_CARD_FEE' as const, amount: 3000, isApplied: true }
      ];

      expect(calculateBaseFromCharges(charges)).toBe(110000); // Only rent amounts
    });

    it('should include deposits in base amount', () => {
      const charges = [
        { category: 'SECURITY_DEPOSIT' as const, amount: 100000, isApplied: true },
        { category: 'PET_DEPOSIT' as const, amount: 25000, isApplied: true },
        { category: 'TRANSFER_FEE' as const, amount: 700, isApplied: true }
      ];

      expect(calculateBaseFromCharges(charges)).toBe(125000); // Deposits only
    });
  });

  describe('validateChargeBreakdown', () => {
    it('should pass when totals match within tolerance', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true },
        { category: 'PLATFORM_FEE' as const, amount: 3000, isApplied: true }
      ];

      const result = validateChargeBreakdown(charges, 103000);
      expect(result.valid).toBe(true);
      expect(result.difference).toBe(0);
    });

    it('should pass when within 1 cent tolerance', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true }
      ];

      const result = validateChargeBreakdown(charges, 100001);
      expect(result.valid).toBe(true);
      expect(result.difference).toBe(1);
    });

    it('should fail when difference exceeds tolerance', () => {
      const charges = [
        { category: 'BASE_RENT' as const, amount: 100000, isApplied: true }
      ];

      const result = validateChargeBreakdown(charges, 100002);
      expect(result.valid).toBe(false);
      expect(result.difference).toBe(2);
    });
  });
});

describe('Integration: Complete Payment Scenarios', () => {
  describe('Jan 15 to Feb 15 booking with $1000 rent, $1000 deposit', () => {
    it('should calculate correct deposit charges (ACH)', () => {
      const depositCharges = buildDepositCharges({
        securityDeposit: 100000, // $1000
        includeCardFee: false
      });

      // Deposit due today: $1000 + $7 transfer = $1007
      expect(depositCharges.totalAmount).toBe(100700);
    });

    it('should calculate correct deposit charges (Card)', () => {
      const depositCharges = buildDepositCharges({
        securityDeposit: 100000,
        includeCardFee: true
      });

      // $1007 + card fee (~$31.14) ≈ $1038.14
      expect(depositCharges.totalAmount).toBeCloseTo(103814, -2);
    });

    it('should calculate correct first month rent (prorated 17 days)', () => {
      // $1000 * 17/31 = $548.39 = 54839 cents
      const rentCharges = buildMonthlyRentCharges({
        baseRent: 54839,
        durationMonths: 1,
        includeCardFee: false
      });

      // 3% service fee on $548.39 = $16.45
      const platformFee = findChargeByCategory(rentCharges.charges, 'PLATFORM_FEE');
      expect(platformFee?.amount).toBeCloseTo(1645, 0);

      // Total = $548.39 + $16.45 = $564.84
      expect(rentCharges.totalAmount).toBeCloseTo(56484, 0);
    });

    it('should calculate correct second month rent (prorated 15 days of 28)', () => {
      // $1000 * 15/28 = $535.71 = 53571 cents
      const rentCharges = buildMonthlyRentCharges({
        baseRent: 53571,
        durationMonths: 1,
        includeCardFee: false
      });

      // 3% service fee on $535.71 = $16.07
      const platformFee = findChargeByCategory(rentCharges.charges, 'PLATFORM_FEE');
      expect(platformFee?.amount).toBeCloseTo(1607, 0);
    });
  });

  describe('6-month booking with $2000 rent, 2 pets ($50 pet rent each)', () => {
    it('should apply 1.5% long-term service fee', () => {
      const rentCharges = buildMonthlyRentCharges({
        baseRent: 200000, // $2000
        petRent: 10000,   // $100 total for 2 pets
        durationMonths: 6,
        includeCardFee: false
      });

      const platformFee = findChargeByCategory(rentCharges.charges, 'PLATFORM_FEE');
      // 1.5% of $2100 = $31.50
      expect(platformFee?.amount).toBe(3150);

      expect(rentCharges.baseAmount).toBe(210000); // $2100
      expect(rentCharges.totalAmount).toBe(213150); // $2131.50
    });
  });
});
