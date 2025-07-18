'use server'
//Imports
import prisma from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server'
import { ListingAndImages } from "@/types/";
import { Listing, ListingUnavailability, Prisma } from "@prisma/client"; // Import Prisma namespace
import { statesInRadiusData } from "@/constants/state-radius-data";
import { isValid } from 'date-fns'; // Import date-fns for validation

const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Core listing search engine that implements comprehensive filtering requirements.
 * 
 * This function applies multiple filter categories including geographic, authentication,
 * approval status, availability, pricing compatibility, and user activity filtering.
 * 
 * For detailed filter requirements documentation, see:
 * docs/pullListingsFromDb-filter-requirements.md
 */
export const pullListingsFromDb = async (
  lat: number,
  lng: number,
  radiusMiles: number,
  state: string,
  startDate: Date, // Add startDate parameter
  endDate: Date    // Add endDate parameter
): Promise<ListingAndImages[]> => {
  const startTime = performance.now();
  console.log(`[${(performance.now() - startTime).toFixed(2)}ms] pullListingsFromDb started with dates: ${startDate?.toISOString()} to ${endDate?.toISOString()}.`);

  const userId = await checkAuth();
  console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Auth check completed.`);

  const earthRadiusMiles = 3959; // Earth's radius in miles
  console.log('STATE', state) // Keep existing state log
  console.log('LatestStart', startDate) // Keep existing state log
  console.log('EarliestEnd', endDate) // Keep existing state log

  try {
    // Input validation
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude. Must be a number between -90 and 90. received ${lat}`);
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude. Must be a number between -180 and 180. received ${lng}`);
    }
    if (typeof radiusMiles !== 'number' || isNaN(radiusMiles) || radiusMiles <= 0) {
      throw new Error(`Invalid radius. Must be a positive number. received ${radiusMiles}`);
    }
    if (typeof state !== 'string' || state.trim().length === 0) {
      throw new Error(`Invalid state. Must be a non-empty string. received ${state}`);
    }
    // Validate dates
    if (!startDate || !isValid(startDate)) {
      throw new Error(`Invalid start date provided.`);
    }
    if (!endDate || !isValid(endDate)) {
      throw new Error(`Invalid end date provided.`);
    }
    if (startDate >= endDate) {
      throw new Error(`Start date must be before end date.`);
    }

    const trimmedState = state.trim().toUpperCase(); // Trim and ensure uppercase for lookup

    // Find the states to include in the search
    const stateRadiusInfo = statesInRadiusData.find(item => item.state === trimmedState);
    const statesToSearch = stateRadiusInfo ? stateRadiusInfo.statesInRadius : [trimmedState]; // Fallback to only the input state if not found
    console.log('STATES TO SEARCH', statesToSearch);

    // Log the states being used for filtering
    console.log(`Filtering listings for states: ${statesToSearch.join(', ')}`);
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Input validation and state lookup completed.`);

    // Calculate trip length in days and months
    const tripLengthDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const tripLengthMonths = Math.ceil(tripLengthDays / 30.44); // Average days per month
    console.log(`Trip length: ${tripLengthDays} days (${tripLengthMonths} months)`);

    // First, filter by states (indexed) and then get listing IDs and distances within the radius
    // Use the raw query for combined state, distance filtering.
    const listingsWithDistance = await prisma.$queryRaw<{ id: string, distance: number }[]>`
      SELECT l.id,
      (${earthRadiusMiles} * acos(
        cos(radians(${lat})) * cos(radians(l.latitude)) *
        cos(radians(l.longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(l.latitude))
      )) AS distance
      FROM Listing l
      WHERE l.state IN (${ Prisma.join(statesToSearch) }) -- Filter by states first
        AND l.approvalStatus = 'approved' -- Only include approved listings
        AND l.markedActiveByUser = true -- Only include listings marked active by host
      HAVING distance <= ${radiusMiles} -- Then filter by distance
      ORDER BY distance
    `;
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Raw query for IDs and distance completed.`);

    if (!listingsWithDistance || listingsWithDistance.length === 0) {
      console.log(`No listings found matching states (${statesToSearch.join(', ')}) and radius criteria.`); // Updated log
      return [];
    }

    // Then fetch full listing details for those IDs
    const listingIds = listingsWithDistance.map(l => l.id);
    const listings = await prisma.listing.findMany({
      where: {
        AND: [ // Combine ID filter, unavailability filter, and monthly pricing filter
          {
            id: {
              in: listingIds
            }
          },
          { // Add condition to exclude listings with overlapping unavailability
            NOT: {
              unavailablePeriods: {
                some: {
                  // An unavailability period overlaps if:
                  // its start is before the desired end AND its end is after the desired start
                  AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } }
                  ]
                }
              }
            }
          },
          { // Add condition to include only listings with compatible monthly pricing
            monthlyPricing: {
              some: {
                months: {
                  gte: tripLengthMonths // Must have pricing for at least the trip length
                }
              }
            }
          }
        ]
      },
      include: {
        listingImages: {
          orderBy: {
            rank: 'asc'
          }
        },
        bedrooms: true,
        unavailablePeriods: true,
        user: true,
        monthlyPricing: true
      }
    });
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Fetched full listing details.`);

    // Combine the distance information with the full listing details
    const listingsWithDistanceMap = new Map(listingsWithDistance.map(l => [l.id, l.distance]));

    const listingsWithFullDetails = listings.map(listing => {
      const distance = listingsWithDistanceMap.get(listing.id) ?? Infinity; // Use Infinity if somehow not found
      return {
        ...listing,
        distance, // Add the distance calculated by the raw query
        listingImages: listing.listingImages,
        bedrooms: listing.bedrooms,
        unavailablePeriods: listing.unavailablePeriods
      };
    });

    // Sort by distance (maintaining the original distance-based order)
    listingsWithFullDetails.sort((a, b) => a.distance - b.distance);
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Data combined and sorted.`);

    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] pullListingsFromDb finished successfully.`);
    return listingsWithFullDetails;
  } catch (error) {
    console.error(`[${(performance.now() - startTime).toFixed(2)}ms] Error in pullListingsFromDb:`, error);
    throw error; // Re-throw the error for the caller to handle
  }
}

