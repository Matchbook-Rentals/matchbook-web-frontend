// Note: Prisma operations have been moved to server actions in @/app/actions/listings.ts and @/app/actions/listings-in-creation.ts
import { getDraftWithImages, createListingFromDraftTransaction, saveDraftTransaction, getDraftDataWithRelations } from '@/app/actions/listings-in-creation';
import { createListingTransaction } from '@/app/actions/listings';

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
  return await createListingFromDraftTransaction(draftId, userId, options);
}

/**
 * Creates a new listing directly (without using a draft)
 * @param listingData - The listing data to create
 * @param userId - The ID of the user creating the listing
 * @returns The created listing
 */
export async function createListing(listingData: ListingData, userId: string) {
  return await createListingTransaction(listingData, userId);
}

/**
 * Saves or updates a listing draft
 * @param draftData - The draft data to save
 * @param userId - The ID of the user saving the draft
 * @param draftId - Optional existing draft ID to update
 * @returns The saved/updated draft
 */
export async function saveDraft(draftData: DraftData, userId: string, draftId?: string) {
  return await saveDraftTransaction(draftData, userId, draftId);
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
  const result: any = {
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
    // Monthly pricing
    monthlyPricing: componentState.listingPricing.monthlyPricing.map(p => ({
      months: p.months,
      price: p.price ? Number(p.price) : 0,
      utilitiesIncluded: p.utilitiesIncluded
    }))
  };
  
  // Process amenities from the array to set the proper boolean values
  if (componentState.listingAmenities && componentState.listingAmenities.length > 0) {
    componentState.listingAmenities.forEach(amenity => {
      result[amenity] = true;
    });
  }
  
  return result;
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
  // Fetch draft from the database using the server action
  const draftListing = await getDraftDataWithRelations(draftId);

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

// Types for validation functions
export interface ListingHighlights {
  category: string | null;
  petsAllowed: boolean | null;
  furnished: boolean | null;
}

export interface ListingLocation {
  locationString: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  streetAddress1: string | null;
  streetAddress2: string | null;
  postalCode: string | null;
  country?: string | null;
}

export interface ListingRooms {
  bedrooms: number;
  bathrooms: number;
  squareFeet: string;
}

export interface ListingBasics {
  title: string;
  description: string;
}

export interface MonthlyPricing {
  months: number;
  price: string;
  utilitiesIncluded: boolean;
}

export interface ListingPricing {
  shortestStay: number;
  longestStay: number;
  monthlyPricing: MonthlyPricing[];
  deposit: string;
  petDeposit: string;
  petRent: string;
  rentDueAtBooking: string;
}

export interface NullableListingImage {
  id: string | null;
  url: string | null;
  listingId: string | null;
  category: string | null;
  rank: number | null;
}

/**
 * Validation Functions
 * These functions validate different sections of the listing creation form
 */

export function validateHighlights(listingHighlights: ListingHighlights): string[] {
  const errors: string[] = [];
  
  if (!listingHighlights.category) {
    errors.push("You must select a property type");
  }
  
  if (listingHighlights.furnished === null) {
    errors.push("You must select a furnishing option");
  }
  
  if (listingHighlights.petsAllowed === null) {
    errors.push("You must specify if pets are allowed");
  }
  
  return errors;
}

export function validateLocation(listingLocation: ListingLocation): string[] {
  const errors: string[] = [];
  
  if (!listingLocation.streetAddress1) {
    errors.push("Street address is required");
  }
  
  if (!listingLocation.city) {
    errors.push("City is required");
  }
  
  if (!listingLocation.state) {
    errors.push("State is required");
  }
  
  if (!listingLocation.postalCode) {
    errors.push("Postal code is required");
  }
  
  return errors;
}

export function validateRooms(listingRooms: ListingRooms): string[] {
  const errors: string[] = [];
  
  if (!listingRooms.bedrooms || listingRooms.bedrooms < 1) {
    errors.push("Number of bedrooms is required");
  }
  
  if (!listingRooms.bathrooms || listingRooms.bathrooms < 1) {
    errors.push("Number of bathrooms is required");
  }
  
  if (!listingRooms.squareFeet) {
    errors.push("Square footage is required");
  }
  
  return errors;
}

export function validateBasics(listingBasics: ListingBasics): string[] {
  const errors: string[] = [];
  
  if (!listingBasics.title) {
    errors.push("Title is required");
  } else if (listingBasics.title.length < 5) {
    errors.push("Title must be at least 5 characters");
  }
  
  if (!listingBasics.description) {
    errors.push("Description is required");
  } else if (listingBasics.description.length < 20) {
    errors.push("Description must be at least 20 characters");
  }
  
  return errors;
}

export function validatePhotos(listingPhotos: NullableListingImage[]): string[] {
  const errors: string[] = [];
  const validPhotos = listingPhotos?.filter(photo => photo.url) || [];
  const validPhotoCount = validPhotos.length;
  
  if (validPhotoCount === 0) {
    errors.push("You must upload at least 4 photos");
  } else if (validPhotoCount < 4) {
    errors.push(`You need to upload ${4 - validPhotoCount} more photo${validPhotoCount === 3 ? '' : 's'} (minimum 4 required)`);
  }
  
  return errors;
}

export function validateFeaturedPhotos(selectedPhotos: NullableListingImage[]): string[] {
  const errors: string[] = [];
  if (!selectedPhotos || selectedPhotos.length !== 4) {
    errors.push("You must select exactly four featured photos.");
  }
  return errors;
}

export function validateAmenities(listingAmenities: string[]): string[] {
  const errors: string[] = [];
  // Laundry options required
  const laundryOptions = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
  const selectedLaundry = listingAmenities?.filter(a => laundryOptions.includes(a)) || [];
  if (selectedLaundry.length !== 1) {
    errors.push("You must select one laundry option (In Unit, In Complex, or No Laundry)");
  }
  return errors;
}

export function validatePricing(listingPricing: ListingPricing): string[] {
  const errors: string[] = [];
  
  // Step 7 validation - check basic settings
  if (listingPricing.shortestStay < 1 || listingPricing.shortestStay > 12) {
    errors.push("Shortest stay must be between 1 and 12 months");
  }
  
  if (listingPricing.longestStay < 1 || listingPricing.longestStay > 12) {
    errors.push("Longest stay must be between 1 and 12 months");
  }
  
  if (listingPricing.shortestStay > listingPricing.longestStay) {
    errors.push("Shortest stay cannot be longer than longest stay");
  }
  
  return errors;
}

export function validateVerifyPricing(listingPricing: ListingPricing): string[] {
  const errors: string[] = [];
  
  console.log('🔍 [validateVerifyPricing] Checking pricing:', {
    monthlyPricing: listingPricing.monthlyPricing,
    totalEntries: listingPricing.monthlyPricing.length
  });
  
  // Check each pricing entry
  const missingPrices: number[] = [];
  const invalidPrices: number[] = [];
  
  listingPricing.monthlyPricing.forEach(p => {
    console.log(`🔍 Month ${p.months}: price="${p.price}", type=${typeof p.price}`);
    
    // Check if price is missing (empty, null, undefined)
    if (p.price === null || p.price === undefined || p.price === '') {
      missingPrices.push(p.months);
      return;
    }
    
    // Convert to number and validate
    const priceAsNumber = parseFloat(p.price);
    if (isNaN(priceAsNumber) || priceAsNumber < 0) {
      invalidPrices.push(p.months);
    }
  });
  
  if (missingPrices.length > 0) {
    console.log('❌ [validateVerifyPricing] Found missing prices for months:', missingPrices);
    errors.push(`Please set prices for all ${listingPricing.monthlyPricing.length} lease lengths`);
  }
  
  if (invalidPrices.length > 0) {
    console.log('❌ [validateVerifyPricing] Found invalid prices for months:', invalidPrices);
    errors.push("All prices must be valid non-negative numbers");
  }
  
  console.log('✅ [validateVerifyPricing] Final errors:', errors);
  return errors;
}

export function validateDeposits(listingPricing: ListingPricing): string[] {
  const errors: string[] = [];
  
  // Validate rent due at booking doesn't exceed lowest monthly rent
  if (listingPricing.rentDueAtBooking && listingPricing.rentDueAtBooking !== '') {
    const rentDueAmount = parseFloat(listingPricing.rentDueAtBooking);
    
    if (!isNaN(rentDueAmount) && rentDueAmount > 0) {
      // Find the lowest monthly rent price from the pricing array
      const validPrices = listingPricing.monthlyPricing
        .filter(p => p.price && p.price !== '' && p.price !== '0')
        .map(p => parseFloat(p.price))
        .filter(price => !isNaN(price) && price > 0);
      
      if (validPrices.length > 0) {
        const lowestPrice = Math.min(...validPrices);
        if (rentDueAmount > lowestPrice) {
          errors.push(`Rent due at booking ($${rentDueAmount}) cannot be higher than the lowest monthly rent ($${lowestPrice})`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate all steps of the listing creation form
 * @param formData - Complete form data
 * @returns Object containing validation errors for each step
 */
export function validateAllSteps(formData: {
  listingHighlights: ListingHighlights;
  listingLocation: ListingLocation;
  listingRooms: ListingRooms;
  listingBasics: ListingBasics;
  listingPhotos: NullableListingImage[];
  selectedPhotos: NullableListingImage[];
  listingAmenities: string[];
  listingPricing: ListingPricing;
}): Record<number, string[]> {
  const allErrors: Record<number, string[]> = {};
  
  // Validate each step
  const highlightErrors = validateHighlights(formData.listingHighlights);
  if (highlightErrors.length > 0) allErrors[0] = highlightErrors;
  
  const locationErrors = validateLocation(formData.listingLocation);
  // Location validation applies to both steps 1 and 2 (input and confirmation)
  if (locationErrors.length > 0) {
    allErrors[1] = locationErrors;
    allErrors[2] = locationErrors;
  }
  
  const roomsErrors = validateRooms(formData.listingRooms);
  if (roomsErrors.length > 0) allErrors[3] = roomsErrors;
  
  const basicsErrors = validateBasics(formData.listingBasics);
  if (basicsErrors.length > 0) allErrors[4] = basicsErrors;
  
  const photosErrors = validatePhotos(formData.listingPhotos);
  if (photosErrors.length > 0) allErrors[5] = photosErrors;
  
  const featuredPhotosErrors = validateFeaturedPhotos(formData.selectedPhotos);
  if (featuredPhotosErrors.length > 0) allErrors[6] = featuredPhotosErrors;
  
  const amenitiesErrors = validateAmenities(formData.listingAmenities);
  if (amenitiesErrors.length > 0) allErrors[7] = amenitiesErrors;
  
  const pricingErrors = validatePricing(formData.listingPricing);
  if (pricingErrors.length > 0) allErrors[8] = pricingErrors;
  
  const verifyPricingErrors = validateVerifyPricing(formData.listingPricing);
  if (verifyPricingErrors.length > 0) allErrors[9] = verifyPricingErrors;
  
  const depositErrors = validateDeposits(formData.listingPricing);
  if (depositErrors.length > 0) allErrors[10] = depositErrors;
  
  return allErrors;
}
