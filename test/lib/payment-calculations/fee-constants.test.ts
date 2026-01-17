import { describe, it, expect } from 'vitest';
import {
  FEES,
  getServiceFeeRate,
  calculateServiceFee,
  getTransferFee,
  calculateCreditCardFee,
  calculateTotalWithStripeCardFee,
  reverseCalculateBaseAmount,
  calculateTotalWithCardFee
} from '@/lib/fee-constants';

/**
 * Tests for fee-constants.ts
 *
 * Fee structure:
 * - Transfer fee: $7 flat for deposits
 * - Service fee: 3% for < 6 months, 1.5% for >= 6 months
 * - Credit card fee: 3% self-inclusive
 */

describe('Fee Constants', () => {
  describe('FEES object', () => {
    it('should have correct transfer fee', () => {
      expect(FEES.TRANSFER_FEE_DOLLARS).toBe(7);
      expect(FEES.TRANSFER_FEE_CENTS).toBe(700);
    });

    it('should have correct service fee rates', () => {
      expect(FEES.SERVICE_FEE.SHORT_TERM_RATE).toBe(0.03);
      expect(FEES.SERVICE_FEE.LONG_TERM_RATE).toBe(0.015);
      expect(FEES.SERVICE_FEE.THRESHOLD_MONTHS).toBe(6);
    });

    it('should have correct credit card fee rate', () => {
      expect(FEES.CREDIT_CARD_FEE.PERCENTAGE).toBe(0.03);
    });
  });
});

describe('getServiceFeeRate', () => {
  it('should return 3% for 1 month stay', () => {
    expect(getServiceFeeRate(1)).toBe(0.03);
  });

  it('should return 3% for 5 month stay', () => {
    expect(getServiceFeeRate(5)).toBe(0.03);
  });

  it('should return 1.5% for exactly 6 month stay', () => {
    expect(getServiceFeeRate(6)).toBe(0.015);
  });

  it('should return 1.5% for 12 month stay', () => {
    expect(getServiceFeeRate(12)).toBe(0.015);
  });

  it('should return 1.5% for 24 month stay', () => {
    expect(getServiceFeeRate(24)).toBe(0.015);
  });
});

describe('calculateServiceFee', () => {
  describe('Short-term stays (< 6 months)', () => {
    it('should calculate 3% on $1000 rent', () => {
      expect(calculateServiceFee(1000, 1)).toBe(30);
    });

    it('should calculate 3% on $1500 rent', () => {
      expect(calculateServiceFee(1500, 3)).toBe(45);
    });

    it('should calculate 3% on prorated $548.39', () => {
      expect(calculateServiceFee(548.39, 1)).toBeCloseTo(16.45, 2);
    });
  });

  describe('Long-term stays (>= 6 months)', () => {
    it('should calculate 1.5% on $1000 rent', () => {
      expect(calculateServiceFee(1000, 6)).toBe(15);
    });

    it('should calculate 1.5% on $2000 rent', () => {
      expect(calculateServiceFee(2000, 12)).toBe(30);
    });
  });
});

describe('getTransferFee', () => {
  it('should return $7', () => {
    expect(getTransferFee()).toBe(7);
  });
});

describe('calculateCreditCardFee', () => {
  it('should calculate self-inclusive 3% fee on $100', () => {
    // $100 / 0.97 = $103.09
    // Fee = $103.09 - $100 = $3.09
    const fee = calculateCreditCardFee(100);
    expect(fee).toBeCloseTo(3.09, 2);
  });

  it('should calculate self-inclusive 3% fee on $1000', () => {
    // $1000 / 0.97 = $1030.93
    // Fee = $1030.93 - $1000 = $30.93
    const fee = calculateCreditCardFee(1000);
    expect(fee).toBeCloseTo(30.93, 2);
  });

  it('should calculate self-inclusive 3% fee on $1007 (deposit + transfer)', () => {
    // $1007 / 0.97 = $1038.14
    // Fee = $1038.14 - $1007 = $31.14
    const fee = calculateCreditCardFee(1007);
    expect(fee).toBeCloseTo(31.14, 2);
  });
});

describe('calculateTotalWithStripeCardFee', () => {
  it('should add card fee to base amount', () => {
    // $100 + $3.09 = $103.09
    const total = calculateTotalWithStripeCardFee(100);
    expect(total).toBeCloseTo(103.09, 2);
  });

  it('should calculate correctly for $1007 (deposit scenario)', () => {
    // $1007 + $31.14 = $1038.14
    const total = calculateTotalWithStripeCardFee(1007);
    expect(total).toBeCloseTo(1038.14, 2);
  });
});

describe('reverseCalculateBaseAmount', () => {
  it('should extract base from total with card fee', () => {
    // Uses formula: totalWithFee / 1.03
    // $103.09 / 1.03 = $100.09
    const base = reverseCalculateBaseAmount(103.09);
    expect(base).toBeCloseTo(100.09, 2);
  });

  it('should extract base from $1038.14 total', () => {
    // $1038.14 / 1.03 = $1007.90
    const base = reverseCalculateBaseAmount(1038.14);
    expect(base).toBeCloseTo(1007.90, 2);
  });
});

describe('calculateTotalWithCardFee', () => {
  it('should add card fee when isUsingCard is true', () => {
    const total = calculateTotalWithCardFee(1000, true);
    expect(total).toBeCloseTo(1030.93, 2);
  });

  it('should return same amount when isUsingCard is false', () => {
    const total = calculateTotalWithCardFee(1000, false);
    expect(total).toBe(1000);
  });
});

describe('Complete Fee Scenarios', () => {
  describe('Deposit payment (ACH)', () => {
    it('should calculate $1000 deposit + $7 transfer = $1007', () => {
      const deposit = 1000;
      const transferFee = getTransferFee();
      const total = deposit + transferFee;

      expect(total).toBe(1007);
    });
  });

  describe('Deposit payment (Card)', () => {
    it('should calculate $1000 deposit + $7 transfer + card fee', () => {
      const deposit = 1000;
      const transferFee = getTransferFee();
      const subtotal = deposit + transferFee;
      const total = calculateTotalWithStripeCardFee(subtotal);

      // $1007 + $31.14 = $1038.14
      expect(total).toBeCloseTo(1038.14, 2);
    });
  });

  describe('Monthly rent payment (short-term)', () => {
    it('should calculate $1000 rent + 3% service fee = $1030', () => {
      const rent = 1000;
      const serviceFee = calculateServiceFee(rent, 3);

      expect(serviceFee).toBe(30);
      expect(rent + serviceFee).toBe(1030);
    });
  });

  describe('Monthly rent payment (long-term)', () => {
    it('should calculate $1000 rent + 1.5% service fee = $1015', () => {
      const rent = 1000;
      const serviceFee = calculateServiceFee(rent, 6);

      expect(serviceFee).toBe(15);
      expect(rent + serviceFee).toBe(1015);
    });
  });

  describe('Prorated first month (Jan 15, $1000/month)', () => {
    it('should calculate prorated rent + service fee', () => {
      // 17 days of 31 = $548.39
      const proratedRent = 1000 * 17 / 31;
      const serviceFee = calculateServiceFee(proratedRent, 1);

      expect(proratedRent).toBeCloseTo(548.39, 2);
      expect(serviceFee).toBeCloseTo(16.45, 2);
      expect(proratedRent + serviceFee).toBeCloseTo(564.84, 2);
    });
  });
});