export const updateListingTemplate = async (listingId: string, templateId: string) => {
  const userId = await checkAuth();
  return prisma.listing.update({
    where: { id: listingId },
    data: { boldSignTemplateId: templateId },
  });
}

export const updateListing = async (listingId: string, updateData: Partial<Listing>) => {
  const userId = await checkAuth();

  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new Error('Unauthorized to update this listing');
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: updateData,
    });

    return updatedListing;
  } catch (error) {
    console.error('Error in updateListing:', error);
    throw error;
  }
}

/**
 * Update or create monthly pricing data for a listing
 * Handles the ListingMonthlyPricing table as defined in the schema
 */
export const updateListingMonthlyPricing = async (
  listingId: string, 
  monthlyPricingData: Array<{
    months: number;      // Schema: months (Int) - Number of months (1-12)
    price: number;       // Schema: price (Int) - Price for this month length
    utilitiesIncluded: boolean; // Schema: utilitiesIncluded (Boolean) - Whether utilities are included
  }>
) => {
  const userId = await checkAuth();
  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });
    if (!listing) {
      throw new Error('Listing not found');
    }
    if (listing.userId !== userId) {
      throw new Error('Unauthorized to update this listing');
    }

    // Delete existing monthly pricing data for this listing
    await prisma.listingMonthlyPricing.deleteMany({
      where: { listingId: listingId }
    });

    // Create new monthly pricing records
    // Schema: ListingMonthlyPricing has @@unique([listingId, months]) constraint
    const createPromises = monthlyPricingData.map((pricingData) => {
      return prisma.listingMonthlyPricing.create({
        data: {
          listingId: listingId,              // Schema: listingId (String) - Foreign key to Listing
          months: pricingData.months,        // Schema: months (Int) - Number of months (1-12)
          price: pricingData.price,          // Schema: price (Int) - Price for this month length
          utilitiesIncluded: pricingData.utilitiesIncluded, // Schema: utilitiesIncluded (Boolean) - Whether utilities are included
          // Schema: id, createdAt, updatedAt are auto-generated
        }
      });
    });

    await Promise.all(createPromises);

    // Return the updated listing with monthly pricing included
    const updatedListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        monthlyPricing: true // Include the monthly pricing data in the response
      }
    });

    return updatedListing;
  } catch (error) {
    console.error('Error in updateListingMonthlyPricing:', error);
    throw error;
  }
}

/**
 * Fetch a complete listing with all pricing data
 * Used to get the full listing state after pricing updates
 */
