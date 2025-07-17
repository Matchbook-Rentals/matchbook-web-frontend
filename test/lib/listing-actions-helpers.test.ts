import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { 
  createListing, 
  createListingFromDraft, 
  saveDraft,
  handleSaveDraft,
  handleSubmitListing,
  loadDraftData,
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
  createMinimalListingData,
  createAllAmenitiesListingData,
  createWasherNotAvailableListingData,
  createFakeAddPropertyClientData
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

  describe('Comprehensive Amenity Testing', () => {
    describe('All Amenities Selected', () => {
      it('should create listing with all amenities through direct creation', async () => {
        const listingData = createAllAmenitiesListingData();
        
        const result = await createListing(listingData, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(listingData.title);
        expect(result.category).toBe('Penthouse');
        expect(result.roomCount).toBe(4);
        expect(result.bathroomCount).toBe(3);
        expect(result.guestCount).toBe(8);
        expect(result.squareFootage).toBe(3000);
        
        // Verify ALL amenities are set to true (except washerNotAvailable and dryerNotAvailable)
        expect(result.kitchen).toBe(true);
        expect(result.oven).toBe(true);
        expect(result.stove).toBe(true);
        expect(result.fridge).toBe(true);
        expect(result.microwave).toBe(true);
        expect(result.dishwasher).toBe(true);
        expect(result.garbageDisposal).toBe(true);
        expect(result.kitchenEssentials).toBe(true);
        
        // Laundry (in-unit selected)
        expect(result.washerInUnit).toBe(true);
        expect(result.dryerInUnit).toBe(true);
        expect(result.washerHookup).toBe(true);
        expect(result.washerNotAvailable).toBe(false); // Only false one
        expect(result.washerInComplex).toBe(true);
        expect(result.dryerHookup).toBe(true);
        expect(result.dryerNotAvailable).toBe(false); // Only false one
        expect(result.dryerInComplex).toBe(true);
        expect(result.laundryFacilities).toBe(true);
        
        // Parking
        expect(result.parking).toBe(true);
        expect(result.offStreetParking).toBe(true);
        expect(result.streetParking).toBe(true);
        expect(result.streetParkingFree).toBe(true);
        expect(result.coveredParking).toBe(true);
        expect(result.coveredParkingFree).toBe(true);
        expect(result.uncoveredParking).toBe(true);
        expect(result.uncoveredParkingFree).toBe(true);
        expect(result.garageParking).toBe(true);
        expect(result.garageParkingFree).toBe(true);
        expect(result.evCharging).toBe(true);
        
        // Technology
        expect(result.wifi).toBe(true);
        expect(result.tv).toBe(true);
        
        // Comfort & Views
        expect(result.airConditioner).toBe(true);
        expect(result.heater).toBe(true);
        expect(result.balcony).toBe(true);
        expect(result.patio).toBe(true);
        expect(result.sunroom).toBe(true);
        expect(result.fireplace).toBe(true);
        expect(result.firepit).toBe(true);
        expect(result.cityView).toBe(true);
        expect(result.waterView).toBe(true);
        expect(result.mountainView).toBe(true);
        expect(result.waterfront).toBe(true);
        expect(result.beachfront).toBe(true);
        
        // Safety & Security
        expect(result.smokeDetector).toBe(true);
        expect(result.carbonMonoxide).toBe(true);
        expect(result.keylessEntry).toBe(true);
        expect(result.secureLobby).toBe(true);
        expect(result.security).toBe(true);
        expect(result.wheelchairAccess).toBe(true);
        expect(result.wheelAccessible).toBe(true);
        expect(result.alarmSystem).toBe(true);
        expect(result.gatedEntry).toBe(true);
        
        // Building Amenities
        expect(result.elevator).toBe(true);
        expect(result.fitnessCenter).toBe(true);
        expect(result.doorman).toBe(true);
        expect(result.gym).toBe(true);
        expect(result.pool).toBe(true);
        expect(result.sauna).toBe(true);
        expect(result.jacuzzi).toBe(true);
        expect(result.hotTub).toBe(true);
        
        // Workspace
        expect(result.dedicatedWorkspace).toBe(true);
        expect(result.workstation).toBe(true);
        
        // Personal Care
        expect(result.hairDryer).toBe(true);
        expect(result.iron).toBe(true);
        expect(result.linens).toBe(true);
        expect(result.privateBathroom).toBe(true);
        
        // Lifestyle
        expect(result.smokingAllowed).toBe(true);
        expect(result.eventsAllowed).toBe(true);
        expect(result.privateEntrance).toBe(true);
        expect(result.fencedInYard).toBe(true);
        expect(result.storageShed).toBe(true);
        expect(result.grill).toBe(true);
        
        // Pets
        expect(result.allowDogs).toBe(true);
        expect(result.allowCats).toBe(true);
        
        // Verify images were created
        const images = await prisma.listingImage.findMany({
          where: { listingId: result.id },
          orderBy: { rank: 'asc' }
        });
        expect(images).toHaveLength(listingData.listingImages!.length);
        
        // Verify monthly pricing was created
        const pricing = await prisma.listingMonthlyPricing.findMany({
          where: { listingId: result.id },
          orderBy: { months: 'asc' }
        });
        expect(pricing).toHaveLength(listingData.monthlyPricing!.length);
      });
      
      it('should create listing with all amenities through save/reload/create process', async () => {
        const listingData = createAllAmenitiesListingData();
        
        // Convert to draft data format
        const draftData = {
          ...listingData,
          status: 'draft'
        };
        
        // Save as draft
        const draft = await saveDraft(draftData, testUserId);
        expect(draft).toBeDefined();
        expect(draft.id).toBeDefined();
        
        // Create listing from draft
        const result = await createListingFromDraft(draft.id, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(listingData.title);
        expect(result.category).toBe('Penthouse');
        expect(result.status).toBe('available');
        expect(result.approvalStatus).toBe('pendingReview');
        
        // Verify key amenities are preserved
        expect(result.washerInUnit).toBe(true);
        expect(result.dryerInUnit).toBe(true);
        expect(result.washerNotAvailable).toBe(false);
        expect(result.kitchen).toBe(true);
        expect(result.pool).toBe(true);
        expect(result.gym).toBe(true);
        expect(result.smokingAllowed).toBe(true);
        expect(result.eventsAllowed).toBe(true);
        expect(result.allowDogs).toBe(true);
        expect(result.allowCats).toBe(true);
        
        // Verify draft was deleted
        const deletedDraft = await prisma.listingInCreation.findUnique({
          where: { id: draft.id }
        });
        expect(deletedDraft).toBeNull();
      });
    });
    
    describe('Washer Not Available Only', () => {
      it('should create listing with only washer not available through direct creation', async () => {
        const listingData = createWasherNotAvailableListingData();
        
        const result = await createListing(listingData, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(listingData.title);
        expect(result.category).toBe('Apartment');
        expect(result.roomCount).toBe(1);
        expect(result.bathroomCount).toBe(1);
        expect(result.guestCount).toBe(2);
        expect(result.squareFootage).toBe(600);
        
        // Verify ONLY washerNotAvailable is true, all others false
        expect(result.washerNotAvailable).toBe(true); // ONLY TRUE AMENITY
        
        // Verify all other laundry options are false
        expect(result.washerInUnit).toBe(false);
        expect(result.dryerInUnit).toBe(false);
        expect(result.washerHookup).toBe(false);
        expect(result.washerInComplex).toBe(false);
        expect(result.dryerHookup).toBe(false);
        expect(result.dryerNotAvailable).toBe(false);
        expect(result.dryerInComplex).toBe(false);
        expect(result.laundryFacilities).toBe(false);
        
        // Verify all other amenities are false
        expect(result.kitchen).toBe(false);
        expect(result.oven).toBe(false);
        expect(result.stove).toBe(false);
        expect(result.fridge).toBe(false);
        expect(result.microwave).toBe(false);
        expect(result.dishwasher).toBe(false);
        expect(result.garbageDisposal).toBe(false);
        expect(result.kitchenEssentials).toBe(false);
        
        expect(result.parking).toBe(false);
        expect(result.offStreetParking).toBe(false);
        expect(result.streetParking).toBe(false);
        expect(result.wifi).toBe(false);
        expect(result.tv).toBe(false);
        expect(result.airConditioner).toBe(false);
        expect(result.heater).toBe(false);
        expect(result.balcony).toBe(false);
        expect(result.pool).toBe(false);
        expect(result.gym).toBe(false);
        expect(result.elevator).toBe(false);
        expect(result.fitnessCenter).toBe(false);
        expect(result.allowDogs).toBe(false);
        expect(result.allowCats).toBe(false);
        
        // Verify images were created
        const images = await prisma.listingImage.findMany({
          where: { listingId: result.id }
        });
        expect(images).toHaveLength(listingData.listingImages!.length);
        
        // Verify monthly pricing was created
        const pricing = await prisma.listingMonthlyPricing.findMany({
          where: { listingId: result.id }
        });
        expect(pricing).toHaveLength(listingData.monthlyPricing!.length);
      });
      
      it('should create listing with only washer not available through save/reload/create process', async () => {
        const listingData = createWasherNotAvailableListingData();
        
        // Convert to draft data format
        const draftData = {
          ...listingData,
          status: 'draft'
        };
        
        // Save as draft
        const draft = await saveDraft(draftData, testUserId);
        expect(draft).toBeDefined();
        expect(draft.id).toBeDefined();
        
        // Create listing from draft
        const result = await createListingFromDraft(draft.id, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(listingData.title);
        expect(result.category).toBe('Apartment');
        expect(result.status).toBe('available');
        expect(result.approvalStatus).toBe('pendingReview');
        
        // Verify ONLY washerNotAvailable is true
        expect(result.washerNotAvailable).toBe(true);
        
        // Verify key amenities are false
        expect(result.washerInUnit).toBe(false);
        expect(result.dryerInUnit).toBe(false);
        expect(result.kitchen).toBe(false);
        expect(result.pool).toBe(false);
        expect(result.gym).toBe(false);
        expect(result.wifi).toBe(false);
        expect(result.parking).toBe(false);
        expect(result.allowDogs).toBe(false);
        expect(result.allowCats).toBe(false);
        
        // Verify draft was deleted
        const deletedDraft = await prisma.listingInCreation.findUnique({
          where: { id: draft.id }
        });
        expect(deletedDraft).toBeNull();
      });
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

  describe('Add Property Client Helpers', () => {
    describe('handleSaveDraft', () => {
      it('should handle saving draft with add-property-client format', async () => {
        const clientData = createFakeAddPropertyClientData();
        
        const result = await handleSaveDraft(clientData, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(clientData.title);
        expect(result.description).toBe(clientData.description);
        expect(result.category).toBe(clientData.category);
        expect(result.petsAllowed).toBe(clientData.petsAllowed);
        expect(result.furnished).toBe(clientData.furnished);
        expect(result.locationString).toBe(clientData.locationString);
        expect(result.city).toBe(clientData.city);
        expect(result.state).toBe(clientData.state);
        expect(result.roomCount).toBe(clientData.roomCount);
        expect(result.bathroomCount).toBe(clientData.bathroomCount);
        expect(result.squareFootage).toBe(clientData.squareFootage);
        expect(result.depositSize).toBe(clientData.depositSize);
        expect(result.status).toBe('draft');
        
        // Check that amenities were set
        expect(result.kitchen).toBe(true);
        expect(result.wifi).toBe(true);
        expect(result.airConditioner).toBe(true);
        expect(result.washerInUnit).toBe(true);
        
        // Check that photos were saved with correct ranks
        const savedImages = await prisma.listingImage.findMany({
          where: { listingId: result.id },
          orderBy: { rank: 'asc' }
        });
        
        expect(savedImages).toHaveLength(clientData.listingPhotos.length);
        // First 4 photos should be ranked (selected photos)
        expect(savedImages[0].rank).toBe(1);
        expect(savedImages[1].rank).toBe(2);
        expect(savedImages[2].rank).toBe(3);
        expect(savedImages[3].rank).toBe(4);
        expect(savedImages[4].rank).toBe(5); // Remaining photo gets next rank
      });
      
      it('should handle updating existing draft with add-property-client format', async () => {
        const clientData = createFakeAddPropertyClientData();
        
        // First save
        const originalDraft = await handleSaveDraft(clientData, testUserId);
        
        // Update the data
        const updatedData = {
          ...clientData,
          title: 'Updated Title',
          description: 'Updated description',
          roomCount: 3,
          amenities: ['kitchen', 'pool', 'gym'] // Different amenities
        };
        
        // Save again with draft ID
        const updatedDraft = await handleSaveDraft(updatedData, testUserId, originalDraft.id);
        
        expect(updatedDraft.id).toBe(originalDraft.id);
        expect(updatedDraft.title).toBe(updatedData.title);
        expect(updatedDraft.description).toBe(updatedData.description);
        expect(updatedDraft.roomCount).toBe(updatedData.roomCount);
        
        // Check that amenities were updated
        expect(updatedDraft.kitchen).toBe(true);
        expect(updatedDraft.pool).toBe(true);
        expect(updatedDraft.gym).toBe(true);
        // Old amenities should be false or null
        expect(updatedDraft.wifi).toBe(null);
        expect(updatedDraft.airConditioner).toBe(null);
        expect(updatedDraft.washerInUnit).toBe(null);
      });
    });
    
    describe('handleSubmitListing', () => {
      it('should handle submitting listing with add-property-client format (direct creation)', async () => {
        const clientData = createFakeAddPropertyClientData();
        
        const result = await handleSubmitListing(clientData, testUserId);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(clientData.title);
        expect(result.description).toBe(clientData.description);
        expect(result.category).toBe(clientData.category);
        expect(result.petsAllowed).toBe(clientData.petsAllowed);
        expect(result.furnished).toBe(clientData.furnished);
        expect(result.locationString).toBe(clientData.locationString);
        expect(result.city).toBe(clientData.city);
        expect(result.state).toBe(clientData.state);
        expect(result.roomCount).toBe(clientData.roomCount);
        expect(result.bathroomCount).toBe(clientData.bathroomCount);
        expect(result.squareFootage).toBe(clientData.squareFootage);
        expect(result.depositSize).toBe(clientData.depositSize);
        expect(result.status).toBe('available');
        expect(result.approvalStatus).toBe('pendingReview');
        
        // Check that amenities were set
        expect(result.kitchen).toBe(true);
        expect(result.wifi).toBe(true);
        expect(result.airConditioner).toBe(true);
        expect(result.washerInUnit).toBe(true);
        
        // Check that photos were saved with correct ranks (selected photos first)
        const savedImages = await prisma.listingImage.findMany({
          where: { listingId: result.id },
          orderBy: { rank: 'asc' }
        });
        
        expect(savedImages).toHaveLength(clientData.listingPhotos.length);
        // First 4 photos should be ranked (selected photos)
        expect(savedImages[0].rank).toBe(1);
        expect(savedImages[1].rank).toBe(2);
        expect(savedImages[2].rank).toBe(3);
        expect(savedImages[3].rank).toBe(4);
        expect(savedImages[4].rank).toBe(5); // Remaining photo gets next rank
        
        // Check that monthly pricing was saved
        const savedPricing = await prisma.listingMonthlyPricing.findMany({
          where: { listingId: result.id },
          orderBy: { months: 'asc' }
        });
        
        expect(savedPricing).toHaveLength(clientData.monthlyPricing.length);
        expect(savedPricing[0].months).toBe(1);
        expect(savedPricing[0].price).toBe(1500);
        expect(savedPricing[0].utilitiesIncluded).toBe(false);
      });
      
      it('should handle submitting listing from draft with add-property-client format', async () => {
        const clientData = createFakeAddPropertyClientData();
        
        // First save as draft
        const draft = await handleSaveDraft(clientData, testUserId);
        
        // Then submit the draft
        const result = await handleSubmitListing(clientData, testUserId, draft.id);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(clientData.title);
        expect(result.description).toBe(clientData.description);
        expect(result.status).toBe('available');
        expect(result.approvalStatus).toBe('pendingReview');
        
        // Check that amenities were preserved
        expect(result.kitchen).toBe(true);
        expect(result.wifi).toBe(true);
        expect(result.airConditioner).toBe(true);
        expect(result.washerInUnit).toBe(true);
        
        // Check that draft was deleted
        const deletedDraft = await prisma.listingInCreation.findUnique({
          where: { id: draft.id }
        });
        expect(deletedDraft).toBeNull();
        
        // Check that photos were transferred correctly
        const savedImages = await prisma.listingImage.findMany({
          where: { listingId: result.id },
          orderBy: { rank: 'asc' }
        });
        
        expect(savedImages).toHaveLength(clientData.listingPhotos.length);
        expect(savedImages[0].rank).toBe(1);
        expect(savedImages[1].rank).toBe(2);
        expect(savedImages[2].rank).toBe(3);
        expect(savedImages[3].rank).toBe(4);
        expect(savedImages[4].rank).toBe(5);
      });
      
      it('should handle photo ranking correctly with selected photos', async () => {
        const clientData = createFakeAddPropertyClientData();
        
        // Modify selected photos to be in different order
        clientData.selectedPhotos = [
          { url: 'https://example.com/photo3.jpg', rank: null },
          { url: 'https://example.com/photo1.jpg', rank: null },
          { url: 'https://example.com/photo5.jpg', rank: null },
          { url: 'https://example.com/photo2.jpg', rank: null }
        ];
        
        const result = await handleSubmitListing(clientData, testUserId);
        
        const savedImages = await prisma.listingImage.findMany({
          where: { listingId: result.id },
          orderBy: { rank: 'asc' }
        });
        
        expect(savedImages).toHaveLength(5);
        
        // Check that selected photos got ranks 1-4 in the right order
        expect(savedImages[0].url).toBe('https://example.com/photo3.jpg');
        expect(savedImages[0].rank).toBe(1);
        expect(savedImages[1].url).toBe('https://example.com/photo1.jpg');
        expect(savedImages[1].rank).toBe(2);
        expect(savedImages[2].url).toBe('https://example.com/photo5.jpg');
        expect(savedImages[2].rank).toBe(3);
        expect(savedImages[3].url).toBe('https://example.com/photo2.jpg');
        expect(savedImages[3].rank).toBe(4);
        
        // The unselected photo should get rank 5
        expect(savedImages[4].url).toBe('https://example.com/photo4.jpg');
        expect(savedImages[4].rank).toBe(5);
      });
    });
    
    describe('loadDraftData', () => {
      it('should load and transform draft data to add-property-client format', async () => {
        // First create a draft with all the data
        const originalData = createFakeAddPropertyClientData();
        const draft = await handleSaveDraft(originalData, testUserId);
        
        // Monthly pricing is now automatically handled by handleSaveDraft
        
        // Load the draft data
        const loadedData = await loadDraftData(draft.id);
        
        // Verify basic info
        expect(loadedData.title).toBe(originalData.title);
        expect(loadedData.description).toBe(originalData.description);
        
        // Verify highlights
        expect(loadedData.category).toBe(originalData.category);
        expect(loadedData.petsAllowed).toBe(originalData.petsAllowed);
        expect(loadedData.furnished).toBe(originalData.furnished);
        
        // Verify location
        expect(loadedData.locationString).toBe(originalData.locationString);
        expect(loadedData.latitude).toBe(originalData.latitude);
        expect(loadedData.longitude).toBe(originalData.longitude);
        expect(loadedData.city).toBe(originalData.city);
        expect(loadedData.state).toBe(originalData.state);
        expect(loadedData.streetAddress1).toBe(originalData.streetAddress1);
        expect(loadedData.streetAddress2).toBe(originalData.streetAddress2);
        expect(loadedData.postalCode).toBe(originalData.postalCode);
        expect(loadedData.country).toBe("United States");
        
        // Verify rooms
        expect(loadedData.roomCount).toBe(originalData.roomCount);
        expect(loadedData.bathroomCount).toBe(originalData.bathroomCount);
        expect(loadedData.guestCount).toBe(originalData.guestCount);
        expect(loadedData.squareFootage).toBe(originalData.squareFootage);
        
        // Verify pricing
        expect(loadedData.depositSize).toBe(originalData.depositSize);
        expect(loadedData.petDeposit).toBe(originalData.petDeposit);
        expect(loadedData.petRent).toBe(originalData.petRent);
        expect(loadedData.rentDueAtBooking).toBe(originalData.rentDueAtBooking);
        expect(loadedData.shortestLeaseLength).toBe(originalData.shortestLeaseLength);
        expect(loadedData.longestLeaseLength).toBe(originalData.longestLeaseLength);
        
        // Verify photos
        expect(loadedData.listingPhotos).toHaveLength(originalData.listingPhotos.length);
        expect(loadedData.selectedPhotos).toHaveLength(originalData.selectedPhotos.length);
        
        // Verify photo ranks and ordering
        expect(loadedData.selectedPhotos[0].rank).toBe(1);
        expect(loadedData.selectedPhotos[1].rank).toBe(2);
        expect(loadedData.selectedPhotos[2].rank).toBe(3);
        expect(loadedData.selectedPhotos[3].rank).toBe(4);
        
        // Verify amenities (should be converted back to array format, sorted)
        expect(loadedData.amenities).toEqual(originalData.amenities.sort());
        expect(loadedData.amenities).toContain('kitchen');
        expect(loadedData.amenities).toContain('wifi');
        expect(loadedData.amenities).toContain('airConditioner');
        expect(loadedData.amenities).toContain('washerInUnit');
        
        // Verify monthly pricing
        expect(loadedData.monthlyPricing).toHaveLength(originalData.monthlyPricing.length);
        expect(loadedData.monthlyPricing[0].months).toBe(1);
        expect(loadedData.monthlyPricing[0].price).toBe(1500);
        expect(loadedData.monthlyPricing[0].utilitiesIncluded).toBe(false);
        expect(loadedData.monthlyPricing[1].months).toBe(6);
        expect(loadedData.monthlyPricing[1].price).toBe(1400);
        expect(loadedData.monthlyPricing[1].utilitiesIncluded).toBe(true);
      });
      
      it('should handle draft with no photos', async () => {
        const draftData = {
          title: 'Draft without photos',
          description: 'Test draft with no photos',
          category: 'Apartment',
          petsAllowed: false,
          furnished: false,
          locationString: '123 Test St',
          city: 'Test City',
          state: 'TX',
          streetAddress1: '123 Test St',
          postalCode: '12345',
          roomCount: 1,
          bathroomCount: 1,
          guestCount: 1,
          squareFootage: 500,
          depositSize: 1000,
          shortestLeaseLength: 1,
          longestLeaseLength: 12,
          amenities: ['kitchen'],
          listingPhotos: [], // No photos
          selectedPhotos: [], // No selected photos
          monthlyPricing: []
        };
        
        const draft = await handleSaveDraft(draftData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        expect(loadedData.title).toBe(draftData.title);
        expect(loadedData.listingPhotos).toHaveLength(0);
        expect(loadedData.selectedPhotos).toHaveLength(0);
        expect(loadedData.amenities).toEqual(['kitchen']);
      });
      
      it('should handle draft with no monthly pricing', async () => {
        const draftData = {
          title: 'Draft without pricing',
          description: 'Test draft with no pricing',
          category: 'Apartment',
          petsAllowed: false,
          furnished: false,
          locationString: '123 Test St',
          city: 'Test City',
          state: 'TX',
          streetAddress1: '123 Test St',
          postalCode: '12345',
          roomCount: 1,
          bathroomCount: 1,
          guestCount: 1,
          squareFootage: 500,
          depositSize: 1000,
          shortestLeaseLength: 3,
          longestLeaseLength: 6,
          amenities: ['kitchen'],
          listingPhotos: [],
          selectedPhotos: [],
          monthlyPricing: []
        };
        
        const draft = await handleSaveDraft(draftData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        // Should initialize empty pricing for months 3-6
        expect(loadedData.monthlyPricing).toHaveLength(4); // months 3, 4, 5, 6
        expect(loadedData.monthlyPricing[0].months).toBe(3);
        expect(loadedData.monthlyPricing[0].price).toBe(0);
        expect(loadedData.monthlyPricing[0].utilitiesIncluded).toBe(false);
        expect(loadedData.monthlyPricing[3].months).toBe(6);
        expect(loadedData.monthlyPricing[3].price).toBe(0);
        expect(loadedData.monthlyPricing[3].utilitiesIncluded).toBe(false);
      });
      
      it('should handle draft with complex amenities', async () => {
        const draftData = createFakeAddPropertyClientData();
        // Use all amenities data
        draftData.amenities = ['kitchen', 'wifi', 'airConditioner', 'washerInUnit', 'pool', 'gym', 'elevator', 'parking', 'balcony', 'cityView'];
        
        const draft = await handleSaveDraft(draftData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        // Should convert boolean fields back to array
        expect(loadedData.amenities).toHaveLength(10);
        expect(loadedData.amenities).toContain('kitchen');
        expect(loadedData.amenities).toContain('wifi');
        expect(loadedData.amenities).toContain('airConditioner');
        expect(loadedData.amenities).toContain('washerInUnit');
        expect(loadedData.amenities).toContain('pool');
        expect(loadedData.amenities).toContain('gym');
        expect(loadedData.amenities).toContain('elevator');
        expect(loadedData.amenities).toContain('parking');
        expect(loadedData.amenities).toContain('balcony');
        expect(loadedData.amenities).toContain('cityView');
        
        // Should not contain non-amenity boolean fields
        expect(loadedData.amenities).not.toContain('furnished');
        expect(loadedData.amenities).not.toContain('petsAllowed');
        expect(loadedData.amenities).not.toContain('requireBackgroundCheck');
      });
      
      it('should throw error if draft not found', async () => {
        const nonExistentDraftId = 'non-existent-draft-id';
        
        await expect(loadDraftData(nonExistentDraftId)).rejects.toThrow('Draft not found');
      });
    });

    describe('Integration Tests for Component Loading', () => {
      it('should load draft data exactly as add-property-client expects (non-default values)', async () => {
        // Create a draft with specific non-default values that differ from component defaults
        const draftData = {
          category: 'Apartment',     // Component default is 'Single Family'
          petsAllowed: false,        // Component default is true
          furnished: false,          // Component default is true
          title: 'Test Integration Draft',
          description: 'This should not be default',
          locationString: '456 Non-Default St',
          city: 'Non-Default City',
          state: 'CA',               // Different from TX default
          streetAddress1: '456 Non-Default St',
          postalCode: '90210',       // Different from default
          roomCount: 3,              // Different from default 1
          bathroomCount: 2,          // Different from default 1
          guestCount: 5,             // Different from default 1
          squareFootage: 1800,
          depositSize: 2500,
          petDeposit: 0,             // No pet deposit since pets not allowed
          petRent: 0,                // No pet rent since pets not allowed
          rentDueAtBooking: 2000,
          shortestLeaseLength: 6,    // Different from default 1
          longestLeaseLength: 18,    // Different from default 12
          amenities: ['kitchen'],    // Single amenity, not default empty
          listingPhotos: [
            { url: 'https://example.com/non-default1.jpg', rank: null },
            { url: 'https://example.com/non-default2.jpg', rank: null }
          ],
          selectedPhotos: [
            { url: 'https://example.com/non-default1.jpg', rank: null }
          ],
          monthlyPricing: [
            { months: 6, price: 2800, utilitiesIncluded: true },
            { months: 12, price: 2600, utilitiesIncluded: true }
          ]
        };
        
        const draft = await handleSaveDraft(draftData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        // Verify it preserves NON-DEFAULT values (this is where the bug likely is)
        expect(loadedData.category).toBe('Apartment');                    // Should NOT be 'Single Family'
        expect(loadedData.petsAllowed).toBe(false);                      // Should NOT be true
        expect(loadedData.furnished).toBe(false);                       // Should NOT be true
        expect(loadedData.title).toBe('Test Integration Draft');
        expect(loadedData.roomCount).toBe(3);                           // Should NOT be 1
        expect(loadedData.bathroomCount).toBe(2);                       // Should NOT be 1
        expect(loadedData.guestCount).toBe(5);                          // Should NOT be 1
        expect(loadedData.shortestLeaseLength).toBe(6);                 // Should NOT be 1
        expect(loadedData.longestLeaseLength).toBe(18);                 // Should NOT be 12
        expect(loadedData.state).toBe('CA');                            // Should NOT be TX
        expect(loadedData.postalCode).toBe('90210');
        expect(loadedData.petDeposit).toBe(0);
        expect(loadedData.petRent).toBe(0);
        expect(loadedData.amenities).toEqual(['kitchen']);
      });

      it('should preserve exact values through save->load->transform cycle', async () => {
        const originalValues = {
          category: 'Condo',
          petsAllowed: false,
          furnished: false,
          title: 'Pipeline Test Property',
          roomCount: 3,
          bathroomCount: 2,
          guestCount: 4,
          squareFootage: 1500,
          depositSize: 3000,
          amenities: ['wifi', 'pool'],
          listingPhotos: [],
          selectedPhotos: [],
          monthlyPricing: []
        };
        
        // Step 1: Save using our helper
        const draft = await handleSaveDraft(originalValues, testUserId);
        console.log('Draft created with ID:', draft.id);
        
        // Step 2: Load directly from database to see what's actually stored
        const dbDraft = await prisma.listingInCreation.findUnique({
          where: { id: draft.id }
        });
        
        console.log('Database values:', {
          category: dbDraft?.category,
          petsAllowed: dbDraft?.petsAllowed,
          furnished: dbDraft?.furnished,
          title: dbDraft?.title,
          roomCount: dbDraft?.roomCount,
          bathroomCount: dbDraft?.bathroomCount
        });
        
        // Step 3: Verify database has correct values
        expect(dbDraft?.category).toBe('Condo');
        expect(dbDraft?.petsAllowed).toBe(false);
        expect(dbDraft?.furnished).toBe(false);
        expect(dbDraft?.title).toBe('Pipeline Test Property');
        expect(dbDraft?.roomCount).toBe(3);
        expect(dbDraft?.bathroomCount).toBe(2);
        
        // Step 4: Load using our helper
        const loadedData = await loadDraftData(draft.id);
        
        console.log('Loaded data values:', {
          category: loadedData.category,
          petsAllowed: loadedData.petsAllowed,
          furnished: loadedData.furnished,
          title: loadedData.title,
          roomCount: loadedData.roomCount,
          bathroomCount: loadedData.bathroomCount
        });
        
        // Step 5: Verify transformation preserves values
        expect(loadedData.category).toBe('Condo');
        expect(loadedData.petsAllowed).toBe(false);
        expect(loadedData.furnished).toBe(false);
        expect(loadedData.title).toBe('Pipeline Test Property');
        expect(loadedData.roomCount).toBe(3);
        expect(loadedData.bathroomCount).toBe(2);
        expect(loadedData.guestCount).toBe(4);
      });

      it('should handle edge case values correctly', async () => {
        const edgeCaseData = {
          category: 'Studio',           // Different from Single Family
          petsAllowed: null,           // Null value
          furnished: null,             // Null value  
          title: '',                   // Empty string
          description: '',             // Empty string
          roomCount: 0,               // Zero value
          bathroomCount: 0,           // Zero value
          guestCount: 0,              // Zero value
          squareFootage: null,        // Null value
          depositSize: null,          // Null value
          amenities: [],              // Empty array
          listingPhotos: [],          // Empty array
          selectedPhotos: [],         // Empty array
          monthlyPricing: []          // Empty array
        };
        
        const draft = await handleSaveDraft(edgeCaseData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        // Verify edge cases are handled properly
        expect(loadedData.category).toBe('Studio');
        expect(loadedData.petsAllowed).toBe(false);  // null should become false
        expect(loadedData.furnished).toBe(false);    // null should become false
        expect(loadedData.title).toBe('');
        expect(loadedData.description).toBe('');
        expect(loadedData.amenities).toEqual([]);
      });

      it('should map all field types correctly from database to component format', async () => {
        const testData = createFakeAddPropertyClientData();
        
        // Override with specific test values to ensure no defaults
        testData.category = 'Townhouse';
        testData.petsAllowed = false;
        testData.furnished = false;
        testData.roomCount = 4;
        testData.bathroomCount = 3;
        testData.guestCount = 6;
        
        const draft = await handleSaveDraft(testData, testUserId);
        const loadedData = await loadDraftData(draft.id);
        
        // Test critical fields that could have defaults
        const criticalFields = [
          'category', 'petsAllowed', 'furnished', 'title', 'description',
          'locationString', 'city', 'state', 'streetAddress1', 'postalCode',
          'roomCount', 'bathroomCount', 'guestCount', 'squareFootage',
          'depositSize', 'petDeposit', 'petRent', 'rentDueAtBooking',
          'shortestLeaseLength', 'longestLeaseLength'
        ];
        
        criticalFields.forEach(field => {
          expect(loadedData[field]).toBe(testData[field], `Field ${field} should match original value`);
        });
        
        // Test arrays
        expect(loadedData.amenities.sort()).toEqual(testData.amenities.sort());
        expect(loadedData.listingPhotos).toHaveLength(testData.listingPhotos.length);
        expect(loadedData.selectedPhotos).toHaveLength(testData.selectedPhotos.length);
        expect(loadedData.monthlyPricing).toHaveLength(testData.monthlyPricing.length);
      });
    });
  });
});