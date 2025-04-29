'use server'
//Imports
import prisma from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server'
import { ListingAndImages } from "@/types/";
import { Listing, ListingUnavailability } from "@prisma/client";

// Data structure for states within ~100 miles radius
const statesInRadiusData = [
  { state: "AL", statesInRadius: ["AL", "FL", "GA", "MS", "TN"] },
  { state: "AK", statesInRadius: ["AK"] }, // Alaska has no land borders with other US states
  { state: "AZ", statesInRadius: ["AZ", "CA", "CO", "NM", "NV", "UT"] },
  { state: "AR", statesInRadius: ["AR", "LA", "MS", "MO", "OK", "TN", "TX"] },
  { state: "CA", statesInRadius: ["CA", "AZ", "NV", "OR"] },
  { state: "CO", statesInRadius: ["CO", "AZ", "KS", "NE", "NM", "OK", "UT", "WY"] },
  { state: "CT", statesInRadius: ["CT", "MA", "NY", "RI"] },
  { state: "DE", statesInRadius: ["DE", "MD", "NJ", "PA"] },
  { state: "FL", statesInRadius: ["FL", "AL", "GA"] },
  { state: "GA", statesInRadius: ["GA", "AL", "FL", "NC", "SC", "TN"] },
  { state: "HI", statesInRadius: ["HI"] }, // Hawaii is an island state
  { state: "ID", statesInRadius: ["ID", "MT", "NV", "OR", "UT", "WA", "WY"] },
  { state: "IL", statesInRadius: ["IL", "IA", "IN", "KY", "MO", "WI"] },
  { state: "IN", statesInRadius: ["IN", "IL", "KY", "MI", "OH"] },
  { state: "IA", statesInRadius: ["IA", "IL", "MN", "MO", "NE", "SD", "WI"] },
  { state: "KS", statesInRadius: ["KS", "CO", "MO", "NE", "OK"] },
  { state: "KY", statesInRadius: ["KY", "IL", "IN", "MO", "OH", "TN", "VA", "WV"] },
  { state: "LA", statesInRadius: ["LA", "AR", "MS", "TX"] },
  { state: "ME", statesInRadius: ["ME", "NH"] }, // Also borders Canada
  { state: "MD", statesInRadius: ["MD", "DE", "PA", "VA", "WV", "DC"] }, // Added DC
  { state: "MA", statesInRadius: ["MA", "CT", "NH", "NY", "RI", "VT"] },
  { state: "MI", statesInRadius: ["MI", "IN", "OH", "WI"] }, // Also borders Canada
  { state: "MN", statesInRadius: ["MN", "IA", "ND", "SD", "WI"] }, // Also borders Canada
  { state: "MS", statesInRadius: ["MS", "AL", "AR", "LA", "TN"] },
  { state: "MO", statesInRadius: ["MO", "AR", "IA", "IL", "KS", "KY", "NE", "OK", "TN"] },
  { state: "MT", statesInRadius: ["MT", "ID", "ND", "SD", "WY"] }, // Also borders Canada
  { state: "NE", statesInRadius: ["NE", "CO", "IA", "KS", "MO", "SD", "WY"] },
  { state: "NV", statesInRadius: ["NV", "AZ", "CA", "ID", "OR", "UT"] },
  { state: "NH", statesInRadius: ["NH", "MA", "ME", "VT"] }, // Also borders Canada
  { state: "NJ", statesInRadius: ["NJ", "DE", "NY", "PA"] },
  { state: "NM", statesInRadius: ["NM", "AZ", "CO", "OK", "TX", "UT"] }, // Also borders Mexico
  { state: "NY", statesInRadius: ["NY", "CT", "MA", "NJ", "PA", "VT", "RI"] }, // Added RI, also borders Canada
  { state: "NC", statesInRadius: ["NC", "GA", "SC", "TN", "VA"] },
  { state: "ND", statesInRadius: ["ND", "MN", "MT", "SD"] }, // Also borders Canada
  { state: "OH", statesInRadius: ["OH", "IN", "KY", "MI", "PA", "WV"] },
  { state: "OK", statesInRadius: ["OK", "AR", "CO", "KS", "MO", "NM", "TX"] },
  { state: "OR", statesInRadius: ["OR", "CA", "ID", "NV", "WA"] },
  { state: "PA", statesInRadius: ["PA", "DE", "MD", "NJ", "NY", "OH", "WV"] },
  { state: "RI", statesInRadius: ["RI", "CT", "MA", "NY"] }, // Added NY (water border)
  { state: "SC", statesInRadius: ["SC", "GA", "NC"] },
  { state: "SD", statesInRadius: ["SD", "IA", "MN", "MT", "ND", "NE", "WY"] },
  { state: "TN", statesInRadius: ["TN", "AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"] },
  { state: "TX", statesInRadius: ["TX", "AR", "LA", "NM", "OK"] }, // Also borders Mexico
  { state: "UT", statesInRadius: ["UT", "AZ", "CO", "ID", "NV", "NM", "WY"] },
  { state: "VT", statesInRadius: ["VT", "MA", "NH", "NY"] }, // Also borders Canada
  { state: "VA", statesInRadius: ["VA", "KY", "MD", "NC", "TN", "WV", "DC"] }, // Added DC
  { state: "WA", statesInRadius: ["WA", "ID", "OR"] }, // Also borders Canada
  { state: "WV", statesInRadius: ["WV", "KY", "MD", "OH", "PA", "VA"] },
  { state: "WI", statesInRadius: ["WI", "IL", "IA", "MI", "MN"] },
  { state: "WY", statesInRadius: ["WY", "CO", "ID", "MT", "NE", "SD", "UT"] },
  { state: "DC", statesInRadius: ["DC", "MD", "VA"] } // Added DC
];

