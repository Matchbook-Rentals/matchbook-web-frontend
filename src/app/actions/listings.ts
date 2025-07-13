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

