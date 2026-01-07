import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReferralCode, isValidReferralCode, getOrCreateReferralCode } from '@/lib/referral';
import prisma from '@/lib/prismadb';

// Mock prisma for database-dependent functions
vi.mock('@/lib/prismadb', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    referral: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('referral utilities', () => {
  describe('generateReferralCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateReferralCode();
      expect(code.length).toBe(6);
    });

    it('should only contain valid characters (A-Z, 2-9, excluding I, O, 0, 1)', () => {
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

      // Generate multiple codes to test randomness
      for (let i = 0; i < 100; i++) {
        const code = generateReferralCode();
        for (const char of code) {
          expect(validChars).toContain(char);
        }
      }
    });

    it('should generate different codes on subsequent calls', () => {
      const codes = new Set<string>();

      // Generate 100 codes
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }

      // Most codes should be unique (allowing for rare collisions)
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should not contain confusing characters (I, O, 0, 1)', () => {
      const confusingChars = ['I', 'O', '0', '1'];

      for (let i = 0; i < 100; i++) {
        const code = generateReferralCode();
        for (const char of confusingChars) {
          expect(code).not.toContain(char);
        }
      }
    });
  });

  describe('isValidReferralCode', () => {
    it('should return true for valid 6-character codes', () => {
      expect(isValidReferralCode('ABC234')).toBe(true);
      expect(isValidReferralCode('X7K9M2')).toBe(true);
      expect(isValidReferralCode('ZZZZZZ')).toBe(true);
      expect(isValidReferralCode('234567')).toBe(true);
    });

    it('should return true for lowercase valid codes (case insensitive)', () => {
      expect(isValidReferralCode('abc234')).toBe(true);
      expect(isValidReferralCode('x7k9m2')).toBe(true);
    });

    it('should return false for codes with invalid length', () => {
      expect(isValidReferralCode('ABC12')).toBe(false);  // 5 chars
      expect(isValidReferralCode('ABC1234')).toBe(false); // 7 chars
      expect(isValidReferralCode('')).toBe(false);
      expect(isValidReferralCode('A')).toBe(false);
    });

    it('should return false for codes with invalid characters', () => {
      expect(isValidReferralCode('ABC12!')).toBe(false);  // Special char
      expect(isValidReferralCode('ABC12 ')).toBe(false);  // Space
      expect(isValidReferralCode('ABCIO0')).toBe(false);  // Contains I and O and 0
      expect(isValidReferralCode('ABC101')).toBe(false);  // Contains 1 and 0
    });

    it('should return false for null or undefined', () => {
      expect(isValidReferralCode(null as any)).toBe(false);
      expect(isValidReferralCode(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidReferralCode(123456 as any)).toBe(false);
      expect(isValidReferralCode({} as any)).toBe(false);
      expect(isValidReferralCode([] as any)).toBe(false);
    });
  });

  describe('getOrCreateReferralCode', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return existing code if user already has one', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ referralCode: 'ABC234' });

      const code = await getOrCreateReferralCode('user-123');

      expect(code).toBe('ABC234');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { referralCode: true },
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should generate and save a new code if user has none', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ referralCode: null });
      mockPrisma.user.update.mockResolvedValue({ referralCode: 'XYZ789' });

      const code = await getOrCreateReferralCode('user-123');

      expect(code).toBe('XYZ789');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-123',
          referralCode: null,
        },
        data: { referralCode: expect.any(String) },
        select: { referralCode: true },
      });
    });

    it('should retry on unique constraint violation (code collision)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ referralCode: null });

      // First attempt fails with P2002 (unique constraint), second succeeds
      const uniqueError = new Error('Unique constraint violation');
      (uniqueError as any).code = 'P2002';

      mockPrisma.user.update
        .mockRejectedValueOnce(uniqueError)
        .mockRejectedValueOnce(uniqueError)
        .mockResolvedValueOnce({ referralCode: 'NEW123' });

      const code = await getOrCreateReferralCode('user-123');

      expect(code).toBe('NEW123');
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3);
    });

    it('should return existing code if another request set it (race condition)', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ referralCode: null }) // Initial check
        .mockResolvedValueOnce({ referralCode: 'RACE99' }); // Re-fetch after P2025

      // P2025 = Record not found (WHERE condition failed because code is no longer null)
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';

      mockPrisma.user.update.mockRejectedValueOnce(notFoundError);

      const code = await getOrCreateReferralCode('user-123');

      expect(code).toBe('RACE99');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts if collisions keep happening', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ referralCode: null });

      // All attempts fail with P2002
      const uniqueError = new Error('Unique constraint violation');
      (uniqueError as any).code = 'P2002';
      mockPrisma.user.update.mockRejectedValue(uniqueError);

      await expect(getOrCreateReferralCode('user-123')).rejects.toThrow(
        'Failed to generate unique referral code after 10 attempts'
      );

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(10);
    });

    it('should rethrow unknown errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ referralCode: null });

      const unknownError = new Error('Database connection failed');
      mockPrisma.user.update.mockRejectedValue(unknownError);

      await expect(getOrCreateReferralCode('user-123')).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    });
  });
});
