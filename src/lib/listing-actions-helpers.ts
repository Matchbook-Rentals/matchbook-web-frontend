import prisma from '@/lib/prismadb';

export interface ListingData {
  listingImages?: Array<{
    url: string;
    category?: string | null;
    rank?: number | null;
  }>;
  monthlyPricing?: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;
  [key: string]: any;
}

export interface DraftData {
  id?: string;
  title?: string | null;
  description?: string | null;
  status?: string;
  locationString?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  streetAddress1?: string | null;
  streetAddress2?: string | null;
  postalCode?: string | null;
  roomCount?: number | null;
  bathroomCount?: number | null;
  guestCount?: number | null;
  squareFootage?: number | null;
  depositSize?: number | null;
  petDeposit?: number | null;
  petRent?: number | null;
  rentDueAtBooking?: number | null;
  shortestLeaseLength?: number | null;
  longestLeaseLength?: number | null;
  shortestLeasePrice?: number | null;
  longestLeasePrice?: number | null;
  requireBackgroundCheck?: boolean | null;
  category?: string | null;
  petsAllowed?: boolean | null;
  furnished?: boolean | null;
  listingImages?: Array<{
    url: string;
    rank?: number | null;
  }>;
  monthlyPricing?: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;
  [key: string]: any;
}

/**
 * Creates a listing from a draft
 * @param draftId - The ID of the draft to convert
 * @param userId - The ID of the user creating the listing
 * @param options - Optional override data for listingImages and monthlyPricing
 * @returns The created listing
 */
