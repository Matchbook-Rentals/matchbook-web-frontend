import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { 
  createListing, 
  createListingFromDraft, 
  saveDraft,
  handleSaveDraft,
  handleSubmitListing,
  loadDraftData,
  initializeFormDefaults,
  initializeHighlights,
  initializeLocation,
  initializeRooms,
  initializePricing,
  initializePhotos,
  initializeAmenities,
  initializeMonthlyPricing,
  initializeBasicInfo,
  transformComponentStateToDraftData,
  handleSaveAndExit,
  validateHighlights,
  validateLocation,
  validateRooms,
  validateBasics,
  validatePhotos,
  validateFeaturedPhotos,
  validateAmenities,
  validatePricing,
  validateVerifyPricing,
  validateDeposits,
  validateAllSteps,
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
  createFakeAddPropertyClientData,
  createValidHighlights,
  createInvalidHighlights,
  createValidLocation,
  createInvalidLocation,
  createValidRooms,
  createInvalidRooms,
  createValidBasics,
  createInvalidBasics,
  createValidPhotos,
  createInvalidPhotos,
  createValidSelectedPhotos,
  createInvalidSelectedPhotos,
  createValidAmenities,
  createInvalidAmenities,
  createValidPricing,
  createInvalidPricingSettings,
  createPricingWithMissingPrices,
  createPricingWithInvalidDeposits,
  createCompleteMonthlyPricing,
  createMissingPricesMonthlyPricing,
  createZeroPricesMonthlyPricing,
  createInvalidPricesMonthlyPricing,
  createValidFormData,
  createInvalidFormData
} from '../fixtures/fake-listing-data';
import prisma from '@/lib/prismadb';

