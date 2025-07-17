import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { 
  createListing, 
  createListingFromDraft, 
  saveDraft,
  type ListingData,
  type DraftData
} from '../../src/lib/listing-actions-helpers';
import { 
  cleanupTestData, 
  createTestUserId
} from '../test-db-setup';
import { 
  createFakeListingData, 
  createFakeDraftData, 
  createMinimalListingData 
} from '../fixtures/fake-listing-data';
import prisma from '@/lib/prismadb';

describe('Listing Actions Helpers', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Test the database connection
    await prisma.$connect();
    console.log('✅ Test database connected successfully');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log('✅ Test database disconnected');
  });

  beforeEach(() => {
    testUserId = createTestUserId();
  });

  afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  describe('createListing', () => {
    it('should create a complete listing with all data', async () => {
      const listingData = createFakeListingData();
      
      const result = await createListing(listingData, testUserId);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(listingData.title);
      expect(result.description).toBe(listingData.description);
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe('available');
      expect(result.approvalStatus).toBe('pendingReview');
      expect(result.category).toBe(listingData.category);
      expect(result.roomCount).toBe(listingData.roomCount);
      expect(result.bathroomCount).toBe(listingData.bathroomCount);
      expect(result.guestCount).toBe(listingData.guestCount);
      expect(result.squareFootage).toBe(listingData.squareFootage);
      expect(result.latitude).toBe(listingData.latitude);
      expect(result.longitude).toBe(listingData.longitude);
      expect(result.locationString).toBe(listingData.locationString);
      expect(result.city).toBe(listingData.city);
      expect(result.state).toBe(listingData.state);
      expect(result.postalCode).toBe(listingData.postalCode);
      expect(result.streetAddress1).toBe(listingData.streetAddress1);
      expect(result.streetAddress2).toBe(listingData.streetAddress2);
      expect(result.depositSize).toBe(listingData.depositSize);
      expect(result.petDeposit).toBe(listingData.petDeposit);
      expect(result.petRent).toBe(listingData.petRent);
      expect(result.rentDueAtBooking).toBe(listingData.rentDueAtBooking);
      expect(result.shortestLeaseLength).toBe(listingData.shortestLeaseLength);
      expect(result.longestLeaseLength).toBe(listingData.longestLeaseLength);
      expect(result.furnished).toBe(listingData.furnished);
      expect(result.petsAllowed).toBe(listingData.petsAllowed);
      expect(result.requireBackgroundCheck).toBe(listingData.requireBackgroundCheck);
      
      // Check amenities
      expect(result.kitchen).toBe(listingData.kitchen);
      expect(result.wifi).toBe(listingData.wifi);
      expect(result.airConditioner).toBe(listingData.airConditioner);
      expect(result.washerInUnit).toBe(listingData.washerInUnit);
      expect(result.parking).toBe(listingData.parking);
      expect(result.balcony).toBe(listingData.balcony);
      expect(result.cityView).toBe(listingData.cityView);
      expect(result.elevator).toBe(listingData.elevator);
      expect(result.fitnessCenter).toBe(listingData.fitnessCenter);
      expect(result.dedicatedWorkspace).toBe(listingData.dedicatedWorkspace);
      expect(result.smokeDetector).toBe(listingData.smokeDetector);
      expect(result.secureLobby).toBe(listingData.secureLobby);
      expect(result.allowDogs).toBe(listingData.allowDogs);
      expect(result.allowCats).toBe(listingData.allowCats);
    });

    it('should create listing images when provided', async () => {
      const listingData = createFakeListingData();
      
      const result = await createListing(listingData, testUserId);
      
      // Check that images were created
      const images = await prisma.listingImage.findMany({
        where: { listingId: result.id },
        orderBy: { rank: 'asc' }
      });
      
      expect(images).toHaveLength(listingData.listingImages!.length);
      expect(images[0].url).toBe(listingData.listingImages![0].url);
      expect(images[0].category).toBe(listingData.listingImages![0].category);
      expect(images[0].rank).toBe(listingData.listingImages![0].rank);
      expect(images[1].url).toBe(listingData.listingImages![1].url);
      expect(images[1].category).toBe(listingData.listingImages![1].category);
      expect(images[1].rank).toBe(listingData.listingImages![1].rank);
    });

    it('should create monthly pricing when provided', async () => {
      const listingData = createFakeListingData();
      
      const result = await createListing(listingData, testUserId);
      
      // Check that monthly pricing was created
      const pricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: result.id },
        orderBy: { months: 'asc' }
      });
      
      expect(pricing).toHaveLength(listingData.monthlyPricing!.length);
      expect(pricing[0].months).toBe(listingData.monthlyPricing![0].months);
      expect(pricing[0].price).toBe(listingData.monthlyPricing![0].price);
      expect(pricing[0].utilitiesIncluded).toBe(listingData.monthlyPricing![0].utilitiesIncluded);
      expect(pricing[11].months).toBe(listingData.monthlyPricing![11].months);
      expect(pricing[11].price).toBe(listingData.monthlyPricing![11].price);
      expect(pricing[11].utilitiesIncluded).toBe(listingData.monthlyPricing![11].utilitiesIncluded);
    });

    it('should create a minimal listing with default values', async () => {
      const listingData = createMinimalListingData();
      
      const result = await createListing(listingData, testUserId);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(listingData.title);
      expect(result.description).toBe(listingData.description);
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe('available');
      expect(result.approvalStatus).toBe('pendingReview');
      expect(result.roomCount).toBe(listingData.roomCount);
      expect(result.bathroomCount).toBe(listingData.bathroomCount);
      expect(result.guestCount).toBe(listingData.guestCount);
      expect(result.latitude).toBe(0); // Default value
      expect(result.longitude).toBe(0); // Default value
    });

    it('should create listing without images if none provided', async () => {
      const listingData = createMinimalListingData();
      
      const result = await createListing(listingData, testUserId);
      
      // Check that no images were created
      const images = await prisma.listingImage.findMany({
        where: { listingId: result.id }
      });
      
      expect(images).toHaveLength(0);
    });
  });

  describe('saveDraft', () => {
    it('should create a new draft when no draftId provided', async () => {
      const draftData = createFakeDraftData();
      
      const result = await saveDraft(draftData, testUserId);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(draftData.title);
      expect(result.description).toBe(draftData.description);
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe(draftData.status);
      expect(result.category).toBe(draftData.category);
      expect(result.roomCount).toBe(draftData.roomCount);
      expect(result.bathroomCount).toBe(draftData.bathroomCount);
      expect(result.guestCount).toBe(draftData.guestCount);
      expect(result.squareFootage).toBe(draftData.squareFootage);
      expect(result.locationString).toBe(draftData.locationString);
      expect(result.city).toBe(draftData.city);
      expect(result.state).toBe(draftData.state);
      expect(result.postalCode).toBe(draftData.postalCode);
      expect(result.depositSize).toBe(draftData.depositSize);
      expect(result.petDeposit).toBe(draftData.petDeposit);
      expect(result.petRent).toBe(draftData.petRent);
      expect(result.rentDueAtBooking).toBe(draftData.rentDueAtBooking);
      expect(result.shortestLeaseLength).toBe(draftData.shortestLeaseLength);
      expect(result.longestLeaseLength).toBe(draftData.longestLeaseLength);
      expect(result.furnished).toBe(draftData.furnished);
      expect(result.petsAllowed).toBe(draftData.petsAllowed);
      expect(result.requireBackgroundCheck).toBe(draftData.requireBackgroundCheck);
    });

    it('should create draft images when provided', async () => {
      const draftData = createFakeDraftData();
      
      const result = await saveDraft(draftData, testUserId);
      
      // Check that images were created
      const images = await prisma.listingImage.findMany({
        where: { listingId: result.id },
        orderBy: { rank: 'asc' }
      });
      
      expect(images).toHaveLength(draftData.listingImages!.length);
      expect(images[0].url).toBe(draftData.listingImages![0].url);
      expect(images[0].rank).toBe(draftData.listingImages![0].rank);
    });

    it('should update existing draft when draftId provided', async () => {
      const originalDraftData = createFakeDraftData();
      const originalDraft = await saveDraft(originalDraftData, testUserId);
      
      const updatedDraftData = {
        ...originalDraftData,
        title: 'Updated Draft Title',
        description: 'Updated description for the draft',
        roomCount: 2,
        depositSize: 1500,
      };
      
      const result = await saveDraft(updatedDraftData, testUserId, originalDraft.id);
      
      expect(result.id).toBe(originalDraft.id);
      expect(result.title).toBe(updatedDraftData.title);
      expect(result.description).toBe(updatedDraftData.description);
      expect(result.roomCount).toBe(updatedDraftData.roomCount);
      expect(result.depositSize).toBe(updatedDraftData.depositSize);
      expect(result.userId).toBe(testUserId);
    });
  });

  describe('createListingFromDraft', () => {
    it('should create a listing from a draft with all data', async () => {
      // First create a draft
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      const result = await createListingFromDraft(draft.id, testUserId);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(draftData.title);
      expect(result.description).toBe(draftData.description);
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe('available');
      expect(result.approvalStatus).toBe('pendingReview');
      expect(result.category).toBe(draftData.category);
      expect(result.roomCount).toBe(draftData.roomCount);
      expect(result.bathroomCount).toBe(draftData.bathroomCount);
      expect(result.guestCount).toBe(draftData.guestCount);
      expect(result.squareFootage).toBe(draftData.squareFootage);
      expect(result.locationString).toBe(draftData.locationString);
      expect(result.city).toBe(draftData.city);
      expect(result.state).toBe(draftData.state);
      expect(result.postalCode).toBe(draftData.postalCode);
      expect(result.depositSize).toBe(draftData.depositSize);
      expect(result.petDeposit).toBe(draftData.petDeposit);
      expect(result.petRent).toBe(draftData.petRent);
      expect(result.rentDueAtBooking).toBe(draftData.rentDueAtBooking);
      expect(result.shortestLeaseLength).toBe(draftData.shortestLeaseLength);
      expect(result.longestLeaseLength).toBe(draftData.longestLeaseLength);
      expect(result.furnished).toBe(draftData.furnished);
      expect(result.petsAllowed).toBe(draftData.petsAllowed);
      expect(result.requireBackgroundCheck).toBe(draftData.requireBackgroundCheck);
      
      // Check that amenities were copied
      expect(result.kitchen).toBe(draftData.kitchen);
      expect(result.wifi).toBe(draftData.wifi);
      expect(result.airConditioner).toBe(draftData.airConditioner);
      expect(result.washerInComplex).toBe(draftData.washerInComplex);
      expect(result.streetParking).toBe(draftData.streetParking);
      expect(result.streetParkingFree).toBe(draftData.streetParkingFree);
    });

    it('should create listing images from draft images', async () => {
      // First create a draft with images
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      const result = await createListingFromDraft(draft.id, testUserId);
      
      // Check that images were created
      const images = await prisma.listingImage.findMany({
        where: { listingId: result.id },
        orderBy: { rank: 'asc' }
      });
      
      expect(images).toHaveLength(draftData.listingImages!.length);
      expect(images[0].url).toBe(draftData.listingImages![0].url);
      expect(images[0].rank).toBe(draftData.listingImages![0].rank);
    });

    it('should override draft images with provided images', async () => {
      // First create a draft with images
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      const overrideImages = [
        { url: 'https://example.com/images/override1.jpg', category: 'living_room', rank: 1 },
        { url: 'https://example.com/images/override2.jpg', category: 'kitchen', rank: 2 },
      ];
      
      const result = await createListingFromDraft(draft.id, testUserId, {
        listingImages: overrideImages
      });
      
      // Check that override images were used instead of draft images
      const images = await prisma.listingImage.findMany({
        where: { listingId: result.id },
        orderBy: { rank: 'asc' }
      });
      
      expect(images).toHaveLength(overrideImages.length);
      expect(images[0].url).toBe(overrideImages[0].url);
      expect(images[0].category).toBe(overrideImages[0].category);
      expect(images[0].rank).toBe(overrideImages[0].rank);
      expect(images[1].url).toBe(overrideImages[1].url);
      expect(images[1].category).toBe(overrideImages[1].category);
      expect(images[1].rank).toBe(overrideImages[1].rank);
    });

    it('should create monthly pricing when provided', async () => {
      // First create a draft
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      const monthlyPricing = [
        { months: 1, price: 1500, utilitiesIncluded: false },
        { months: 6, price: 1400, utilitiesIncluded: true },
        { months: 12, price: 1300, utilitiesIncluded: true },
      ];
      
      const result = await createListingFromDraft(draft.id, testUserId, {
        monthlyPricing
      });
      
      // Check that monthly pricing was created
      const pricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: result.id },
        orderBy: { months: 'asc' }
      });
      
      expect(pricing).toHaveLength(monthlyPricing.length);
      expect(pricing[0].months).toBe(monthlyPricing[0].months);
      expect(pricing[0].price).toBe(monthlyPricing[0].price);
      expect(pricing[0].utilitiesIncluded).toBe(monthlyPricing[0].utilitiesIncluded);
      expect(pricing[2].months).toBe(monthlyPricing[2].months);
      expect(pricing[2].price).toBe(monthlyPricing[2].price);
      expect(pricing[2].utilitiesIncluded).toBe(monthlyPricing[2].utilitiesIncluded);
    });

    it('should delete draft after creating listing', async () => {
      // First create a draft
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      const result = await createListingFromDraft(draft.id, testUserId);
      
      // Check that the draft was deleted
      const deletedDraft = await prisma.listingInCreation.findUnique({
        where: { id: draft.id }
      });
      
      expect(deletedDraft).toBeNull();
      
      // Check that the listing was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should throw error if draft not found', async () => {
      const nonExistentDraftId = 'non-existent-draft-id';
      
      await expect(createListingFromDraft(nonExistentDraftId, testUserId)).rejects.toThrow('Draft not found');
    });

    it('should throw error if draft belongs to different user', async () => {
      // Create a draft with one user
      const draftData = createFakeDraftData();
      const draft = await saveDraft(draftData, testUserId);
      
      // Try to create listing with different user
      const differentUserId = createTestUserId();
      
      await expect(createListingFromDraft(draft.id, differentUserId)).rejects.toThrow('Draft not found');
    });
  });

  describe('Database Integration', () => {
    it('should handle database transactions correctly', async () => {
      const listingData = createFakeListingData();
      
      // Test that transaction works - all or nothing
      const result = await createListing(listingData, testUserId);
      
      // Verify all related data was created
      const listing = await prisma.listing.findUnique({
        where: { id: result.id }
      });
      
      const listingImages = await prisma.listingImage.findMany({
        where: { listingId: result.id }
      });
      
      const listingMonthlyPricing = await prisma.listingMonthlyPricing.findMany({
        where: { listingId: result.id }
      });
      
      expect(listing).toBeDefined();
      expect(listingImages).toHaveLength(listingData.listingImages!.length);
      expect(listingMonthlyPricing).toHaveLength(listingData.monthlyPricing!.length);
    });

    it('should roll back transaction on error', async () => {
      const listingData = createFakeListingData();
      
      // Create a listing with very long title to trigger database error
      const invalidListingData = {
        ...listingData,
        title: 'A'.repeat(1000) // Assuming title field has length limit
      };
      
      // This should fail and rollback
      await expect(createListing(invalidListingData, testUserId)).rejects.toThrow();
      
      // Verify no data was created
      const listings = await prisma.listing.findMany({
        where: { userId: testUserId }
      });
      
      expect(listings).toHaveLength(0);
    });
  });
});