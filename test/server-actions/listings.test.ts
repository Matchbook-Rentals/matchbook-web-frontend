import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateListing, updateListingMonthlyPricing } from '@/app/actions/listings';
import { MAX_ALLOWED_NUMBER } from '@/lib/number-validation';

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listingMonthlyPricing: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Get the mocked Prisma instance
const { default: prisma } = await import('@/lib/prismadb');
const mockPrisma = vi.mocked(prisma);

describe('Server Actions - Listings', () => {
  const mockUserId = 'test-user-123';
  const mockListingId = 'test-listing-456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ userId: mockUserId });
  });

  describe('updateListing', () => {
    beforeEach(() => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        userId: mockUserId,
      });
      mockPrisma.listing.update.mockResolvedValue({
        id: mockListingId,
        userId: mockUserId,
      });
    });

    it('should validate and cap numeric values before updating', async () => {
      const updateData = {
        squareFootage: MAX_ALLOWED_NUMBER + 1000,
        depositSize: 50000,
        petDeposit: -100,
        petRent: MAX_ALLOWED_NUMBER * 2,
        rentDueAtBooking: 1500,
      };

      await updateListing(mockListingId, updateData);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: mockListingId },
        data: {
          squareFootage: MAX_ALLOWED_NUMBER, // Capped
          depositSize: 50000, // Unchanged (within limit)
          petDeposit: 0, // Negative converted to 0
          petRent: MAX_ALLOWED_NUMBER, // Capped
          rentDueAtBooking: 1500, // Unchanged (within limit)
        },
      });
    });

    it('should handle null and undefined values correctly', async () => {
      const updateData = {
        squareFootage: null,
        depositSize: undefined,
        petDeposit: 0,
      };

      await updateListing(mockListingId, updateData);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: mockListingId },
        data: {
          squareFootage: null,
          depositSize: undefined,
          petDeposit: 0,
        },
      });
    });

    it('should not modify non-numeric fields', async () => {
      const updateData = {
        title: 'Test Listing',
        description: 'A great place',
        squareFootage: MAX_ALLOWED_NUMBER + 1000,
      };

      await updateListing(mockListingId, updateData);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: mockListingId },
        data: {
          title: 'Test Listing',
          description: 'A great place',
          squareFootage: MAX_ALLOWED_NUMBER,
        },
      });
    });

    it('should throw error if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(updateListing(mockListingId, {})).rejects.toThrow('Listing not found');
    });

    it('should throw error if user unauthorized', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        userId: 'different-user-id',
      });

      await expect(updateListing(mockListingId, {})).rejects.toThrow('Unauthorized to update this listing');
    });

    it('should throw error if user not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      await expect(updateListing(mockListingId, {})).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateListingMonthlyPricing', () => {
    const mockPricingData = [
      { months: 1, price: 2000, utilitiesIncluded: true },
      { months: 6, price: MAX_ALLOWED_NUMBER + 1000, utilitiesIncluded: false },
      { months: 12, price: -500, utilitiesIncluded: true },
    ];

    beforeEach(() => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        userId: mockUserId,
      });
      mockPrisma.listingMonthlyPricing.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.listingMonthlyPricing.create.mockResolvedValue({});
      mockPrisma.listing.findUnique.mockResolvedValueOnce({
        id: mockListingId,
        monthlyPricing: [],
      });
    });

    it('should validate and cap pricing values', async () => {
      await updateListingMonthlyPricing(mockListingId, mockPricingData);

      // Verify that create was called with validated values
      expect(mockPrisma.listingMonthlyPricing.create).toHaveBeenCalledTimes(3);
      
      // Check the calls to see if prices were capped correctly
      const createCalls = mockPrisma.listingMonthlyPricing.create.mock.calls;
      
      // First call: price should be unchanged (within limit)
      expect(createCalls[0][0].data.price).toBe(2000);
      
      // Second call: price should be capped at MAX_ALLOWED_NUMBER
      expect(createCalls[1][0].data.price).toBe(MAX_ALLOWED_NUMBER);
      
      // Third call: negative price should be converted to 0
      expect(createCalls[2][0].data.price).toBe(0);
    });

    it('should preserve other pricing data fields', async () => {
      await updateListingMonthlyPricing(mockListingId, mockPricingData);

      const createCalls = mockPrisma.listingMonthlyPricing.create.mock.calls;
      
      expect(createCalls[0][0].data).toEqual({
        listingId: mockListingId,
        months: 1,
        price: 2000,
        utilitiesIncluded: true,
      });
      
      expect(createCalls[1][0].data).toEqual({
        listingId: mockListingId,
        months: 6,
        price: MAX_ALLOWED_NUMBER,
        utilitiesIncluded: false,
      });
    });

    it('should delete existing pricing before creating new ones', async () => {
      await updateListingMonthlyPricing(mockListingId, mockPricingData);

      expect(mockPrisma.listingMonthlyPricing.deleteMany).toHaveBeenCalledWith({
        where: { listingId: mockListingId },
      });
    });

    it('should throw error if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        updateListingMonthlyPricing(mockListingId, mockPricingData)
      ).rejects.toThrow('Listing not found');
    });

    it('should throw error if user unauthorized', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        userId: 'different-user-id',
      });

      await expect(
        updateListingMonthlyPricing(mockListingId, mockPricingData)
      ).rejects.toThrow('Unauthorized to update this listing');
    });
  });

  describe('Security and Edge Cases', () => {
    beforeEach(() => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        userId: mockUserId,
      });
      mockPrisma.listing.update.mockResolvedValue({
        id: mockListingId,
      });
    });

    it('should prevent database overflow with extremely large numbers', async () => {
      const updateData = {
        squareFootage: Number.MAX_SAFE_INTEGER,
        depositSize: 5e45, // The exact problematic value from your error
      };

      await updateListing(mockListingId, updateData);

      const updateCall = mockPrisma.listing.update.mock.calls[0][0];
      expect(updateCall.data.squareFootage).toBe(MAX_ALLOWED_NUMBER);
      expect(updateCall.data.depositSize).toBe(MAX_ALLOWED_NUMBER);
    });

    it('should handle NaN values gracefully', async () => {
      const updateData = {
        squareFootage: NaN,
        depositSize: 'not-a-number' as any,
      };

      await updateListing(mockListingId, updateData);

      const updateCall = mockPrisma.listing.update.mock.calls[0][0];
      expect(updateCall.data.squareFootage).toBe(null);
      expect(updateCall.data.depositSize).toBe(null);
    });

    it('should maintain data integrity with mixed valid and invalid values', async () => {
      const updateData = {
        title: 'Valid Title',
        squareFootage: MAX_ALLOWED_NUMBER + 5000, // Invalid - too large
        depositSize: 1500, // Valid
        petDeposit: -200, // Invalid - negative
        description: 'Valid description',
      };

      await updateListing(mockListingId, updateData);

      const updateCall = mockPrisma.listing.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({
        title: 'Valid Title',
        squareFootage: MAX_ALLOWED_NUMBER,
        depositSize: 1500,
        petDeposit: 0,
        description: 'Valid description',
      });
    });
  });
});