describe('Listing Actions Helpers', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Log non-sensitive database config info
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 TEST_DATABASE_URL configured:', !!process.env.TEST_DATABASE_URL);
    console.log('🔍 DATABASE_URL configured:', !!process.env.DATABASE_URL);
    
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

  describe('Form Field Initialization Helpers', () => {
    describe('initializeFormDefaults', () => {
      it('should return default values for all form fields', () => {
        const defaults = initializeFormDefaults();
        
        expect(defaults.title).toBe("");
        expect(defaults.description).toBe("");
        expect(defaults.category).toBe("Single Family");
        expect(defaults.petsAllowed).toBe(true);
        expect(defaults.furnished).toBe(true);
        expect(defaults.locationString).toBe(null);
        expect(defaults.latitude).toBe(null);
        expect(defaults.longitude).toBe(null);
        expect(defaults.city).toBe(null);
        expect(defaults.state).toBe(null);
        expect(defaults.streetAddress1).toBe(null);
        expect(defaults.streetAddress2).toBe(null);
        expect(defaults.postalCode).toBe(null);
        expect(defaults.country).toBe("United States");
        expect(defaults.roomCount).toBe(1);
        expect(defaults.bathroomCount).toBe(1);
        expect(defaults.guestCount).toBe(1);
        expect(defaults.squareFootage).toBe(null);
        expect(defaults.depositSize).toBe(null);
        expect(defaults.petDeposit).toBe(null);
        expect(defaults.petRent).toBe(null);
        expect(defaults.rentDueAtBooking).toBe(null);
        expect(defaults.shortestLeaseLength).toBe(1);
        expect(defaults.longestLeaseLength).toBe(12);
        expect(defaults.listingPhotos).toEqual([]);
        expect(defaults.selectedPhotos).toEqual([]);
        expect(defaults.amenities).toEqual([]);
        expect(defaults.monthlyPricing).toEqual([]);
      });
    });

    describe('initializeHighlights', () => {
      it('should return defaults when no draft data provided', () => {
        const highlights = initializeHighlights();
        
        expect(highlights.category).toBe("Single Family");
        expect(highlights.petsAllowed).toBe(true);
        expect(highlights.furnished).toBe(true);
      });

      it('should return draft data when provided', () => {
        const draftData = {
          category: "Apartment",
          petsAllowed: false,
          furnished: false
        };
        
        const highlights = initializeHighlights(draftData);
        
        expect(highlights.category).toBe("Apartment");
        expect(highlights.petsAllowed).toBe(false);
        expect(highlights.furnished).toBe(false);
      });

      it('should handle null values in draft data', () => {
        const draftData = {
          category: null,
          petsAllowed: null,
          furnished: null
        };
        
        const highlights = initializeHighlights(draftData);
        
        expect(highlights.category).toBe("Single Family");
        expect(highlights.petsAllowed).toBe(true);
        expect(highlights.furnished).toBe(true);
      });

      it('should handle partial draft data', () => {
        const draftData = {
          category: "Condo",
          petsAllowed: false
          // furnished is missing
        };
        
        const highlights = initializeHighlights(draftData);
        
        expect(highlights.category).toBe("Condo");
        expect(highlights.petsAllowed).toBe(false);
        expect(highlights.furnished).toBe(true); // should use default
      });
    });

    describe('initializeLocation', () => {
      it('should return defaults when no draft data provided', () => {
        const location = initializeLocation();
        
        expect(location.locationString).toBe(null);
        expect(location.latitude).toBe(null);
        expect(location.longitude).toBe(null);
        expect(location.city).toBe(null);
        expect(location.state).toBe(null);
        expect(location.streetAddress1).toBe(null);
        expect(location.streetAddress2).toBe(null);
        expect(location.postalCode).toBe(null);
        expect(location.country).toBe("United States");
      });

      it('should return draft data when provided', () => {
        const draftData = {
          locationString: "123 Main St, Austin, TX 78701",
          latitude: 30.2672,
          longitude: -97.7431,
          city: "Austin",
          state: "TX",
          streetAddress1: "123 Main St",
          streetAddress2: "Apt 4B",
          postalCode: "78701"
        };
        
        const location = initializeLocation(draftData);
        
        expect(location.locationString).toBe("123 Main St, Austin, TX 78701");
        expect(location.latitude).toBe(30.2672);
        expect(location.longitude).toBe(-97.7431);
        expect(location.city).toBe("Austin");
        expect(location.state).toBe("TX");
        expect(location.streetAddress1).toBe("123 Main St");
        expect(location.streetAddress2).toBe("Apt 4B");
        expect(location.postalCode).toBe("78701");
        expect(location.country).toBe("United States");
      });

      it('should handle null values in draft data', () => {
        const draftData = {
          locationString: null,
          latitude: null,
          longitude: null,
          city: null,
          state: null,
          streetAddress1: null,
          streetAddress2: null,
          postalCode: null
        };
        
        const location = initializeLocation(draftData);
        
        expect(location.locationString).toBe(null);
        expect(location.latitude).toBe(null);
        expect(location.longitude).toBe(null);
        expect(location.city).toBe(null);
        expect(location.state).toBe(null);
        expect(location.streetAddress1).toBe(null);
        expect(location.streetAddress2).toBe(null);
        expect(location.postalCode).toBe(null);
        expect(location.country).toBe("United States");
      });
    });

    describe('initializeRooms', () => {
      it('should return defaults when no draft data provided', () => {
        const rooms = initializeRooms();
        
        expect(rooms.roomCount).toBe(1);
        expect(rooms.bathroomCount).toBe(1);
        expect(rooms.guestCount).toBe(1);
        expect(rooms.squareFootage).toBe(null);
      });

      it('should return draft data when provided', () => {
        const draftData = {
          roomCount: 3,
          bathroomCount: 2,
          guestCount: 6,
          squareFootage: 1500
        };
        
        const rooms = initializeRooms(draftData);
        
        expect(rooms.roomCount).toBe(3);
        expect(rooms.bathroomCount).toBe(2);
        expect(rooms.guestCount).toBe(6);
        expect(rooms.squareFootage).toBe(1500);
      });

      it('should handle falsy values in draft data', () => {
        const draftData = {
          roomCount: 0,
          bathroomCount: 0,
          guestCount: 0,
          squareFootage: null
        };
        
        const rooms = initializeRooms(draftData);
        
        expect(rooms.roomCount).toBe(1); // should use default for 0
        expect(rooms.bathroomCount).toBe(1); // should use default for 0
        expect(rooms.guestCount).toBe(1); // should use default for 0
        expect(rooms.squareFootage).toBe(null);
      });
    });

    describe('initializePricing', () => {
      it('should return defaults when no draft data provided', () => {
        const pricing = initializePricing();
        
        expect(pricing.depositSize).toBe(null);
        expect(pricing.petDeposit).toBe(null);
        expect(pricing.petRent).toBe(null);
        expect(pricing.rentDueAtBooking).toBe(null);
        expect(pricing.shortestLeaseLength).toBe(1);
        expect(pricing.longestLeaseLength).toBe(12);
      });

      it('should return draft data when provided', () => {
        const draftData = {
          depositSize: 1500,
          petDeposit: 300,
          petRent: 50,
          rentDueAtBooking: 2000,
          shortestLeaseLength: 6,
          longestLeaseLength: 18
        };
        
        const pricing = initializePricing(draftData);
        
        expect(pricing.depositSize).toBe(1500);
        expect(pricing.petDeposit).toBe(300);
        expect(pricing.petRent).toBe(50);
        expect(pricing.rentDueAtBooking).toBe(2000);
        expect(pricing.shortestLeaseLength).toBe(6);
        expect(pricing.longestLeaseLength).toBe(18);
      });

      it('should handle null values correctly', () => {
        const draftData = {
          depositSize: null,
          petDeposit: null,
          petRent: null,
          rentDueAtBooking: null,
          shortestLeaseLength: null,
          longestLeaseLength: null
        };
        
        const pricing = initializePricing(draftData);
        
        expect(pricing.depositSize).toBe(null);
        expect(pricing.petDeposit).toBe(null);
        expect(pricing.petRent).toBe(null);
        expect(pricing.rentDueAtBooking).toBe(null);
        expect(pricing.shortestLeaseLength).toBe(1); // should use default
        expect(pricing.longestLeaseLength).toBe(12); // should use default
      });

      it('should handle zero values correctly', () => {
        const draftData = {
          depositSize: 0,
          petDeposit: 0,
          petRent: 0,
          rentDueAtBooking: 0,
          shortestLeaseLength: 0,
          longestLeaseLength: 0
        };
        
        const pricing = initializePricing(draftData);
        
        expect(pricing.depositSize).toBe(0);
        expect(pricing.petDeposit).toBe(0);
        expect(pricing.petRent).toBe(0);
        expect(pricing.rentDueAtBooking).toBe(0);
        expect(pricing.shortestLeaseLength).toBe(1); // should use default for 0
        expect(pricing.longestLeaseLength).toBe(12); // should use default for 0
      });
    });

    describe('initializePhotos', () => {
      it('should return empty arrays when no draft data provided', () => {
        const photos = initializePhotos();
        
        expect(photos.listingPhotos).toEqual([]);
        expect(photos.selectedPhotos).toEqual([]);
      });

      it('should return draft data when provided', () => {
        const draftData = {
          listingPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 }
          ],
          selectedPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 }
          ]
        };
        
        const photos = initializePhotos(draftData);
        
        expect(photos.listingPhotos).toEqual(draftData.listingPhotos);
        expect(photos.selectedPhotos).toEqual(draftData.selectedPhotos);
      });

      it('should filter and sort selected photos by rank', () => {
        const draftData = {
          listingPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 },
            { url: 'https://example.com/photo3.jpg', rank: 3 }
          ],
          selectedPhotos: [
            { url: 'https://example.com/photo3.jpg', rank: 3 },
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 },
            { url: 'https://example.com/invalid.jpg', rank: null }, // Should be filtered out
            { url: '', rank: 4 } // Should be filtered out due to empty url
          ]
        };
        
        const photos = initializePhotos(draftData);
        
        expect(photos.listingPhotos).toEqual(draftData.listingPhotos);
        expect(photos.selectedPhotos).toEqual([
          { url: 'https://example.com/photo1.jpg', rank: 1 },
          { url: 'https://example.com/photo2.jpg', rank: 2 },
          { url: 'https://example.com/photo3.jpg', rank: 3 }
        ]);
      });

      it('should handle null or undefined photo arrays', () => {
        const draftData = {
          listingPhotos: null,
          selectedPhotos: undefined
        };
        
        const photos = initializePhotos(draftData);
        
        expect(photos.listingPhotos).toEqual([]);
        expect(photos.selectedPhotos).toEqual([]);
      });
    });

    describe('initializeAmenities', () => {
      it('should return empty array when no draft data provided', () => {
        const amenities = initializeAmenities();
        
        expect(amenities).toEqual([]);
      });

      it('should return draft amenities when provided', () => {
        const draftData = {
          amenities: ['kitchen', 'wifi', 'airConditioner', 'pool']
        };
        
        const amenities = initializeAmenities(draftData);
        
        expect(amenities).toEqual(['kitchen', 'wifi', 'airConditioner', 'pool']);
      });

      it('should handle null or undefined amenities', () => {
        const draftData = {
          amenities: null
        };
        
        const amenities = initializeAmenities(draftData);
        
        expect(amenities).toEqual([]);
      });
    });

    describe('initializeMonthlyPricing', () => {
      it('should return empty array when no draft data provided', () => {
        const pricing = initializeMonthlyPricing();
        
        expect(pricing).toEqual([]);
      });

      it('should return draft pricing when provided', () => {
        const draftData = {
          monthlyPricing: [
            { months: 1, price: 1500, utilitiesIncluded: false },
            { months: 6, price: 1400, utilitiesIncluded: true },
            { months: 12, price: 1300, utilitiesIncluded: true }
          ]
        };
        
        const pricing = initializeMonthlyPricing(draftData);
        
        expect(pricing).toEqual(draftData.monthlyPricing);
      });

      it('should handle null or undefined pricing', () => {
        const draftData = {
          monthlyPricing: null
        };
        
        const pricing = initializeMonthlyPricing(draftData);
        
        expect(pricing).toEqual([]);
      });
    });

    describe('initializeBasicInfo', () => {
      it('should return empty strings when no draft data provided', () => {
        const basicInfo = initializeBasicInfo();
        
        expect(basicInfo.title).toBe("");
        expect(basicInfo.description).toBe("");
      });

      it('should return draft data when provided', () => {
        const draftData = {
          title: "Test Property",
          description: "This is a test property description"
        };
        
        const basicInfo = initializeBasicInfo(draftData);
        
        expect(basicInfo.title).toBe("Test Property");
        expect(basicInfo.description).toBe("This is a test property description");
      });

      it('should handle null values in draft data', () => {
        const draftData = {
          title: null,
          description: null
        };
        
        const basicInfo = initializeBasicInfo(draftData);
        
        expect(basicInfo.title).toBe("");
        expect(basicInfo.description).toBe("");
      });
    });

    describe('Integration with existing functions', () => {
      it('should work with loadDraftData output', async () => {
        // Create a draft using our existing functions
        const originalData = createFakeAddPropertyClientData();
        const draft = await handleSaveDraft(originalData, testUserId);
        
        // Load the draft data
        const loadedData = await loadDraftData(draft.id);
        
        // Use our initialization helpers with the loaded data
        const highlights = initializeHighlights(loadedData);
        const location = initializeLocation(loadedData);
        const rooms = initializeRooms(loadedData);
        const pricing = initializePricing(loadedData);
        const photos = initializePhotos(loadedData);
        const amenities = initializeAmenities(loadedData);
        const monthlyPricing = initializeMonthlyPricing(loadedData);
        const basicInfo = initializeBasicInfo(loadedData);
        
        // Verify they match the loaded data
        expect(highlights.category).toBe(loadedData.category);
        expect(highlights.petsAllowed).toBe(loadedData.petsAllowed);
        expect(highlights.furnished).toBe(loadedData.furnished);
        
        expect(location.city).toBe(loadedData.city);
        expect(location.state).toBe(loadedData.state);
        expect(location.streetAddress1).toBe(loadedData.streetAddress1);
        
        expect(rooms.roomCount).toBe(loadedData.roomCount);
        expect(rooms.bathroomCount).toBe(loadedData.bathroomCount);
        expect(rooms.guestCount).toBe(loadedData.guestCount);
        
        expect(pricing.depositSize).toBe(loadedData.depositSize);
        expect(pricing.shortestLeaseLength).toBe(loadedData.shortestLeaseLength);
        expect(pricing.longestLeaseLength).toBe(loadedData.longestLeaseLength);
        
        expect(photos.listingPhotos).toEqual(loadedData.listingPhotos);
        expect(photos.selectedPhotos).toEqual(loadedData.selectedPhotos);
        
        expect(amenities).toEqual(loadedData.amenities);
        expect(monthlyPricing).toEqual(loadedData.monthlyPricing);
        
        expect(basicInfo.title).toBe(loadedData.title);
        expect(basicInfo.description).toBe(loadedData.description);
      });
    });
  });

  describe('HandleSaveExit Helper Functions', () => {
    describe('transformComponentStateToDraftData', () => {
      it('should transform component state to draft data format', () => {
        const componentState = {
          listingBasics: { title: 'Test Property', description: 'Test Description' },
          listingLocation: {
            locationString: '123 Test St, Test City, TX 12345',
            latitude: 30.2672,
            longitude: -97.7431,
            city: 'Test City',
            state: 'TX',
            streetAddress1: '123 Test St',
            streetAddress2: 'Apt 4B',
            postalCode: '12345'
          },
          listingRooms: {
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: '1000'
          },
          listingPricing: {
            deposit: '1500',
            petDeposit: '300',
            petRent: '50',
            rentDueAtBooking: '2000',
            shortestStay: 6,
            longestStay: 12,
            monthlyPricing: [
              { months: 6, price: '1800', utilitiesIncluded: false },
              { months: 12, price: '1600', utilitiesIncluded: true }
            ]
          },
          listingHighlights: {
            category: 'Apartment',
            petsAllowed: true,
            furnished: false
          },
          listingPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 }
          ],
          selectedPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 }
          ],
          listingAmenities: ['kitchen', 'wifi', 'airConditioner']
        };

        const result = transformComponentStateToDraftData(componentState);

        expect(result).toEqual({
          title: 'Test Property',
          description: 'Test Description',
          status: 'draft',
          locationString: '123 Test St, Test City, TX 12345',
          latitude: 30.2672,
          longitude: -97.7431,
          city: 'Test City',
          state: 'TX',
          streetAddress1: '123 Test St',
          streetAddress2: 'Apt 4B',
          postalCode: '12345',
          roomCount: 2,
          bathroomCount: 1,
          guestCount: 2,
          squareFootage: 1000,
          depositSize: 1500,
          petDeposit: 300,
          petRent: 50,
          rentDueAtBooking: 2000,
          shortestLeaseLength: 6,
          longestLeaseLength: 12,
          requireBackgroundCheck: true,
          category: 'Apartment',
          petsAllowed: true,
          furnished: false,
          // Individual amenity boolean fields (photos handled separately)
          kitchen: true,
          wifi: true,
          airConditioner: true,
          monthlyPricing: [
            { months: 6, price: 1800, utilitiesIncluded: false },
            { months: 12, price: 1600, utilitiesIncluded: true }
          ]
        });
      });

      it('should handle empty/null values correctly', () => {
        const componentState = {
          listingBasics: { title: '', description: '' },
          listingLocation: {
            locationString: null,
            latitude: null,
            longitude: null,
            city: null,
            state: null,
            streetAddress1: null,
            streetAddress2: null,
            postalCode: null
          },
          listingRooms: {
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: ''
          },
          listingPricing: {
            deposit: '',
            petDeposit: '',
            petRent: '',
            rentDueAtBooking: '',
            shortestStay: 1,
            longestStay: 12,
            monthlyPricing: []
          },
          listingHighlights: {
            category: 'Single Family',
            petsAllowed: false,
            furnished: false
          },
          listingPhotos: [],
          selectedPhotos: [],
          listingAmenities: []
        };

        const result = transformComponentStateToDraftData(componentState);

        expect(result.title).toBe('');
        expect(result.description).toBe('');
        expect(result.locationString).toBe(null);
        expect(result.latitude).toBe(null);
        expect(result.longitude).toBe(null);
        expect(result.city).toBe(null);
        expect(result.state).toBe(null);
        expect(result.streetAddress1).toBe(null);
        expect(result.streetAddress2).toBe(null);
        expect(result.postalCode).toBe(null);
        expect(result.roomCount).toBe(1);
        expect(result.bathroomCount).toBe(1);
        expect(result.guestCount).toBe(1);
        expect(result.squareFootage).toBe(null);
        expect(result.depositSize).toBe(null);
        expect(result.petDeposit).toBe(null);
        expect(result.petRent).toBe(null);
        expect(result.rentDueAtBooking).toBe(null);
        expect(result.shortestLeaseLength).toBe(1);
        expect(result.longestLeaseLength).toBe(12);
        expect(result.requireBackgroundCheck).toBe(true);
        expect(result.category).toBe('Single Family');
        expect(result.petsAllowed).toBe(false);
        expect(result.furnished).toBe(false);
        // Photos and amenities are handled separately by helper functions, not included in transform
        expect(result.monthlyPricing).toEqual([]);
        expect(result.status).toBe('draft');
      });

      it('should handle pricing with zero values correctly', () => {
        const componentState = {
          listingBasics: { title: 'Test', description: 'Test' },
          listingLocation: {
            locationString: null,
            latitude: null,
            longitude: null,
            city: null,
            state: null,
            streetAddress1: null,
            streetAddress2: null,
            postalCode: null
          },
          listingRooms: {
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: '0'
          },
          listingPricing: {
            deposit: '0',
            petDeposit: '0',
            petRent: '0',
            rentDueAtBooking: '0',
            shortestStay: 1,
            longestStay: 12,
            monthlyPricing: [
              { months: 1, price: '0', utilitiesIncluded: false }
            ]
          },
          listingHighlights: {
            category: 'Single Family',
            petsAllowed: false,
            furnished: false
          },
          listingPhotos: [],
          selectedPhotos: [],
          listingAmenities: []
        };

        const result = transformComponentStateToDraftData(componentState);

        expect(result.squareFootage).toBe(0);
        expect(result.depositSize).toBe(0);
        expect(result.petDeposit).toBe(0);
        expect(result.petRent).toBe(0);
        expect(result.rentDueAtBooking).toBe(0);
        expect(result.monthlyPricing).toEqual([
          { months: 1, price: 0, utilitiesIncluded: false }
        ]);
      });
    });

    describe('handleSaveAndExit', () => {
      it('should successfully save and exit with valid data', async () => {
        const componentState = {
          listingBasics: { title: 'Test Property', description: 'Test Description' },
          listingLocation: {
            locationString: '123 Test St, Test City, TX 12345',
            latitude: 30.2672,
            longitude: -97.7431,
            city: 'Test City',
            state: 'TX',
            streetAddress1: '123 Test St',
            streetAddress2: null,
            postalCode: '12345'
          },
          listingRooms: {
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: '1000'
          },
          listingPricing: {
            deposit: '1500',
            petDeposit: '300',
            petRent: '50',
            rentDueAtBooking: '2000',
            shortestStay: 6,
            longestStay: 12,
            monthlyPricing: [
              { months: 6, price: '1800', utilitiesIncluded: false },
              { months: 12, price: '1600', utilitiesIncluded: true }
            ]
          },
          listingHighlights: {
            category: 'Apartment',
            petsAllowed: true,
            furnished: false
          },
          listingPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 }
          ],
          selectedPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 }
          ],
          listingAmenities: ['kitchen', 'wifi', 'airConditioner']
        };

        // Mock the fetch API for this test
        global.fetch = async (url: string, options: any) => {
          expect(url).toBe('/api/listings/draft');
          expect(options.method).toBe('POST');
          expect(options.headers['Content-Type']).toBe('application/json');
          
          const body = JSON.parse(options.body);
          expect(body.title).toBe('Test Property');
          expect(body.status).toBe('draft');
          expect(body.category).toBe('Apartment');
          expect(body.roomCount).toBe(2);
          expect(body.bathroomCount).toBe(1);
          expect(body.guestCount).toBe(2);
          expect(body.squareFootage).toBe(1000);
          expect(body.depositSize).toBe(1500);
          expect(body.petDeposit).toBe(300);
          expect(body.petRent).toBe(50);
          expect(body.rentDueAtBooking).toBe(2000);
          expect(body.shortestLeaseLength).toBe(6);
          expect(body.longestLeaseLength).toBe(12);
          expect(body.petsAllowed).toBe(true);
          expect(body.furnished).toBe(false);
          // Check individual amenity boolean fields
          expect(body.kitchen).toBe(true);
          expect(body.wifi).toBe(true);
          expect(body.airConditioner).toBe(true);
          expect(body.monthlyPricing).toEqual([
            { months: 6, price: 1800, utilitiesIncluded: false },
            { months: 12, price: 1600, utilitiesIncluded: true }
          ]);
          
          return {
            ok: true,
            json: async () => ({ id: 'test-draft-id', ...body })
          };
        };

        let successCallbackCalled = false;
        let savedDraftResult: any = null;

        const result = await handleSaveAndExit(componentState, {
          onSuccess: (savedDraft) => {
            successCallbackCalled = true;
            savedDraftResult = savedDraft;
          },
          onError: (error) => {
            throw new Error(`Should not call onError: ${error.message}`);
          }
        });

        expect(successCallbackCalled).toBe(true);
        expect(savedDraftResult).toBeDefined();
        expect(savedDraftResult.id).toBe('test-draft-id');
        expect(result).toEqual(savedDraftResult);
      });

      it('should handle API errors correctly', async () => {
        const componentState = {
          listingBasics: { title: 'Test Property', description: 'Test Description' },
          listingLocation: {
            locationString: null,
            latitude: null,
            longitude: null,
            city: null,
            state: null,
            streetAddress1: null,
            streetAddress2: null,
            postalCode: null
          },
          listingRooms: {
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: ''
          },
          listingPricing: {
            deposit: '',
            petDeposit: '',
            petRent: '',
            rentDueAtBooking: '',
            shortestStay: 1,
            longestStay: 12,
            monthlyPricing: []
          },
          listingHighlights: {
            category: 'Single Family',
            petsAllowed: false,
            furnished: false
          },
          listingPhotos: [],
          selectedPhotos: [],
          listingAmenities: []
        };

        // Mock the fetch API to return an error
        global.fetch = async () => {
          return {
            ok: false,
            json: async () => ({ error: 'Database connection failed' })
          };
        };

        let errorCallbackCalled = false;
        let capturedError: Error | null = null;

        await expect(handleSaveAndExit(componentState, {
          onSuccess: () => {
            throw new Error('Should not call onSuccess');
          },
          onError: (error) => {
            errorCallbackCalled = true;
            capturedError = error;
          }
        })).rejects.toThrow('Database connection failed');

        expect(errorCallbackCalled).toBe(true);
        expect(capturedError).toBeDefined();
        expect(capturedError?.message).toBe('Database connection failed');
      });

      it('should handle network errors correctly', async () => {
        const componentState = {
          listingBasics: { title: 'Test Property', description: 'Test Description' },
          listingLocation: {
            locationString: null,
            latitude: null,
            longitude: null,
            city: null,
            state: null,
            streetAddress1: null,
            streetAddress2: null,
            postalCode: null
          },
          listingRooms: {
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: ''
          },
          listingPricing: {
            deposit: '',
            petDeposit: '',
            petRent: '',
            rentDueAtBooking: '',
            shortestStay: 1,
            longestStay: 12,
            monthlyPricing: []
          },
          listingHighlights: {
            category: 'Single Family',
            petsAllowed: false,
            furnished: false
          },
          listingPhotos: [],
          selectedPhotos: [],
          listingAmenities: []
        };

        // Mock the fetch API to throw a network error
        global.fetch = async () => {
          throw new Error('Network error');
        };

        let errorCallbackCalled = false;
        let capturedError: Error | null = null;

        await expect(handleSaveAndExit(componentState, {
          onSuccess: () => {
            throw new Error('Should not call onSuccess');
          },
          onError: (error) => {
            errorCallbackCalled = true;
            capturedError = error;
          }
        })).rejects.toThrow('Network error');

        expect(errorCallbackCalled).toBe(true);
        expect(capturedError).toBeDefined();
        expect(capturedError?.message).toBe('Network error');
      });

      it('should work without callbacks', async () => {
        const componentState = {
          listingBasics: { title: 'Test Property', description: 'Test Description' },
          listingLocation: {
            locationString: null,
            latitude: null,
            longitude: null,
            city: null,
            state: null,
            streetAddress1: null,
            streetAddress2: null,
            postalCode: null
          },
          listingRooms: {
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: ''
          },
          listingPricing: {
            deposit: '',
            petDeposit: '',
            petRent: '',
            rentDueAtBooking: '',
            shortestStay: 1,
            longestStay: 12,
            monthlyPricing: []
          },
          listingHighlights: {
            category: 'Single Family',
            petsAllowed: false,
            furnished: false
          },
          listingPhotos: [],
          selectedPhotos: [],
          listingAmenities: []
        };

        // Mock the fetch API to return success
        global.fetch = async () => {
          return {
            ok: true,
            json: async () => ({ id: 'test-draft-id', status: 'draft' })
          };
        };

        // Should not throw when no callbacks are provided
        const result = await handleSaveAndExit(componentState);
        
        expect(result).toBeDefined();
        expect(result.id).toBe('test-draft-id');
        expect(result.status).toBe('draft');
      });
    });

    describe('Integration with existing helper functions', () => {
      it('should work with data from initialization helpers', () => {
        // Create component state using our initialization helpers
        const mockDraftData = {
          title: 'Integration Test Property',
          description: 'Test Description',
          category: 'Apartment',
          petsAllowed: true,
          furnished: false,
          locationString: '123 Test St, Test City, TX 12345',
          latitude: 30.2672,
          longitude: -97.7431,
          city: 'Test City',
          state: 'TX',
          streetAddress1: '123 Test St',
          streetAddress2: null,
          postalCode: '12345',
          roomCount: 2,
          bathroomCount: 1,
          guestCount: 2,
          squareFootage: 1000,
          depositSize: 1500,
          petDeposit: 300,
          petRent: 50,
          rentDueAtBooking: 2000,
          shortestLeaseLength: 6,
          longestLeaseLength: 12,
          listingPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 },
            { url: 'https://example.com/photo2.jpg', rank: 2 }
          ],
          selectedPhotos: [
            { url: 'https://example.com/photo1.jpg', rank: 1 }
          ],
          amenities: ['kitchen', 'wifi', 'airConditioner'],
          monthlyPricing: [
            { months: 6, price: 1800, utilitiesIncluded: false },
            { months: 12, price: 1600, utilitiesIncluded: true }
          ]
        };

        // Initialize using our helpers
        const listingBasics = initializeBasicInfo(mockDraftData);
        const listingHighlights = initializeHighlights(mockDraftData);
        const listingLocation = initializeLocation(mockDraftData);
        const listingPhotos = initializePhotos(mockDraftData);
        const listingAmenities = initializeAmenities(mockDraftData);
        
        // Mock component state structure
        const componentState = {
          listingBasics,
          listingHighlights,
          listingLocation,
          listingRooms: {
            bedrooms: mockDraftData.roomCount || 1,
            bathrooms: mockDraftData.bathroomCount || 1,
            squareFeet: mockDraftData.squareFootage ? mockDraftData.squareFootage.toString() : ''
          },
          listingPricing: {
            deposit: mockDraftData.depositSize ? mockDraftData.depositSize.toString() : '',
            petDeposit: mockDraftData.petDeposit ? mockDraftData.petDeposit.toString() : '',
            petRent: mockDraftData.petRent ? mockDraftData.petRent.toString() : '',
            rentDueAtBooking: mockDraftData.rentDueAtBooking ? mockDraftData.rentDueAtBooking.toString() : '',
            shortestStay: mockDraftData.shortestLeaseLength || 1,
            longestStay: mockDraftData.longestLeaseLength || 12,
            monthlyPricing: mockDraftData.monthlyPricing.map(p => ({
              months: p.months,
              price: p.price.toString(),
              utilitiesIncluded: p.utilitiesIncluded
            }))
          },
          listingPhotos: listingPhotos.listingPhotos,
          selectedPhotos: listingPhotos.selectedPhotos,
          listingAmenities
        };

        // Transform and verify the result
        const result = transformComponentStateToDraftData(componentState);
        
        expect(result.title).toBe('Integration Test Property');
        expect(result.category).toBe('Apartment');
        expect(result.petsAllowed).toBe(true);
        expect(result.furnished).toBe(false);
        expect(result.city).toBe('Test City');
        expect(result.state).toBe('TX');
        expect(result.roomCount).toBe(2);
        expect(result.bathroomCount).toBe(1);
        expect(result.guestCount).toBe(2);
        expect(result.squareFootage).toBe(1000);
        expect(result.depositSize).toBe(1500);
        expect(result.petDeposit).toBe(300);
        expect(result.petRent).toBe(50);
        expect(result.rentDueAtBooking).toBe(2000);
        expect(result.shortestLeaseLength).toBe(6);
        expect(result.longestLeaseLength).toBe(12);
        // Check individual amenity boolean fields
        expect(result.kitchen).toBe(true);
        expect(result.wifi).toBe(true);
        expect(result.airConditioner).toBe(true);
        expect(result.monthlyPricing).toEqual([
          { months: 6, price: 1800, utilitiesIncluded: false },
          { months: 12, price: 1600, utilitiesIncluded: true }
        ]);
        // Photos are handled separately by helper functions, not included in transform
        expect(result.status).toBe('draft');
      });
    });
  });

  // ==========================================
  // VALIDATION FUNCTION TESTS
  // ==========================================
  
  describe('Validation Functions', () => {
    describe('validateHighlights', () => {
      it('should pass validation with valid highlights', () => {
        const validHighlights = createValidHighlights();
        const errors = validateHighlights(validHighlights);
        expect(errors).toEqual([]);
      });

      it('should fail validation with missing category', () => {
        const invalidHighlights = { ...createValidHighlights(), category: null };
        const errors = validateHighlights(invalidHighlights);
        expect(errors).toContain('You must select a property type');
      });

      it('should fail validation with missing furnished option', () => {
        const invalidHighlights = { ...createValidHighlights(), furnished: null };
        const errors = validateHighlights(invalidHighlights);
        expect(errors).toContain('You must select a furnishing option');
      });

      it('should fail validation with missing pets allowed option', () => {
        const invalidHighlights = { ...createValidHighlights(), petsAllowed: null };
        const errors = validateHighlights(invalidHighlights);
        expect(errors).toContain('You must specify if pets are allowed');
      });

      it('should fail validation with all missing fields', () => {
        const invalidHighlights = createInvalidHighlights();
        const errors = validateHighlights(invalidHighlights);
        expect(errors).toHaveLength(3);
        expect(errors).toContain('You must select a property type');
        expect(errors).toContain('You must select a furnishing option');
        expect(errors).toContain('You must specify if pets are allowed');
      });
    });

    describe('validateLocation', () => {
      it('should pass validation with valid location', () => {
        const validLocation = createValidLocation();
        const errors = validateLocation(validLocation);
        expect(errors).toEqual([]);
      });

      it('should fail validation with missing street address', () => {
        const invalidLocation = { ...createValidLocation(), streetAddress1: null };
        const errors = validateLocation(invalidLocation);
        expect(errors).toContain('Street address is required');
      });

      it('should fail validation with missing city', () => {
        const invalidLocation = { ...createValidLocation(), city: null };
        const errors = validateLocation(invalidLocation);
        expect(errors).toContain('City is required');
      });

      it('should fail validation with missing state', () => {
        const invalidLocation = { ...createValidLocation(), state: null };
        const errors = validateLocation(invalidLocation);
        expect(errors).toContain('State is required');
      });

      it('should fail validation with missing postal code', () => {
        const invalidLocation = { ...createValidLocation(), postalCode: null };
        const errors = validateLocation(invalidLocation);
        expect(errors).toContain('Postal code is required');
      });

      it('should fail validation with all missing required fields', () => {
        const invalidLocation = createInvalidLocation();
        const errors = validateLocation(invalidLocation);
        expect(errors).toHaveLength(4);
        expect(errors).toContain('Street address is required');
        expect(errors).toContain('City is required');
        expect(errors).toContain('State is required');
        expect(errors).toContain('Postal code is required');
      });
    });

    describe('validateRooms', () => {
      it('should pass validation with valid rooms', () => {
        const validRooms = createValidRooms();
        const errors = validateRooms(validRooms);
        expect(errors).toEqual([]);
      });

      it('should fail validation with zero bedrooms', () => {
        const invalidRooms = { ...createValidRooms(), bedrooms: 0 };
        const errors = validateRooms(invalidRooms);
        expect(errors).toContain('Number of bedrooms is required');
      });

      it('should fail validation with zero bathrooms', () => {
        const invalidRooms = { ...createValidRooms(), bathrooms: 0 };
        const errors = validateRooms(invalidRooms);
        expect(errors).toContain('Number of bathrooms is required');
      });

      it('should fail validation with missing square footage', () => {
        const invalidRooms = { ...createValidRooms(), squareFeet: '' };
        const errors = validateRooms(invalidRooms);
        expect(errors).toContain('Square footage is required');
      });

      it('should fail validation with all invalid fields', () => {
        const invalidRooms = createInvalidRooms();
        const errors = validateRooms(invalidRooms);
        expect(errors).toHaveLength(3);
        expect(errors).toContain('Number of bedrooms is required');
        expect(errors).toContain('Number of bathrooms is required');
        expect(errors).toContain('Square footage is required');
      });
    });

    describe('validateBasics', () => {
      it('should pass validation with valid basics', () => {
        const validBasics = createValidBasics();
        const errors = validateBasics(validBasics);
        expect(errors).toEqual([]);
      });

      it('should fail validation with missing title', () => {
        const invalidBasics = { ...createValidBasics(), title: '' };
        const errors = validateBasics(invalidBasics);
        expect(errors).toContain('Title is required');
      });

      it('should fail validation with short title', () => {
        const invalidBasics = { ...createValidBasics(), title: 'Hi' };
        const errors = validateBasics(invalidBasics);
        expect(errors).toContain('Title must be at least 5 characters');
      });

      it('should fail validation with missing description', () => {
        const invalidBasics = { ...createValidBasics(), description: '' };
        const errors = validateBasics(invalidBasics);
        expect(errors).toContain('Description is required');
      });

      it('should fail validation with short description', () => {
        const invalidBasics = { ...createValidBasics(), description: 'Short desc' };
        const errors = validateBasics(invalidBasics);
        expect(errors).toContain('Description must be at least 20 characters');
      });

      it('should fail validation with all invalid fields', () => {
        const invalidBasics = createInvalidBasics();
        const errors = validateBasics(invalidBasics);
        expect(errors).toHaveLength(2);
        expect(errors).toContain('Title is required');
        expect(errors).toContain('Description must be at least 20 characters');
      });
    });

    describe('validatePhotos', () => {
      it('should pass validation with valid photos (4+)', () => {
        const validPhotos = createValidPhotos();
        const errors = validatePhotos(validPhotos);
        expect(errors).toEqual([]);
      });

      it('should fail validation with no photos', () => {
        const errors = validatePhotos([]);
        expect(errors).toContain('You must upload at least 4 photos');
      });

      it('should fail validation with too few photos', () => {
        const invalidPhotos = createInvalidPhotos();
        const errors = validatePhotos(invalidPhotos);
        expect(errors).toContain('You need to upload 3 more photos (minimum 4 required)');
      });

      it('should fail validation with photos without URLs', () => {
        const photosWithoutUrls = [
          { id: '1', url: null, listingId: 'test', category: 'living_room', rank: 1 },
          { id: '2', url: '', listingId: 'test', category: 'bedroom', rank: 2 }
        ];
        const errors = validatePhotos(photosWithoutUrls);
        expect(errors).toContain('You must upload at least 4 photos');
      });
    });

    describe('validateFeaturedPhotos', () => {
      it('should pass validation with exactly 4 selected photos', () => {
        const validSelectedPhotos = createValidSelectedPhotos();
        const errors = validateFeaturedPhotos(validSelectedPhotos);
        expect(errors).toEqual([]);
      });

      it('should fail validation with wrong number of selected photos', () => {
        const invalidSelectedPhotos = createInvalidSelectedPhotos();
        const errors = validateFeaturedPhotos(invalidSelectedPhotos);
        expect(errors).toContain('You must select exactly four featured photos.');
      });

      it('should fail validation with no selected photos', () => {
        const errors = validateFeaturedPhotos([]);
        expect(errors).toContain('You must select exactly four featured photos.');
      });
    });

    describe('validateAmenities', () => {
      it('should pass validation with valid amenities (includes laundry option)', () => {
        const validAmenities = createValidAmenities();
        const errors = validateAmenities(validAmenities);
        expect(errors).toEqual([]);
      });

      it('should fail validation with missing laundry option', () => {
        const invalidAmenities = createInvalidAmenities();
        const errors = validateAmenities(invalidAmenities);
        expect(errors).toContain('You must select one laundry option (In Unit, In Complex, or No Laundry)');
      });

      it('should pass validation with washerInComplex option', () => {
        const amenitiesWithComplex = ['kitchen', 'wifi', 'washerInComplex'];
        const errors = validateAmenities(amenitiesWithComplex);
        expect(errors).toEqual([]);
      });

      it('should pass validation with washerNotAvailable option', () => {
        const amenitiesWithNoWasher = ['kitchen', 'wifi', 'washerNotAvailable'];
        const errors = validateAmenities(amenitiesWithNoWasher);
        expect(errors).toEqual([]);
      });

      it('should fail validation with multiple laundry options', () => {
        const amenitiesWithMultipleLaundry = ['kitchen', 'wifi', 'washerInUnit', 'washerInComplex'];
        const errors = validateAmenities(amenitiesWithMultipleLaundry);
        expect(errors).toContain('You must select one laundry option (In Unit, In Complex, or No Laundry)');
      });
    });

    describe('validatePricing', () => {
      it('should pass validation with valid pricing settings', () => {
        const validPricing = createValidPricing();
        const errors = validatePricing(validPricing);
        expect(errors).toEqual([]);
      });

      it('should fail validation with invalid shortest stay (too low)', () => {
        const invalidPricing = { ...createValidPricing(), shortestStay: 0 };
        const errors = validatePricing(invalidPricing);
        expect(errors).toContain('Shortest stay must be between 1 and 12 months');
      });

      it('should fail validation with invalid shortest stay (too high)', () => {
        const invalidPricing = { ...createValidPricing(), shortestStay: 15 };
        const errors = validatePricing(invalidPricing);
        expect(errors).toContain('Shortest stay must be between 1 and 12 months');
      });

      it('should fail validation with invalid longest stay', () => {
        const invalidPricing = { ...createValidPricing(), longestStay: 15 };
        const errors = validatePricing(invalidPricing);
        expect(errors).toContain('Longest stay must be between 1 and 12 months');
      });

      it('should fail validation with shortest stay > longest stay', () => {
        const invalidPricing = { ...createValidPricing(), shortestStay: 6, longestStay: 3 };
        const errors = validatePricing(invalidPricing);
        expect(errors).toContain('Shortest stay cannot be longer than longest stay');
      });

      it('should fail validation with all invalid settings', () => {
        const invalidPricing = createInvalidPricingSettings();
        const errors = validatePricing(invalidPricing);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateVerifyPricing', () => {
      it('should pass validation with complete pricing (all months filled)', () => {
        const validPricing = createValidPricing();
        const errors = validateVerifyPricing(validPricing);
        expect(errors).toEqual([]);
      });

      it('should fail validation with missing prices', () => {
        const pricingWithMissing = createPricingWithMissingPrices();
        const errors = validateVerifyPricing(pricingWithMissing);
        expect(errors).toContain('Please set prices for all 6 lease lengths');
      });

      it('should pass validation with zero prices (free rent)', () => {
        const pricingWithZeros = {
          ...createValidPricing(),
          monthlyPricing: createZeroPricesMonthlyPricing()
        };
        const errors = validateVerifyPricing(pricingWithZeros);
        expect(errors).toEqual([]);
      });

      it('should fail validation with negative prices', () => {
        const pricingWithInvalid = {
          ...createValidPricing(),
          monthlyPricing: createInvalidPricesMonthlyPricing()
        };
        const errors = validateVerifyPricing(pricingWithInvalid);
        expect(errors).toContain('All prices must be valid non-negative numbers');
      });

      it('should handle empty string prices correctly', () => {
        const pricingWithEmptyStrings = {
          ...createValidPricing(),
          monthlyPricing: [
            { months: 1, price: '', utilitiesIncluded: false },
            { months: 2, price: '1000', utilitiesIncluded: false }
          ]
        };
        const errors = validateVerifyPricing(pricingWithEmptyStrings);
        expect(errors).toContain('Please set prices for all 2 lease lengths');
      });

      it('should handle null prices correctly', () => {
        const pricingWithNullPrices = {
          ...createValidPricing(),
          monthlyPricing: [
            { months: 1, price: null as any, utilitiesIncluded: false },
            { months: 2, price: '1000', utilitiesIncluded: false }
          ]
        };
        const errors = validateVerifyPricing(pricingWithNullPrices);
        expect(errors).toContain('Please set prices for all 2 lease lengths');
      });

      it('should handle decimal prices correctly', () => {
        const pricingWithDecimals = {
          ...createValidPricing(),
          monthlyPricing: [
            { months: 1, price: '1000.50', utilitiesIncluded: false },
            { months: 2, price: '999.99', utilitiesIncluded: false }
          ]
        };
        const errors = validateVerifyPricing(pricingWithDecimals);
        expect(errors).toEqual([]);
      });
    });

    describe('validateDeposits', () => {
      it('should pass validation with valid deposits', () => {
        const validPricing = createValidPricing();
        const errors = validateDeposits(validPricing);
        expect(errors).toEqual([]);
      });

      it('should fail validation when rent due exceeds lowest monthly rent', () => {
        const pricingWithInvalidDeposits = createPricingWithInvalidDeposits();
        const errors = validateDeposits(pricingWithInvalidDeposits);
        expect(errors).toContain('Rent due at booking ($1200) cannot be higher than the lowest monthly rent ($800)');
      });

      it('should pass validation with no rent due at booking', () => {
        const pricingWithoutRentDue = { ...createValidPricing(), rentDueAtBooking: '' };
        const errors = validateDeposits(pricingWithoutRentDue);
        expect(errors).toEqual([]);
      });

      it('should pass validation with rent due equal to lowest monthly rent', () => {
        const pricing = {
          ...createValidPricing(),
          monthlyPricing: [
            { months: 1, price: '1000', utilitiesIncluded: false },
            { months: 2, price: '900', utilitiesIncluded: false }
          ],
          rentDueAtBooking: '900' // Equal to lowest
        };
        const errors = validateDeposits(pricing);
        expect(errors).toEqual([]);
      });
    });

    describe('validateAllSteps', () => {
      it('should pass validation with completely valid form data', () => {
        const validFormData = createValidFormData();
        const allErrors = validateAllSteps(validFormData);
        expect(Object.keys(allErrors)).toHaveLength(0);
      });

      it('should fail validation with invalid form data across multiple steps', () => {
        const invalidFormData = createInvalidFormData();
        const allErrors = validateAllSteps(invalidFormData);
        
        // Should have errors for multiple steps
        expect(Object.keys(allErrors).length).toBeGreaterThan(1);
        
        // Check that specific steps have errors
        expect(allErrors[0]).toBeDefined(); // Highlights errors
        expect(allErrors[1]).toBeDefined(); // Location errors
        expect(allErrors[2]).toBeDefined(); // Location errors (same as step 1)
        expect(allErrors[3]).toBeDefined(); // Rooms errors
        expect(allErrors[4]).toBeDefined(); // Basics errors
        expect(allErrors[5]).toBeDefined(); // Photos errors
        expect(allErrors[6]).toBeDefined(); // Featured photos errors
        expect(allErrors[7]).toBeDefined(); // Amenities errors
        expect(allErrors[9]).toBeDefined(); // Verify pricing errors
      });

      it('should return errors for specific failed steps only', () => {
        const partiallyValidData = {
          ...createValidFormData(),
          listingBasics: createInvalidBasics(),
          listingPricing: createPricingWithMissingPrices()
        };
        
        const allErrors = validateAllSteps(partiallyValidData);
        
        // Should only have errors for the invalid steps
        expect(allErrors[4]).toBeDefined(); // Basics errors
        expect(allErrors[9]).toBeDefined(); // Verify pricing errors
        
        // Should not have errors for valid steps
        expect(allErrors[0]).toBeUndefined(); // Highlights should be valid
        expect(allErrors[1]).toBeUndefined(); // Location should be valid
        expect(allErrors[3]).toBeUndefined(); // Rooms should be valid
      });
    });
  });

  // ==========================================
  // INTEGRATION VALIDATION TESTS
  // ==========================================
  
  describe('Integration Validation Tests', () => {
    describe('Draft Creation with Validation', () => {
      it('should successfully create and save a draft with valid data', async () => {
        const validFormData = createValidFormData();
        
        // Transform to draft data format
        const draftData = transformComponentStateToDraftData(validFormData);
        
        // Validate all steps before saving
        const validationErrors = validateAllSteps(validFormData);
        expect(Object.keys(validationErrors)).toHaveLength(0);
        
        // Save draft (this should succeed since validation passed)
        const savedDraft = await saveDraft(draftData, testUserId);
        
        expect(savedDraft).toBeDefined();
        expect(savedDraft.id).toBeDefined();
        expect(savedDraft.title).toBe(validFormData.listingBasics.title);
        expect(savedDraft.status).toBe('draft');
        
        // Clean up
        await cleanupTestData(testUserId);
      });

      it('should detect validation errors before attempting draft save', async () => {
        const invalidFormData = createInvalidFormData();
        
        // Validate all steps - should find errors
        const validationErrors = validateAllSteps(invalidFormData);
        expect(Object.keys(validationErrors).length).toBeGreaterThan(0);
        
        // Should have specific validation errors
        expect(validationErrors[0]).toContain('You must select a property type');
        expect(validationErrors[1]).toContain('Street address is required');
        expect(validationErrors[4]).toContain('Title is required');
        expect(validationErrors[9]).toContain('Please set prices for all 6 lease lengths');
      });

      it('should handle pricing validation edge cases in draft flow', async () => {
        const formDataWithPricingIssues = {
          ...createValidFormData(),
          listingPricing: createPricingWithMissingPrices()
        };
        
        // Pricing validation should fail
        const pricingErrors = validateVerifyPricing(formDataWithPricingIssues.listingPricing);
        expect(pricingErrors).toContain('Please set prices for all 6 lease lengths');
        
        // All steps validation should include pricing errors
        const allErrors = validateAllSteps(formDataWithPricingIssues);
        expect(allErrors[9]).toBeDefined();
        expect(allErrors[9]).toContain('Please set prices for all 6 lease lengths');
      });
    });

    describe('Listing Creation with Validation', () => {
      it('should successfully create listing after all validations pass', async () => {
        const validFormData = createValidFormData();
        
        // Step 1: Validate all form data
        const validationErrors = validateAllSteps(validFormData);
        expect(Object.keys(validationErrors)).toHaveLength(0);
        
        // Step 2: Create draft first
        const draftData = transformComponentStateToDraftData(validFormData);
        const savedDraft = await saveDraft(draftData, testUserId);
        
        // Step 3: Create listing from validated draft
        const createdListing = await createListingFromDraft(
          savedDraft.id,
          testUserId,
          {
            listingImages: validFormData.listingPhotos.map(photo => ({
              url: photo.url!,
              category: photo.category,
              rank: photo.rank
            })),
            monthlyPricing: validFormData.listingPricing.monthlyPricing.map(p => ({
              months: p.months,
              price: parseFloat(p.price),
              utilitiesIncluded: p.utilitiesIncluded
            }))
          }
        );
        
        expect(createdListing).toBeDefined();
        expect(createdListing.id).toBeDefined();
        expect(createdListing.title).toBe(validFormData.listingBasics.title);
        expect(createdListing.status).toBe('available');
        expect(createdListing.approvalStatus).toBe('pendingReview');
        
        // Clean up
        await cleanupTestData(testUserId);
      });

      it('should prevent listing creation with validation errors', async () => {
        // Create form data with specific validation issues
        const invalidFormData = {
          ...createValidFormData(),
          listingBasics: createInvalidBasics(),
          listingPricing: createPricingWithMissingPrices()
        };
        
        // Validation should fail
        const validationErrors = validateAllSteps(invalidFormData);
        expect(Object.keys(validationErrors).length).toBeGreaterThan(0);
        
        // Should not proceed with listing creation when validation fails
        expect(validationErrors[4]).toContain('Title is required');
        expect(validationErrors[9]).toContain('Please set prices for all 6 lease lengths');
        
        // In a real application, the UI would prevent submission
        // when validateAllSteps returns errors
      });

      it('should handle complex pricing validation scenarios', async () => {
        // Test case: rent due at booking exceeds monthly rent
        const formDataWithDepositIssue = {
          ...createValidFormData(),
          listingPricing: createPricingWithInvalidDeposits()
        };
        
        // Deposit validation should fail
        const depositErrors = validateDeposits(formDataWithDepositIssue.listingPricing);
        expect(depositErrors).toContain('Rent due at booking ($1200) cannot be higher than the lowest monthly rent ($800)');
        
        // All steps validation should include deposit errors
        const allErrors = validateAllSteps(formDataWithDepositIssue);
        expect(allErrors[10]).toBeDefined();
        expect(allErrors[10]).toContain('Rent due at booking ($1200) cannot be higher than the lowest monthly rent ($800)');
      });

      it('should validate zero prices correctly (regression test)', async () => {
        // This tests the specific edge case mentioned in the issue
        const formDataWithZeroPrices = {
          ...createValidFormData(),
          listingPricing: {
            ...createValidPricing(),
            monthlyPricing: createZeroPricesMonthlyPricing()
          }
        };
        
        // Zero prices should be valid (free rent is allowed)
        const pricingErrors = validateVerifyPricing(formDataWithZeroPrices.listingPricing);
        expect(pricingErrors).toEqual([]);
        
        // All validation should pass
        const allErrors = validateAllSteps(formDataWithZeroPrices);
        expect(Object.keys(allErrors)).toHaveLength(0);
      });
    });

    describe('End-to-End Validation Flow', () => {
      it('should simulate complete add-property flow with validation', async () => {
        const testFormData = createValidFormData();
        
        // Step 1: Validate highlights (step 0)
        const highlightsErrors = validateHighlights(testFormData.listingHighlights);
        expect(highlightsErrors).toEqual([]);
        
        // Step 2: Validate location (steps 1-2)
        const locationErrors = validateLocation(testFormData.listingLocation);
        expect(locationErrors).toEqual([]);
        
        // Step 3: Validate rooms (step 3)
        const roomsErrors = validateRooms(testFormData.listingRooms);
        expect(roomsErrors).toEqual([]);
        
        // Step 4: Validate basics (step 4)
        const basicsErrors = validateBasics(testFormData.listingBasics);
        expect(basicsErrors).toEqual([]);
        
        // Step 5: Validate photos (step 5)
        const photosErrors = validatePhotos(testFormData.listingPhotos);
        expect(photosErrors).toEqual([]);
        
        // Step 6: Validate featured photos (step 6)
        const featuredPhotosErrors = validateFeaturedPhotos(testFormData.selectedPhotos);
        expect(featuredPhotosErrors).toEqual([]);
        
        // Step 7: Validate amenities (step 7)
        const amenitiesErrors = validateAmenities(testFormData.listingAmenities);
        expect(amenitiesErrors).toEqual([]);
        
        // Step 8: Validate pricing settings (step 8)
        const pricingErrors = validatePricing(testFormData.listingPricing);
        expect(pricingErrors).toEqual([]);
        
        // Step 9: Validate verify pricing (step 9) - THE KEY STEP FROM THE ISSUE
        const verifyPricingErrors = validateVerifyPricing(testFormData.listingPricing);
        expect(verifyPricingErrors).toEqual([]);
        
        // Step 10: Validate deposits (step 10)
        const depositErrors = validateDeposits(testFormData.listingPricing);
        expect(depositErrors).toEqual([]);
        
        // Final: Validate all steps together
        const allErrors = validateAllSteps(testFormData);
        expect(Object.keys(allErrors)).toHaveLength(0);
        
        // If we reach here, all validations passed - proceed with submission
        const draftData = transformComponentStateToDraftData(testFormData);
        const savedDraft = await saveDraft(draftData, testUserId);
        const createdListing = await createListingFromDraft(savedDraft.id, testUserId);
        
        expect(createdListing.status).toBe('available');
        
        // Clean up
        await cleanupTestData(testUserId);
      });

      it('should identify and report first validation failure in step sequence', async () => {
        // Create data that fails at multiple steps
        const multiFailureData = {
          ...createValidFormData(),
          listingHighlights: createInvalidHighlights(), // Will fail at step 0
          listingBasics: createInvalidBasics(),         // Will fail at step 4
          listingPricing: createPricingWithMissingPrices() // Will fail at step 9
        };
        
        // Validate individual steps to confirm they fail
        expect(validateHighlights(multiFailureData.listingHighlights).length).toBeGreaterThan(0);
        expect(validateBasics(multiFailureData.listingBasics).length).toBeGreaterThan(0);
        expect(validateVerifyPricing(multiFailureData.listingPricing).length).toBeGreaterThan(0);
        
        // All steps validation should return errors for multiple steps
        const allErrors = validateAllSteps(multiFailureData);
        expect(Object.keys(allErrors).length).toBeGreaterThan(2);
        
        // Should include errors for all failed steps
        expect(allErrors[0]).toBeDefined(); // Highlights errors
        expect(allErrors[4]).toBeDefined(); // Basics errors  
        expect(allErrors[9]).toBeDefined(); // Verify pricing errors
        
        // The UI would navigate to the first error step (step 0)
        const firstErrorStep = Object.keys(allErrors)
          .map(Number)
          .sort((a, b) => a - b)[0];
        expect(firstErrorStep).toBe(0);
      });
    });
  });
});