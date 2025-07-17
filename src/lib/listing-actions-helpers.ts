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
      console.log('💰 [saveDraft] Saving monthly pricing for draft:', draft.id, 'pricing:', monthlyPricing);
      
      // Delete existing monthly pricing for this draft if updating
      if (draftId) {
        await tx.listingMonthlyPricing.deleteMany({
          where: { listingId: draftId }
        });
      }
      
      // Create monthly pricing for the draft
      const pricingData = monthlyPricing.map((pricing: any) => ({
        listingId: draft.id,
        months: pricing.months,
        price: pricing.price || 0,
        utilitiesIncluded: pricing.utilitiesIncluded || false,
      }));
      
      console.log('💰 [saveDraft] Creating pricing records:', pricingData);
      
      await tx.listingMonthlyPricing.createMany({
        data: pricingData,
      });
    }
    
    return draft;
  });

  return result;
}

/**
 * Helper function to handle saving a draft (extracted from add-property-client.tsx)
 * @param draftData - The draft data to save
 * @param userId - The user ID
 * @param draftId - Optional existing draft ID to update
 * @returns The saved draft
 */
export async function handleSaveDraft(draftData: any, userId: string, draftId?: string) {
  // Create final array of photos
  let listingImagesFinal = [...(draftData.listingPhotos || [])].map(photo => ({
    ...photo,
    rank: null
  }));

  // Update ranks for selected photos if any
  if (draftData.selectedPhotos && draftData.selectedPhotos.length > 0) {
    for (let i = 0; i < draftData.selectedPhotos.length; i++) {
      const selectedPhoto = draftData.selectedPhotos[i];
      const photoToUpdate = listingImagesFinal.find(p => p.url === selectedPhoto.url);
      if (photoToUpdate) {
        photoToUpdate.rank = i + 1;
      }
    }
  }

  // Assign ranks to any remaining photos with null ranks
  const maxRank = Math.max(0, ...listingImagesFinal.filter(p => p.rank !== null).map(p => p.rank!));
  let nextRank = maxRank + 1;
  listingImagesFinal.forEach(photo => {
    if (photo.rank === null) {
      photo.rank = nextRank++;
    }
  });

  // Prepare draft data
  const processedDraftData = {
    id: draftId || undefined,
    title: draftData.title || null,
    description: draftData.description || null,
    status: "draft",
    // Location fields
    locationString: draftData.locationString || null,
    latitude: draftData.latitude || null,
    longitude: draftData.longitude || null,
    city: draftData.city || null,
    state: draftData.state || null,
    streetAddress1: draftData.streetAddress1 || null,
    streetAddress2: draftData.streetAddress2 || null,
    postalCode: draftData.postalCode || null,
    // Room details
    roomCount: draftData.roomCount || null,
    bathroomCount: draftData.bathroomCount || null,
    guestCount: draftData.guestCount || null,
    squareFootage: draftData.squareFootage || null,
    // Pricing and deposits
    depositSize: draftData.depositSize !== undefined ? draftData.depositSize : null,
    petDeposit: draftData.petDeposit !== undefined ? draftData.petDeposit : null,
    petRent: draftData.petRent !== undefined ? draftData.petRent : null,
    rentDueAtBooking: draftData.rentDueAtBooking !== undefined ? draftData.rentDueAtBooking : null,
    shortestLeaseLength: draftData.shortestLeaseLength || null,
    longestLeaseLength: draftData.longestLeaseLength || null,
    shortestLeasePrice: null,
    longestLeasePrice: null,
    requireBackgroundCheck: draftData.requireBackgroundCheck !== undefined ? draftData.requireBackgroundCheck : true,
    // Highlights
    category: draftData.category || null,
    petsAllowed: draftData.petsAllowed !== undefined ? draftData.petsAllowed : null,
    furnished: draftData.furnished !== undefined ? draftData.furnished : null,
    // Store images and pricing separately
    listingImages: listingImagesFinal.map((photo, index) => ({
      url: photo.url,
      rank: photo.rank || index
    })),
    monthlyPricing: draftData.monthlyPricing || []
  };
  
  // Process amenities from the array to set the proper boolean values
  if (draftData.amenities && draftData.amenities.length > 0) {
    draftData.amenities.forEach(amenity => {
      processedDraftData[amenity] = true;
    });
  }
  
  // When updating existing draft, we need to explicitly clear old amenities
  // This mirrors the behavior in the original add-property-client.tsx
  if (draftId && draftData.amenities) {
    // List of all possible amenities that could be cleared
    const allAmenities = [
      'kitchen', 'wifi', 'airConditioner', 'washerInUnit', 'washerInComplex', 'washerNotAvailable',
      'dryerInUnit', 'dryerInComplex', 'dryerNotAvailable', 'parking', 'balcony', 'cityView',
      'pool', 'gym', 'elevator', 'doorman', 'security', 'fitnessCenter', 'laundryFacilities',
      'wheelchairAccess', 'hotTub', 'smokingAllowed', 'eventsAllowed', 'dedicatedWorkspace',
      'hairDryer', 'iron', 'heater', 'dishwasher', 'privateBathroom', 'privateEntrance',
      'waterfront', 'beachfront', 'mountainView', 'waterView', 'offStreetParking',
      'streetParking', 'streetParkingFree', 'coveredParking', 'coveredParkingFree',
      'uncoveredParking', 'uncoveredParkingFree', 'garageParking', 'garageParkingFree',
      'evCharging', 'allowDogs', 'allowCats', 'patio', 'sunroom', 'fireplace', 'firepit',
      'sauna', 'jacuzzi', 'grill', 'oven', 'stove', 'fridge', 'microwave', 'garbageDisposal',
      'kitchenEssentials', 'linens', 'wheelAccessible', 'fencedInYard', 'alarmSystem',
      'storageShed', 'gatedEntry', 'smokeDetector', 'carbonMonoxide', 'keylessEntry',
      'secureLobby', 'tv', 'workstation'
    ];
    
    // Clear all amenities that are not in the new amenities list
    allAmenities.forEach(amenity => {
      if (!draftData.amenities.includes(amenity)) {
        processedDraftData[amenity] = null;
      }
    });
  }

  // Use the saveDraft helper function
  return await saveDraft(processedDraftData, userId, draftId);
}