const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

export const pullListingsFromDb = async (lat: number, lng: number, radiusMiles: number, state: string): Promise<ListingAndImages[]> => {
  const startTime = performance.now();
  console.log(`[${(performance.now() - startTime).toFixed(2)}ms] pullListingsFromDb started.`);

  const userId = await checkAuth();
  console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Auth check completed.`);

  const earthRadiusMiles = 3959; // Earth's radius in miles
  console.log('STATE', state) // Keep existing state log

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
    const trimmedState = state.trim().toUpperCase(); // Trim and ensure uppercase for lookup

    // Find the states to include in the search
    const stateRadiusInfo = statesInRadiusData.find(item => item.state === trimmedState);
    const statesToSearch = stateRadiusInfo ? stateRadiusInfo.statesInRadius : [trimmedState]; // Fallback to only the input state if not found

    // Log the states being used for filtering
    console.log(`Filtering listings for states: ${statesToSearch.join(', ')}`);
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Input validation and state lookup completed.`);

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
      HAVING distance <= ${radiusMiles} -- Then filter by distance
      ORDER BY distance
    `;
    console.log(`[${(performance.now() - startTime).toFixed(2)}ms] Raw query for IDs and distance completed.`);


    // Removed the problematic findMany call (comment remains for context)
    // const listingsWithDistance = await prisma.listing.findMany({ ... })


    if (!listingsWithDistance || listingsWithDistance.length === 0) {
      console.log(`No listings found matching states (${statesToSearch.join(', ')}) and radius criteria.`); // Updated log
      return [];
    }

    // Then fetch full listing details for those IDs
    const listingIds = listingsWithDistance.map(l => l.id);
    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: listingIds
        }
      },
      include: {
        listingImages: true,
        bedrooms: true,
        unavailablePeriods: true,
        user: true
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

export const addUnavailability = async (listingId: string, startDate: Date, endDate: Date): Promise<ListingUnavailability> => {
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
        endDate
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
        listingImages: true,
        bedrooms: true,
        unavailablePeriods: true,
        user: true,
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

// Get draft listings (listing creations) for the current user
export const getUserDraftListings = async (): Promise<ListingAndImages[]> => {
  const userId = await checkAuth();
  try {
    const draftListings = await prisma.listing.findMany({
      where: { 
        userId: userId,
        status: "draft"
      },
      include: {
        listingImages: true,
        bedrooms: true,
        unavailablePeriods: true,
        user: true,
      },
      orderBy: {
        lastModified: 'desc' // Get most recently modified first
      }
    });
    
    return draftListings.map(listing => ({
      ...listing,
      distance: undefined,
      listingImages: listing.listingImages,
      bedrooms: listing.bedrooms,
      unavailablePeriods: listing.unavailablePeriods,
    }));
  } catch (error) {
    console.error('Error in getUserDraftListings:', error);
    throw error;
  }
}