export const getListingWithPricing = async (listingId: string) => {
  const userId = await checkAuth();
  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        monthlyPricing: true, // Include monthly pricing data
        listingImages: true,  // Include listing images
        // Add other includes as needed
      }
    });
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    if (listing.userId !== userId) {
      throw new Error('Unauthorized to access this listing');
    }

    return listing;
  } catch (error) {
    console.error('Error in getListingWithPricing:', error);
    throw error;
  }
}

export const updateListingLocation = async (
  listingId: string, 
  locationData: {
    streetAddress1?: string;
    streetAddress2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }
) => {
  const userId = await checkAuth();

  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new Error('Unauthorized to update this listing');
    }

    // Update the listing location and set approval status to pending review
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...locationData,
        approvalStatus: 'pendingReview', // Set to pending review when location changes
      },
      include: {
        listingImages: {
          orderBy: {
            rank: 'asc'
          }
        }
      }
    });

    return updatedListing;
  } catch (error) {
    console.error('Error in updateListingLocation:', error);
    throw error;
  }
}

export const updateListingPhotos = async (listingId: string, photos: Array<{id: string, url: string, category?: string | null, rank?: number | null}>) => {
  const userId = await checkAuth();

  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new Error('Unauthorized to update this listing');
    }

    // Delete existing photos that are not in the new list
    const photoIds = photos.map(p => p.id);
    await prisma.listingImage.deleteMany({
      where: {
        listingId: listingId,
        id: {
          notIn: photoIds
        }
      }
    });

    // Update or create photos with new order
    const updatePromises = photos.map((photo, index) => {
      return prisma.listingImage.upsert({
        where: { id: photo.id },
        update: {
          rank: index + 1,
          category: photo.category,
        },
        create: {
          id: photo.id,
          url: photo.url,
          listingId: listingId,
          category: photo.category,
          rank: index + 1,
        },
      });
    });

    await Promise.all(updatePromises);

    // Return updated listing with photos
    const updatedListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { 
        listingImages: {
          orderBy: {
            rank: 'asc'
          }
        }
      }
    });

    return updatedListing;
  } catch (error) {
    console.error('Error in updateListingPhotos:', error);
    throw error;
  }
}

export const deleteListing = async (listingId: string) => {
  const userId = await checkAuth();

  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new Error('Unauthorized to delete this listing');
    }

    // Delete the listing
    await prisma.listing.delete({
      where: { id: listingId },
    });

    return { success: true, message: 'Listing deleted successfully' };
  } catch (error) {
    console.error('Error in deleteListing:', error);
    throw error;
  }
}

export const addUnavailability = async (listingId: string, startDate: Date, endDate: Date, reason?: string): Promise<ListingUnavailability> => {
  const userId = await checkAuth();

  try {
    // Verify the listing belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing || listing.userId !== userId) {
      throw new Error('Unauthorized to add unavailability to this listing');
    }

    // Create the unavailability period
    const unavailability = await prisma.listingUnavailability.create({
      data: {
        listingId,
        startDate,
        endDate,
        reason: reason || null
      }
    });

    return unavailability;
  } catch (error) {
    console.error('Error in addUnavailability:', error);
    throw error;
  }
}

export const updateUnavailability = async (unavailabilityId: string, startDate: Date, endDate: Date, reason?: string): Promise<ListingUnavailability> => {
  const userId = await checkAuth();

  try {
    // Verify the unavailability period belongs to a listing owned by the authenticated user
    const unavailability = await prisma.listingUnavailability.findUnique({
      where: { id: unavailabilityId },
      include: {
        listing: {
          select: { userId: true }
        }
      }
    });

    if (!unavailability || unavailability.listing.userId !== userId) {
      throw new Error('Unauthorized to update this unavailability period');
    }

    // Update the unavailability period
    const updatedUnavailability = await prisma.listingUnavailability.update({
      where: { id: unavailabilityId },
      data: {
        startDate,
        endDate,
        reason: reason || null
      }
    });

    return updatedUnavailability;
  } catch (error) {
    console.error('Error in updateUnavailability:', error);
    throw error;
  }
}

export const deleteUnavailability = async (unavailabilityId: string): Promise<void> => {
  const userId = await checkAuth();

  try {
    // Verify the unavailability period belongs to a listing owned by the authenticated user
    const unavailability = await prisma.listingUnavailability.findUnique({
      where: { id: unavailabilityId },
      include: {
        listing: {
          select: { userId: true }
        }
      }
    });

    if (!unavailability || unavailability.listing.userId !== userId) {
      throw new Error('Unauthorized to delete this unavailability period');
    }

    // Delete the unavailability period
    await prisma.listingUnavailability.delete({
      where: { id: unavailabilityId }
    });
  } catch (error) {
    console.error('Error in deleteUnavailability:', error);
    throw error;
  }
}

