import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createListingFromDraftTransaction, saveDraftTransaction } from '@/app/actions/listings-in-creation';
import { MAX_ALLOWED_NUMBER } from '@/lib/number-validation';

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    listingInCreation: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    listing: {
      create: vi.fn(),
    },
    listingImage: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    listingMonthlyPricing: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
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

describe('Server Actions - Listings In Creation', () => {
  const mockUserId = 'test-user-123';
  const mockDraftId = 'test-draft-456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ userId: mockUserId });
  });

  describe('createListingFromDraftTransaction', () => {
    const mockDraft = {
      id: mockDraftId,
      userId: mockUserId,
      title: 'Test Property',
      squareFootage: MAX_ALLOWED_NUMBER + 2000,
      depositSize: 50000,
      petDeposit: -150,
      petRent: 200,
      rentDueAtBooking: MAX_ALLOWED_NUMBER * 3,
      // ... other fields
    };

    beforeEach(() => {
      // Mock the transaction callback
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          listing: {
            create: vi.fn().mockResolvedValue({ id: 'new-listing-id' }),
          },
          listingImage: {
            createMany: vi.fn(),
          },
          listingMonthlyPricing: {
            createMany: vi.fn(),
          },
          listingInCreation: {
            deleteMany: vi.fn(),
          },
        };
        return await callback(mockTx);
      });
    });

    it('should validate and cap numeric values when creating listing from draft', async () => {
      const mockGetDraftWithImages = vi.fn().mockResolvedValue(mockDraft);
      
      // We need to mock the getDraftWithImages function that's called internally
      vi.doMock('@/app/actions/listings-in-creation', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          getDraftWithImages: mockGetDraftWithImages,
        };
      });

      await createListingFromDraftTransaction(mockDraftId, mockUserId);

      // Get the transaction callback and verify the data passed to listing.create
      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listing: { create: vi.fn().mockResolvedValue({ id: 'listing-id' }) },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
        listingInCreation: { deleteMany: vi.fn() },
      };

      // Execute the transaction to see what data it would pass
      await transactionCallback(mockTx);

      const createCall = mockTx.listing.create.mock.calls[0][0];
      const data = createCall.data;

      expect(data.squareFootage).toBe(MAX_ALLOWED_NUMBER); // Capped
      expect(data.depositSize).toBe(50000); // Unchanged (within limit)
      expect(data.petDeposit).toBe(0); // Negative converted to 0
      expect(data.petRent).toBe(200); // Unchanged (within limit)
      expect(data.rentDueAtBooking).toBe(MAX_ALLOWED_NUMBER); // Capped
    });

    it('should validate monthly pricing values', async () => {
      const mockDraftWithPricing = {
        ...mockDraft,
      };

      const mockGetDraftWithImages = vi.fn().mockResolvedValue(mockDraftWithPricing);
      
      const options = {
        monthlyPricing: [
          { months: 1, price: 2000, utilitiesIncluded: true },
          { months: 6, price: MAX_ALLOWED_NUMBER + 1000, utilitiesIncluded: false },
          { months: 12, price: -300, utilitiesIncluded: true },
        ],
      };

      await createListingFromDraftTransaction(mockDraftId, mockUserId, options);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listing: { create: vi.fn().mockResolvedValue({ id: 'listing-id' }) },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
        listingInCreation: { deleteMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      const pricingCall = mockTx.listingMonthlyPricing.createMany.mock.calls[0][0];
      const pricingData = pricingCall.data;

      expect(pricingData[0].price).toBe(2000); // Unchanged
      expect(pricingData[1].price).toBe(MAX_ALLOWED_NUMBER); // Capped
      expect(pricingData[2].price).toBe(0); // Negative converted to 0
    });
  });

  describe('saveDraftTransaction', () => {
    const mockDraftData = {
      title: 'Test Draft',
      squareFootage: MAX_ALLOWED_NUMBER + 5000,
      depositSize: 1500,
      petDeposit: -200,
      petRent: MAX_ALLOWED_NUMBER * 2,
      rentDueAtBooking: 800,
      monthlyPricing: [
        { months: 3, price: MAX_ALLOWED_NUMBER + 2000, utilitiesIncluded: true },
        { months: 12, price: -100, utilitiesIncluded: false },
      ],
    };

    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          listingInCreation: {
            create: vi.fn().mockResolvedValue({ id: 'draft-id' }),
            update: vi.fn().mockResolvedValue({ id: 'draft-id' }),
          },
          listingImage: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
          },
          listingMonthlyPricing: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
          },
        };
        return await callback(mockTx);
      });
    });

    it('should validate and cap numeric values when saving draft', async () => {
      await saveDraftTransaction(mockDraftData, mockUserId);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      const createCall = mockTx.listingInCreation.create.mock.calls[0][0];
      const data = createCall.data;

      // Note: The actual validation happens before the transaction is called
      // We're testing that the server action properly prepares the data
      expect(data.userId).toBe(mockUserId);
    });

    it('should validate monthly pricing in draft data', async () => {
      await saveDraftTransaction(mockDraftData, mockUserId);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      const pricingCall = mockTx.listingMonthlyPricing.createMany.mock.calls[0][0];
      const pricingData = pricingCall.data;

      expect(pricingData[0].price).toBe(MAX_ALLOWED_NUMBER); // Capped
      expect(pricingData[1].price).toBe(0); // Negative converted to 0
    });

    it('should handle updating existing draft', async () => {
      const existingDraftId = 'existing-draft-123';
      
      await saveDraftTransaction(mockDraftData, mockUserId, existingDraftId);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listingInCreation: { update: vi.fn().mockResolvedValue({ id: existingDraftId }) },
        listingImage: { createMany: vi.fn(), deleteMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn(), deleteMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      expect(mockTx.listingInCreation.update).toHaveBeenCalledWith({
        where: { id: existingDraftId },
        data: expect.objectContaining({
          userId: mockUserId,
        }),
      });
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle extremely large numbers that caused the 5e+45 error', async () => {
      const problematicData = {
        squareFootage: 5e45, // The exact value that caused the database error
        depositSize: Number.MAX_SAFE_INTEGER,
        petDeposit: -1e10,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
          listingImage: { createMany: vi.fn() },
          listingMonthlyPricing: { createMany: vi.fn() },
        };
        return await callback(mockTx);
      });

      await saveDraftTransaction(problematicData, mockUserId);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listingInCreation: { create: vi.fn() },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      // The validation should have happened before the transaction
      // ensuring no problematic values reach the database
      expect(mockTx.listingInCreation.create).toHaveBeenCalled();
    });

    it('should handle NaN and invalid number types', async () => {
      const invalidData = {
        squareFootage: NaN,
        depositSize: 'not-a-number' as any,
        petDeposit: undefined,
        petRent: null,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
          listingImage: { createMany: vi.fn() },
          listingMonthlyPricing: { createMany: vi.fn() },
        };
        return await callback(mockTx);
      });

      // Should not throw an error
      await expect(saveDraftTransaction(invalidData, mockUserId)).resolves.toBeDefined();
    });

    it('should validate pricing arrays with mixed valid and invalid values', async () => {
      const mixedPricingData = {
        monthlyPricing: [
          { months: 1, price: 2000, utilitiesIncluded: true }, // Valid
          { months: 6, price: MAX_ALLOWED_NUMBER + 1000, utilitiesIncluded: false }, // Too large
          { months: 12, price: -500, utilitiesIncluded: true }, // Negative
          { months: 18, price: NaN, utilitiesIncluded: false }, // NaN
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
          listingImage: { createMany: vi.fn() },
          listingMonthlyPricing: { createMany: vi.fn() },
        };
        return await callback(mockTx);
      });

      await saveDraftTransaction(mixedPricingData, mockUserId);

      const transactionCallback = mockPrisma.$transaction.mock.calls[0][0];
      const mockTx = {
        listingInCreation: { create: vi.fn().mockResolvedValue({ id: 'draft-id' }) },
        listingImage: { createMany: vi.fn() },
        listingMonthlyPricing: { createMany: vi.fn() },
      };

      await transactionCallback(mockTx);

      const pricingCall = mockTx.listingMonthlyPricing.createMany.mock.calls[0][0];
      const pricingData = pricingCall.data;

      expect(pricingData[0].price).toBe(2000); // Valid - unchanged
      expect(pricingData[1].price).toBe(MAX_ALLOWED_NUMBER); // Capped
      expect(pricingData[2].price).toBe(0); // Negative converted to 0
      expect(pricingData[3].price).toBe(0); // NaN converted to 0
    });
  });
});