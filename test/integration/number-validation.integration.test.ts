import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { updateListing, updateListingMonthlyPricing } from '@/app/actions/listings';
import { saveDraftTransaction } from '@/app/actions/listings-in-creation';
import { MAX_ALLOWED_NUMBER } from '@/lib/number-validation';

// This test file requires a test database to be set up
// It tests the actual integration with Prisma and the database

describe('Number Validation Integration Tests', () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testListingId: string;

  beforeAll(async () => {
    // Initialize test database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'mysql://test_user:test_password@localhost:3306/test_db'
        }
      }
    });

    // Ensure database connection
    await prisma.$connect();
    
    testUserId = 'test-user-integration-123';
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    try {
      await prisma.listingMonthlyPricing.deleteMany({
        where: { listing: { userId: testUserId } }
      });
      await prisma.listing.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.listingInCreation.deleteMany({
        where: { userId: testUserId }
      });
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
    
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a test listing for each test
    const listing = await prisma.listing.create({
      data: {
        userId: testUserId,
        title: 'Test Integration Listing',
        description: 'Test description',
        status: 'available',
        approvalStatus: 'approved',
        roomCount: 2,
        bathroomCount: 1,
        guestCount: 2,
        latitude: 40.7128,
        longitude: -74.0060,
        squareFootage: 1000,
        depositSize: 2000,
      }
    });
    testListingId = listing.id;
  });

  describe('Database Integration - Listing Updates', () => {
    it('should successfully cap and save extremely large numbers', async () => {
      // Mock auth to return our test user
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      const updateData = {
        squareFootage: 5e45, // The problematic value that caused the original error
        depositSize: MAX_ALLOWED_NUMBER + 50000,
        petDeposit: -1000,
        petRent: 99999999999,
      };

      // This should not throw a database error
      const result = await updateListing(testListingId, updateData);

      // Verify the values were capped correctly in the database
      const updatedListing = await prisma.listing.findUnique({
        where: { id: testListingId }
      });

      expect(updatedListing).toBeDefined();
      expect(updatedListing!.squareFootage).toBe(MAX_ALLOWED_NUMBER);
      expect(updatedListing!.depositSize).toBe(MAX_ALLOWED_NUMBER);
      expect(updatedListing!.petDeposit).toBe(0);
      expect(updatedListing!.petRent).toBe(MAX_ALLOWED_NUMBER);
    });

    it('should handle monthly pricing with validation', async () => {
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      const pricingData = [
        { months: 1, price: 2500, utilitiesIncluded: true },
        { months: 6, price: MAX_ALLOWED_NUMBER + 10000, utilitiesIncluded: false },
        { months: 12, price: -500, utilitiesIncluded: true },
      ];

      await updateListingMonthlyPricing(testListingId, pricingData);

      // Verify the pricing was saved with validation applied
      const savedPricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: testListingId },
        orderBy: { months: 'asc' }
      });

      expect(savedPricing).toHaveLength(3);
      expect(savedPricing[0].price).toBe(2500); // Unchanged
      expect(savedPricing[1].price).toBe(MAX_ALLOWED_NUMBER); // Capped
      expect(savedPricing[2].price).toBe(0); // Negative converted to 0
    });
  });

  describe('Database Integration - Draft Creation', () => {
    it('should save draft with validated numeric values', async () => {
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      const draftData = {
        title: 'Integration Test Draft',
        squareFootage: Number.MAX_SAFE_INTEGER,
        depositSize: 5e45, // Problematic scientific notation
        petDeposit: -2000,
        monthlyPricing: [
          { months: 3, price: MAX_ALLOWED_NUMBER + 5000, utilitiesIncluded: true },
          { months: 12, price: -800, utilitiesIncluded: false },
        ],
      };

      const result = await saveDraftTransaction(draftData, testUserId);

      // Verify the draft was saved
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Check the actual values in the database
      const savedDraft = await prisma.listingInCreation.findUnique({
        where: { id: result.id },
        include: { monthlyPricing: true }
      });

      expect(savedDraft).toBeDefined();
      expect(savedDraft!.squareFootage).toBe(MAX_ALLOWED_NUMBER);
      expect(savedDraft!.depositSize).toBe(MAX_ALLOWED_NUMBER);
      expect(savedDraft!.petDeposit).toBe(0);

      // Check monthly pricing
      expect(savedDraft!.monthlyPricing).toHaveLength(2);
      expect(savedDraft!.monthlyPricing[0].price).toBe(MAX_ALLOWED_NUMBER);
      expect(savedDraft!.monthlyPricing[1].price).toBe(0);
    });
  });

  describe('Error Prevention', () => {
    it('should prevent the original 5e+45 database error', async () => {
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      // This exact scenario caused the original error:
      // 'Unable to fit value 5e+45 into a 64-bit signed integer for field `squareFootage`'
      const problematicData = {
        squareFootage: 5e+45,
      };

      // This should NOT throw a database error anymore
      await expect(updateListing(testListingId, problematicData)).resolves.toBeDefined();

      // Verify the value was capped safely
      const listing = await prisma.listing.findUnique({
        where: { id: testListingId }
      });

      expect(listing!.squareFootage).toBe(MAX_ALLOWED_NUMBER);
      expect(listing!.squareFootage).toBeLessThanOrEqual(2147483647); // Max 32-bit signed int
    });

    it('should handle concurrent updates without data corruption', async () => {
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      // Simulate concurrent updates with large numbers
      const updates = [
        updateListing(testListingId, { squareFootage: MAX_ALLOWED_NUMBER + 1000 }),
        updateListing(testListingId, { depositSize: MAX_ALLOWED_NUMBER + 2000 }),
        updateListing(testListingId, { petDeposit: -500 }),
      ];

      // All should complete successfully
      await Promise.all(updates);

      const finalListing = await prisma.listing.findUnique({
        where: { id: testListingId }
      });

      // All values should be within safe ranges
      expect(finalListing!.squareFootage).toBeLessThanOrEqual(MAX_ALLOWED_NUMBER);
      expect(finalListing!.depositSize).toBeLessThanOrEqual(MAX_ALLOWED_NUMBER);
      expect(finalListing!.petDeposit).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk pricing updates efficiently', async () => {
      const mockAuth = vi.fn().mockReturnValue({ userId: testUserId });
      vi.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

      // Create pricing for all 12 months with some extreme values
      const bulkPricing = Array.from({ length: 12 }, (_, i) => ({
        months: i + 1,
        price: i % 2 === 0 ? MAX_ALLOWED_NUMBER + (i * 1000) : 2000 + i * 100,
        utilitiesIncluded: i % 3 === 0,
      }));

      const startTime = performance.now();
      await updateListingMonthlyPricing(testListingId, bulkPricing);
      const endTime = performance.now();

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify all pricing was saved correctly
      const savedPricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: testListingId },
        orderBy: { months: 'asc' }
      });

      expect(savedPricing).toHaveLength(12);
      
      // Check that even months were capped, odd months were normal
      savedPricing.forEach((pricing, index) => {
        if (index % 2 === 0) {
          expect(pricing.price).toBe(MAX_ALLOWED_NUMBER);
        } else {
          expect(pricing.price).toBe(2000 + (index + 1) * 100);
        }
      });
    });
  });
});