/**
 * Helper function to handle submitting a listing (extracted from add-property-client.tsx)
 * @param listingData - The listing data to submit
 * @param userId - The user ID
 * @param draftId - Optional draft ID if submitting from draft
 * @returns The created listing
 */
export async function handleSubmitListing(listingData: any, userId: string, draftId?: string) {
  // Create final array of photos and sort them by rank
  let listingImagesFinal = [...(listingData.listingPhotos || [])].map(photo => ({
    ...photo,
    rank: null
  }));

  // Update ranks for selected photos
  if (listingData.selectedPhotos && listingData.selectedPhotos.length > 0) {
    for (let i = 0; i < listingData.selectedPhotos.length; i++) {
      const selectedPhoto = listingData.selectedPhotos[i];
      const photoToUpdate = listingImagesFinal.find(p => p.url === selectedPhoto.url);
      if (photoToUpdate) {
        photoToUpdate.rank = i + 1;
      }
    }
  }

  // Assign ranks to any remaining photos with null ranks
  const maxRank = Math.max(0, ...listingImagesFinal.filter(p => p.rank !== null).map(p => p.rank!));
  let nextRank = maxRank + 1;
  listingImagesFinal.forEach(photo => {
    if (photo.rank === null) {
      photo.rank = nextRank++;
    }
  });

  // Sort photos: ranked photos first (in ascending order), then unranked photos
  listingImagesFinal.sort((a, b) => {
    if (a.rank === null && b.rank === null) return 0;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  // Prepare listing data
  const finalListing = {
    title: listingData.title,
    description: listingData.description,
    status: "available",
    listingImages: listingImagesFinal.map((photo) => ({
      url: photo.url,
      rank: photo.rank
    })),
    // Location fields
    locationString: listingData.locationString,
    latitude: listingData.latitude,
    longitude: listingData.longitude,
    city: listingData.city,
    state: listingData.state,
    streetAddress1: listingData.streetAddress1,
    streetAddress2: listingData.streetAddress2,
    postalCode: listingData.postalCode,
    // Property details
    category: listingData.category,
    petsAllowed: listingData.petsAllowed || false,
    furnished: listingData.furnished || false,
    roomCount: listingData.roomCount || 1,
    bathroomCount: listingData.bathroomCount || 1,
    guestCount: listingData.guestCount || 1,
    squareFootage: listingData.squareFootage || 0,
    depositSize: listingData.depositSize || 0,
    petDeposit: listingData.petDeposit || 0,
    petRent: listingData.petRent || 0,
    rentDueAtBooking: listingData.rentDueAtBooking || 0,
    shortestLeaseLength: listingData.shortestLeaseLength || 1,
    longestLeaseLength: listingData.longestLeaseLength || 12,
    shortestLeasePrice: 0,
    longestLeasePrice: 0,
    monthlyPricing: listingData.monthlyPricing || [],
    requireBackgroundCheck: true,
  };

  // Process amenities from the array to set the proper boolean values
  if (listingData.amenities && listingData.amenities.length > 0) {
    listingData.amenities.forEach(amenity => {
      finalListing[amenity] = true;
    });
  }
  
  // If we have a draftId, submit the draft to create a listing
  // Otherwise, create a new listing directly
  if (draftId) {
    return await createListingFromDraft(draftId, userId, {
      listingImages: listingImagesFinal.map((photo) => ({
        url: photo.url,
        rank: photo.rank
      })),
      monthlyPricing: listingData.monthlyPricing || []
    });
  } else {
    return await createListing(finalListing, userId);
  }
}

/**
 * Helper function to load and transform draft data (extracted from add-property-client.tsx)
 * @param draftId - The ID of the draft to load
 * @returns Transformed draft data in add-property-client format
 */
/**
 * Helper function to initialize form field defaults
 */
export function initializeFormDefaults() {
  return {
    title: "",
    description: "",
    category: "Single Family",
    petsAllowed: true,
    furnished: true,
    locationString: null,
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    streetAddress1: null,
    streetAddress2: null,
    postalCode: null,
    country: "United States",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 1,
    squareFootage: null,
    depositSize: null,
    petDeposit: null,
    petRent: null,
    rentDueAtBooking: null,
    shortestLeaseLength: 1,
    longestLeaseLength: 12,
    listingPhotos: [],
    selectedPhotos: [],
    amenities: [],
    monthlyPricing: []
  };
}

/**
 * Helper function to initialize highlights from draft data
 */
export function initializeHighlights(draftData?: any) {
  if (draftData) {
    return {
      category: draftData.category || "Single Family",
      petsAllowed: draftData.petsAllowed !== null && draftData.petsAllowed !== undefined ? draftData.petsAllowed : true,
      furnished: draftData.furnished !== null && draftData.furnished !== undefined ? draftData.furnished : true
    };
  }
  return { category: "Single Family", petsAllowed: true, furnished: true };
}

/**
 * Helper function to initialize location from draft data
 */
export function initializeLocation(draftData?: any) {
  if (draftData) {
    return {
      locationString: draftData.locationString || null,
      latitude: draftData.latitude || null,
      longitude: draftData.longitude || null,
      city: draftData.city || null,
      state: draftData.state || null,
      streetAddress1: draftData.streetAddress1 || null,
      streetAddress2: draftData.streetAddress2 || null,
      postalCode: draftData.postalCode || null,
      country: "United States"
    };
  }
  return {
    locationString: null,
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    streetAddress1: null,
    streetAddress2: null,
    postalCode: null,
    country: "United States"
  };
}

/**
 * Helper function to initialize room details from draft data
 */
export function initializeRooms(draftData?: any) {
  if (draftData) {
    return {
      roomCount: draftData.roomCount || 1,
      bathroomCount: draftData.bathroomCount || 1,
      guestCount: draftData.guestCount || 1,
      squareFootage: draftData.squareFootage || null
    };
  }
  return {
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 1,
    squareFootage: null
  };
}

/**
 * Helper function to initialize pricing from draft data
 */
export function initializePricing(draftData?: any) {
  if (draftData) {
    return {
      depositSize: draftData.depositSize !== null ? draftData.depositSize : null,
      petDeposit: draftData.petDeposit !== null ? draftData.petDeposit : null,
      petRent: draftData.petRent !== null ? draftData.petRent : null,
      rentDueAtBooking: draftData.rentDueAtBooking !== null ? draftData.rentDueAtBooking : null,
      shortestLeaseLength: draftData.shortestLeaseLength || 1,
      longestLeaseLength: draftData.longestLeaseLength || 12
    };
  }
  return {
    depositSize: null,
    petDeposit: null,
    petRent: null,
    rentDueAtBooking: null,
    shortestLeaseLength: 1,
    longestLeaseLength: 12
  };
}

/**
 * Helper function to initialize photos from draft data
 */
export function initializePhotos(draftData?: any) {
  if (draftData) {
    const listingPhotos = draftData.listingPhotos || [];
    const selectedPhotos = draftData.selectedPhotos || [];
    
    // Ensure selectedPhotos are properly filtered and sorted by rank
    const validSelectedPhotos = selectedPhotos
      .filter((photo: any) => photo.url && photo.rank !== null && photo.rank !== undefined)
      .sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0));
    
    return {
      listingPhotos,
      selectedPhotos: validSelectedPhotos
    };
  }
  return {
    listingPhotos: [],
    selectedPhotos: []
  };
}