// Fetch a single listing by ID, including images, bedrooms, and unavailablePeriods
export const getListingById = async (listingId: string): Promise<ListingAndImages | null> => {
  const userId = await checkAuth();
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        listingImages: {
          orderBy: {
            rank: 'asc'
          }
        },
        bedrooms: true,
        unavailablePeriods: true,
        user: true,
        monthlyPricing: true,
        matches: {
          include: {
            BoldSignLease: true,
            Lease: true,
            booking: true,
            trip: {
              include: {
                user: true
              }
            }
          }
        },
      },
    });
    if (!listing) return null;
    return {
      ...listing,
      distance: undefined, // Not relevant for single fetch
      listingImages: listing.listingImages,
      bedrooms: listing.bedrooms,
      unavailablePeriods: listing.unavailablePeriods,
    };
  } catch (error) {
    console.error('Error in getListingById:', error);
    throw error;
  }
}

// Get draft listings from ListingInCreation for the current user
export const getUserDraftListings = async () => {
  const userId = await checkAuth();
  try {
    const drafts = await prisma.listingInCreation.findMany({
      where: { 
        userId: userId
      },
      orderBy: {
        lastModified: 'desc' // Get most recently modified first
      }
    });
    
    return drafts;
  } catch (error) {
    console.error('Error in getUserDraftListings:', error);
    throw error;
  }
}

// Get paginated listings for the current host user
export const getHostListings = async (page: number = 1, itemsPerPage: number = 10): Promise<{
  listings: ListingAndImages[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const userId = await checkAuth();
    console.log('Fetching listings for userId:', userId, 'page:', page);
    
    // Calculate pagination
    const skip = (page - 1) * itemsPerPage;
    
    // Get total count
    const totalCount = await prisma.listing.count({
      where: { 
        userId: userId,
        status: { not: "draft" } // Exclude draft listings
      }
    });
    
    // Get paginated listings
    const hostListings = await prisma.listing.findMany({
      where: { 
        userId: userId,
        status: { not: "draft" } // Exclude draft listings
      },
      include: {
        listingImages: {
          orderBy: {
            rank: 'asc'
          }
        },
        bedrooms: true,
        unavailablePeriods: true,
        bookings: true,
        user: true,
        monthlyPricing: true,
        matches: {
          include: {
            BoldSignLease: true,
            Lease: true,
            booking: true,
            trip: {
              include: {
                user: true
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: itemsPerPage
    });
    
    console.log('Found listings:', hostListings.length, 'of total:', totalCount);
    
    const listings = hostListings.map(listing => ({
      ...listing,
      distance: undefined,
      listingImages: listing.listingImages,
      bedrooms: listing.bedrooms,
      unavailablePeriods: listing.unavailablePeriods,
      bookings: listing.bookings,
    }));
    
    return {
      listings,
      totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getHostListings:', error);
    // Return empty results instead of throwing error to prevent page crash
    return {
      listings: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

export const getHostListingsCount = async (): Promise<number> => {
  try {
    const userId = await checkAuth();
    
    const totalCount = await prisma.listing.count({
      where: { 
        userId: userId,
      }
    });
    
    return totalCount;
  } catch (error) {
    console.error('Error in getHostListingsCount:', error);
    return 0;
  }
}

export const updateListingMoveInData = async (
  listingId: string,
  moveInData: {
    moveInPropertyAccess?: string;
    moveInParkingInfo?: string;
    moveInWifiInfo?: string;
    moveInOtherNotes?: string;
  }
) => {
  const userId = await checkAuth();
  
  try {
    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new Error('Unauthorized to update this listing');
    }

    // Update the move-in data
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        moveInPropertyAccess: moveInData.moveInPropertyAccess,
        moveInParkingInfo: moveInData.moveInParkingInfo,
        moveInWifiInfo: moveInData.moveInWifiInfo,
        moveInOtherNotes: moveInData.moveInOtherNotes,
        lastModified: new Date(),
      },
    });

    return { success: true, listing: updatedListing };
  } catch (error) {
    console.error('Error updating move-in data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update move-in data');
  }
}

export const createListingTransaction = async (listingData: any, userId: string) => {
  try {
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
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

