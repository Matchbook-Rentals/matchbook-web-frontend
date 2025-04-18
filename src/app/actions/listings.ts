'use server'
//Imports
import prisma from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server'
import { ListingAndImages } from "@/types/";
import { Listing, ListingUnavailability } from "@prisma/client";

const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

export const pullListingsFromDb = async (lat: number, lng: number, radiusMiles: number): Promise<ListingAndImages[]> => {
  const userId = await checkAuth();

  const earthRadiusMiles = 3959; // Earth's radius in miles

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

    // First, get just the listing IDs and distances within the radius
    const listingsWithDistance = await prisma.$queryRaw<{ id: string, distance: number }[]>`
      SELECT l.id,
      (${earthRadiusMiles} * acos(
        cos(radians(${lat})) * cos(radians(l.latitude)) *
        cos(radians(l.longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(l.latitude))
      )) AS distance
      FROM Listing l
      HAVING distance <= ${radiusMiles}
      ORDER BY distance
    `;

    if (listingsWithDistance.length === 0) {
      console.log('No listings found within the specified radius.');
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

    // Combine the distance information with the full listing details
    const listingsWithFullDetails = listings.map(listing => {
      const distance = listingsWithDistance.find(l => l.id === listing.id)?.distance || 0;
      return {
        ...listing,
        distance,
        listingImages: listing.listingImages,
        bedrooms: listing.bedrooms,
        unavailablePeriods: listing.unavailablePeriods
      };
    });

    // Sort by distance (maintaining the original distance-based order)
    listingsWithFullDetails.sort((a, b) => a.distance - b.distance);

    return listingsWithFullDetails;
  } catch (error) {
    console.error('Error in pullListingsFromDb:', error);
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