/**
 * Helper function to initialize amenities from draft data
 */
export function initializeAmenities(draftData?: any) {
  if (draftData) {
    return draftData.amenities || [];
  }
  return [];
}

/**
 * Helper function to initialize monthly pricing from draft data
 */
export function initializeMonthlyPricing(draftData?: any) {
  if (draftData) {
    return draftData.monthlyPricing || [];
  }
  return [];
}

/**
 * Helper function to initialize basic info from draft data
 */
export function initializeBasicInfo(draftData?: any) {
  if (draftData) {
    return {
      title: draftData.title || "",
      description: draftData.description || ""
    };
  }
  return {
    title: "",
    description: ""
  };
}

/**
 * Helper function to transform component state into draft data format
 * @param componentState - The component state object containing all form data
 * @returns Transformed draft data ready for API submission
 */
export function transformComponentStateToDraftData(componentState: {
  listingBasics: { title: string; description: string };
  listingLocation: {
    locationString: string | null;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state: string | null;
    streetAddress1: string | null;
    streetAddress2: string | null;
    postalCode: string | null;
  };
  listingRooms: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: string;
  };
  listingPricing: {
    deposit: string;
    petDeposit: string;
    petRent: string;
    rentDueAtBooking: string;
    shortestStay: number;
    longestStay: number;
    monthlyPricing: Array<{
      months: number;
      price: string;
      utilitiesIncluded: boolean;
    }>;
  };
  listingHighlights: {
    category: string;
    petsAllowed: boolean;
    furnished: boolean;
  };
  listingPhotos: any[];
  selectedPhotos: any[];
  listingAmenities: string[];
}) {
  return {
    title: componentState.listingBasics.title,
    description: componentState.listingBasics.description,
    status: "draft",
    // Location fields
    locationString: componentState.listingLocation.locationString,
    latitude: componentState.listingLocation.latitude,
    longitude: componentState.listingLocation.longitude,
    city: componentState.listingLocation.city,
    state: componentState.listingLocation.state,
    streetAddress1: componentState.listingLocation.streetAddress1,
    streetAddress2: componentState.listingLocation.streetAddress2,
    postalCode: componentState.listingLocation.postalCode,
    // Room details
    roomCount: componentState.listingRooms.bedrooms,
    bathroomCount: componentState.listingRooms.bathrooms,
    guestCount: componentState.listingRooms.bedrooms,
    squareFootage: componentState.listingRooms.squareFeet ? Number(componentState.listingRooms.squareFeet) : null,
    // Pricing and deposits
    depositSize: componentState.listingPricing.deposit ? Number(componentState.listingPricing.deposit) : null,
    petDeposit: componentState.listingPricing.petDeposit ? Number(componentState.listingPricing.petDeposit) : null,
    petRent: componentState.listingPricing.petRent ? Number(componentState.listingPricing.petRent) : null,
    rentDueAtBooking: componentState.listingPricing.rentDueAtBooking ? Number(componentState.listingPricing.rentDueAtBooking) : null,
    shortestLeaseLength: componentState.listingPricing.shortestStay,
    longestLeaseLength: componentState.listingPricing.longestStay,
    requireBackgroundCheck: true,
    // Highlights
    category: componentState.listingHighlights.category,
    petsAllowed: componentState.listingHighlights.petsAllowed,
    furnished: componentState.listingHighlights.furnished,
    // Photos and pricing
    listingPhotos: componentState.listingPhotos,
    selectedPhotos: componentState.selectedPhotos,
    amenities: componentState.listingAmenities,
    monthlyPricing: componentState.listingPricing.monthlyPricing.map(p => ({
      months: p.months,
      price: p.price ? Number(p.price) : 0,
      utilitiesIncluded: p.utilitiesIncluded
    }))
  };
}