export async function createListingFromDraft(
  draftId: string,
  userId: string,
  options?: {
    listingImages?: Array<{
      url: string;
      category?: string | null;
      rank?: number | null;
    }>;
    monthlyPricing?: Array<{
      months: number;
      price: number;
      utilitiesIncluded: boolean;
    }>;
  }
) {
  // Fetch the draft with images
  const draft = await prisma.listingInCreation.findFirst({
    where: {
      id: draftId,
      userId
    },
    include: {
      listingImages: {
        orderBy: { rank: 'asc' }
      }
    }
  });

  if (!draft) {
    throw new Error('Draft not found');
  }

  // Create listing from draft in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the listing with all fields from draft
    const listing = await tx.listing.create({
      data: {
        // Copy all fields from draft, excluding id and timestamps
        title: draft.title || 'Untitled Listing',
        description: draft.description || '',
        status: 'available',
        approvalStatus: 'pendingReview',
        imageSrc: draft.imageSrc,
        category: draft.category,
        roomCount: draft.roomCount || 1,
        bathroomCount: draft.bathroomCount || 1,
        guestCount: draft.guestCount || draft.roomCount || 1,
        latitude: draft.latitude || 0,
        longitude: draft.longitude || 0,
        locationString: draft.locationString,
        city: draft.city,
        state: draft.state,
        streetAddress1: draft.streetAddress1,
        streetAddress2: draft.streetAddress2,
        postalCode: draft.postalCode,
        userId: draft.userId || userId,
        squareFootage: draft.squareFootage || 0,
        depositSize: draft.depositSize || 0,
        petDeposit: draft.petDeposit || 0,
        petRent: draft.petRent || 0,
        reservationDeposit: draft.reservationDeposit || 0,
        rentDueAtBooking: draft.rentDueAtBooking || 0,
        requireBackgroundCheck: draft.requireBackgroundCheck || false,
        shortestLeaseLength: draft.shortestLeaseLength || 1,
        longestLeaseLength: draft.longestLeaseLength || 12,
        shortestLeasePrice: draft.shortestLeasePrice || 0,
        longestLeasePrice: draft.longestLeasePrice || 0,
        furnished: draft.furnished || false,
        utilitiesIncluded: draft.utilitiesIncluded || false,
        petsAllowed: draft.petsAllowed || false,
        
        // Copy all amenities
        airConditioner: draft.airConditioner || false,
        laundryFacilities: draft.laundryFacilities || false,
        fitnessCenter: draft.fitnessCenter || false,
        elevator: draft.elevator || false,
        wheelchairAccess: draft.wheelchairAccess || false,
        doorman: draft.doorman || false,
        parking: draft.parking || false,
        wifi: draft.wifi || false,
        kitchen: draft.kitchen || false,
        dedicatedWorkspace: draft.dedicatedWorkspace || false,
        hairDryer: draft.hairDryer || false,
        iron: draft.iron || false,
        heater: draft.heater || false,
        hotTub: draft.hotTub || false,
        smokingAllowed: draft.smokingAllowed || false,
        eventsAllowed: draft.eventsAllowed || false,
        privateEntrance: draft.privateEntrance || false,
        security: draft.security || false,
        waterfront: draft.waterfront || false,
        beachfront: draft.beachfront || false,
        mountainView: draft.mountainView || false,
        cityView: draft.cityView || false,
        waterView: draft.waterView || false,
        washerInUnit: draft.washerInUnit || false,
        washerHookup: draft.washerHookup || false,
        washerNotAvailable: draft.washerNotAvailable || false,
        washerInComplex: draft.washerInComplex || false,
        dryerInUnit: draft.dryerInUnit || false,
        dryerHookup: draft.dryerHookup || false,
        dryerNotAvailable: draft.dryerNotAvailable || false,
        dryerInComplex: draft.dryerInComplex || false,
        offStreetParking: draft.offStreetParking || false,
        streetParking: draft.streetParking || false,
        streetParkingFree: draft.streetParkingFree || false,
        coveredParking: draft.coveredParking || false,
        coveredParkingFree: draft.coveredParkingFree || false,
        uncoveredParking: draft.uncoveredParking || false,
        uncoveredParkingFree: draft.uncoveredParkingFree || false,
        garageParking: draft.garageParking || false,
        garageParkingFree: draft.garageParkingFree || false,
        evCharging: draft.evCharging || false,
        allowDogs: draft.allowDogs || false,
        allowCats: draft.allowCats || false,
        gym: draft.gym || false,
        balcony: draft.balcony || false,
        patio: draft.patio || false,
        sunroom: draft.sunroom || false,
        fireplace: draft.fireplace || false,
        firepit: draft.firepit || false,
        pool: draft.pool || false,
        sauna: draft.sauna || false,
        jacuzzi: draft.jacuzzi || false,
        grill: draft.grill || false,
        oven: draft.oven || false,
        stove: draft.stove || false,
        wheelAccessible: draft.wheelAccessible || false,
        fencedInYard: draft.fencedInYard || false,
        secureLobby: draft.secureLobby || false,
        keylessEntry: draft.keylessEntry || false,
        alarmSystem: draft.alarmSystem || false,
        storageShed: draft.storageShed || false,
        gatedEntry: draft.gatedEntry || false,
        smokeDetector: draft.smokeDetector || false,
        carbonMonoxide: draft.carbonMonoxide || false,
        garbageDisposal: draft.garbageDisposal || false,
        dishwasher: draft.dishwasher || false,
        fridge: draft.fridge || false,
        tv: draft.tv || false,
        workstation: draft.workstation || false,
        microwave: draft.microwave || false,
        kitchenEssentials: draft.kitchenEssentials || false,
        linens: draft.linens || false,
        privateBathroom: draft.privateBathroom || false,
      },
    });
    
    // Handle listing images - use provided ones or existing ones from draft
    const imagesToCreate = options?.listingImages && options.listingImages.length > 0 
      ? options.listingImages 
      : draft.listingImages || [];
    
    if (imagesToCreate.length > 0) {
      await tx.listingImage.createMany({
        data: imagesToCreate.map((image: any) => ({
          url: image.url,
          listingId: listing.id,
          category: image.category || null,
          rank: image.rank || null,
        })),
      });
    }
    
    // Create monthly pricing if provided
    if (options?.monthlyPricing && options.monthlyPricing.length > 0) {
      await tx.listingMonthlyPricing.createMany({
        data: options.monthlyPricing.map((pricing: any) => ({
          listingId: listing.id,
          months: pricing.months,
          price: pricing.price || 0,
          utilitiesIncluded: pricing.utilitiesIncluded || false,
        })),
      });
    }
    
    // Delete the draft after successful creation
    await tx.listingInCreation.delete({
      where: { id: draftId }
    });
    
    return listing;
  });

  return result;
}