/**
 * Helper function to save draft data via API
 * @param draftData - The draft data to save
 * @returns Promise resolving to the saved draft response
 */
export async function saveDraftViaAPI(draftData: any): Promise<any> {
  const response = await fetch('/api/listings/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draftData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save listing draft');
  }
  
  return await response.json();
}

/**
 * Helper function to handle the complete save and exit flow
 * @param componentState - The component state containing all form data
 * @param callbacks - Optional callbacks for success/error handling
 * @returns Promise resolving to the saved draft
 */
export async function handleSaveAndExit(
  componentState: {
    listingBasics: { title: string; description: string };
    listingLocation: {
      locationString: string | null;
      latitude: number | null;
      longitude: number | null;
      city: string | null;
      state: string | null;
      streetAddress1: string | null;
      streetAddress2: string | null;
      postalCode: string | null;
    };
    listingRooms: {
      bedrooms: number;
      bathrooms: number;
      squareFeet: string;
    };
    listingPricing: {
      deposit: string;
      petDeposit: string;
      petRent: string;
      rentDueAtBooking: string;
      shortestStay: number;
      longestStay: number;
      monthlyPricing: Array<{
        months: number;
        price: string;
        utilitiesIncluded: boolean;
      }>;
    };
    listingHighlights: {
      category: string;
      petsAllowed: boolean;
      furnished: boolean;
    };
    listingPhotos: any[];
    selectedPhotos: any[];
    listingAmenities: string[];
  },
  callbacks?: {
    onSuccess?: (savedDraft: any) => void;
    onError?: (error: Error) => void;
  }
): Promise<any> {
  // Transform component state to draft data format
  const draftData = transformComponentStateToDraftData(componentState);
  
  // Save via API
  try {
    const savedDraft = await saveDraftViaAPI(draftData);
    
    // Call success callback if provided
    if (callbacks?.onSuccess) {
      callbacks.onSuccess(savedDraft);
    }
    
    return savedDraft;
  } catch (error) {
    // Call error callback if provided
    if (callbacks?.onError) {
      callbacks.onError(error as Error);
    }
    
    throw error;
  }
}