/**
 * Creates a new listing directly (without using a draft)
 * @param listingData - The listing data to create
 * @param userId - The ID of the user creating the listing
 * @returns The created listing
 */
export async function createListing(listingData: ListingData, userId: string) {
  // Extract listing images and monthly pricing from the data to handle them separately
  const { listingImages, monthlyPricing, ...listingDataWithoutRelations } = listingData;
  
  // Set the userId for the listing
  listingDataWithoutRelations.userId = userId;
  
  // Create the listing in a transaction to ensure all related data is created together
  const result = await prisma.$transaction(async (tx) => {
    // Create the main listing record
    const listing = await tx.listing.create({
      data: {
        ...listingDataWithoutRelations,
        // Set default values for any required fields not provided
        status: listingDataWithoutRelations.status || 'available',
        approvalStatus: 'pendingReview',
        title: listingDataWithoutRelations.title || 'Untitled Listing',
        description: listingDataWithoutRelations.description || '',
        roomCount: listingDataWithoutRelations.roomCount || 1,
        bathroomCount: listingDataWithoutRelations.bathroomCount || 1,
        guestCount: listingDataWithoutRelations.guestCount || 1,
        latitude: listingDataWithoutRelations.latitude || 0,
        longitude: listingDataWithoutRelations.longitude || 0,
      },
    });
    
    // Create listing images if provided
    if (listingImages && listingImages.length > 0) {
      await tx.listingImage.createMany({
        data: listingImages.map((image: any) => ({
          url: image.url,
          listingId: listing.id,
          category: image.category || null,
          rank: image.rank || null,
        })),
      });
    }
    
    // Create monthly pricing if provided
    if (monthlyPricing && monthlyPricing.length > 0) {
      await tx.listingMonthlyPricing.createMany({
        data: monthlyPricing.map((pricing: any) => ({
          listingId: listing.id,
          months: pricing.months,
          price: pricing.price || 0,
          utilitiesIncluded: pricing.utilitiesIncluded || false,
        })),
      });
    }
    
    return listing;
  });

  return result;
}

/**
 * Saves or updates a listing draft
 * @param draftData - The draft data to save
 * @param userId - The ID of the user saving the draft
 * @param draftId - Optional existing draft ID to update
 * @returns The saved/updated draft
 */
export async function saveDraft(draftData: DraftData, userId: string, draftId?: string) {
  // Extract listing images and monthly pricing from the data to handle them separately
  const { listingImages, monthlyPricing, ...draftDataWithoutRelations } = draftData;
  
  // Set the userId for the draft
  draftDataWithoutRelations.userId = userId;
  
  const result = await prisma.$transaction(async (tx) => {
    let draft;
    
    if (draftId) {
      // Update existing draft
      draft = await tx.listingInCreation.update({
        where: { id: draftId },
        data: draftDataWithoutRelations,
      });
      
      // Delete existing images for this draft
      await tx.listingImage.deleteMany({
        where: { listingId: draftId }
      });
    } else {
      // Create new draft
      draft = await tx.listingInCreation.create({
        data: draftDataWithoutRelations,
      });
    }
    
    // Create listing images if provided
    if (listingImages && listingImages.length > 0) {
      await tx.listingImage.createMany({
        data: listingImages.map((image: any) => ({
          url: image.url,
          listingId: draft.id,
          rank: image.rank || null,
        })),
      });
    }
    
    // Handle monthly pricing if provided
    if (monthlyPricing && monthlyPricing.length > 0) {
      // For drafts, we might store pricing in the draft record itself
      // or in a separate table if one exists
      // This depends on your schema structure
    }
    
    return draft;
  });

  return result;
}