export async function loadDraftData(draftId: string) {
  // Fetch draft from the database using the existing helper
  const draftListing = await prisma.listingInCreation.findFirst({
    where: { id: draftId },
    include: {
      listingImages: {
        orderBy: { rank: 'asc' }
      },
      monthlyPricing: {
        orderBy: { months: 'asc' }
      }
    }
  });

  if (!draftListing) {
    throw new Error('Draft not found');
  }
  
  console.log('🔍 [loadDraftData] Raw draftListing data:', {
    id: draftListing.id,
    city: draftListing.city,
    state: draftListing.state,
    streetAddress1: draftListing.streetAddress1,
    category: draftListing.category,
    title: draftListing.title,
    listingImages: draftListing.listingImages
  });


  // Transform the database format to add-property-client format
  const transformedData = {
    // Basic info
    title: draftListing.title || "",
    description: draftListing.description || "",
    
    // Highlights
    category: draftListing.category,
    petsAllowed: draftListing.petsAllowed || false,
    furnished: draftListing.furnished || false,
    
    // Location
    locationString: draftListing.locationString || null,
    latitude: draftListing.latitude || null,
    longitude: draftListing.longitude || null,
    city: draftListing.city || null,
    state: draftListing.state || null,
    streetAddress1: draftListing.streetAddress1 || null,
    streetAddress2: draftListing.streetAddress2 || null,
    postalCode: draftListing.postalCode || null,
    country: "United States",
    
    // Rooms
    roomCount: draftListing.roomCount || 1,
    bathroomCount: draftListing.bathroomCount || 1,
    guestCount: draftListing.guestCount || 1,
    squareFootage: draftListing.squareFootage || null,
    
    // Pricing and deposits
    depositSize: draftListing.depositSize !== null ? draftListing.depositSize : null,
    petDeposit: draftListing.petDeposit !== null ? draftListing.petDeposit : null,
    petRent: draftListing.petRent !== null ? draftListing.petRent : null,
    rentDueAtBooking: draftListing.rentDueAtBooking !== null ? draftListing.rentDueAtBooking : null,
    shortestLeaseLength: draftListing.shortestLeaseLength || 1,
    longestLeaseLength: draftListing.longestLeaseLength || 12,
    
    // Photos
    listingPhotos: [] as any[],
    selectedPhotos: [] as any[],
    
    // Amenities (convert boolean fields back to array)
    amenities: [] as string[],
    
    // Monthly pricing
    monthlyPricing: [] as any[]
  };

  // Process photos from draft if they exist
  if (draftListing.listingImages && Array.isArray(draftListing.listingImages)) {
    const loadedPhotos = draftListing.listingImages.map((image: any) => ({
      id: image.id,
      url: image.url,
      listingId: image.listingId,
      category: image.category,
      rank: image.rank,
    }));
    
    transformedData.listingPhotos = loadedPhotos;
    
    // Extract selected photos (ranks 1-4) and sort by rank
    const selectedFromDraft = loadedPhotos
      .filter(photo => photo.rank && photo.rank >= 1 && photo.rank <= 4)
      .sort((a, b) => a.rank! - b.rank!);
    transformedData.selectedPhotos = selectedFromDraft;
  }

  // Process amenities (convert boolean fields back to array format)
  const amenities: string[] = [];
  Object.entries(draftListing).forEach(([key, value]) => {
    if (value === true && 
        key !== 'furnished' && 
        key !== 'petsAllowed' && 
        key !== 'requireBackgroundCheck' && 
        key !== 'varyPricingByLength' && 
        key !== 'isApproved') {
      amenities.push(key);
    }
  });
  transformedData.amenities = amenities.sort(); // Sort for consistent ordering

  // Process monthly pricing
  const shortestStay = draftListing.shortestLeaseLength || 1;
  const longestStay = draftListing.longestLeaseLength || 12;
  
  // Use the included monthlyPricing relationship
  console.log('💰 [loadDraftData] Using included monthlyPricing from draftListing:', draftListing.monthlyPricing);
  
  let monthlyPricing: any[] = [];
  
  if (draftListing.monthlyPricing && draftListing.monthlyPricing.length > 0) {
    // Use saved pricing data from the relationship
    monthlyPricing = draftListing.monthlyPricing.map((p: any) => {
      console.log('💰 [loadDraftData] Processing pricing item:', p, 'price value:', p.price, 'type:', typeof p.price);
      return {
        months: p.months,
        price: p.price, // Don't use || 0 since price could legitimately be 0
        utilitiesIncluded: p.utilitiesIncluded || false
      };
    });
    console.log('💰 [loadDraftData] Final monthlyPricing:', monthlyPricing);
  } else {
    console.log('💰 [loadDraftData] No saved pricing found, creating default pricing for range:', shortestStay, 'to', longestStay);
    // Initialize empty pricing for each month in range
    for (let i = shortestStay; i <= longestStay; i++) {
      monthlyPricing.push({
        months: i,
        price: 0,
        utilitiesIncluded: false
      });
    }
  }
  
  transformedData.monthlyPricing = monthlyPricing;


  return transformedData;
}
