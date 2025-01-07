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

    const listingsWithDistanceAndBedrooms = await prisma.$queryRaw<(ListingAndImages & {
      distance: number,
      bedroomId: string | null,
      bedroomNumber: number | null,
      bedType: string | null,
      userId: string,
      userFirstName: string | null,
      userLastName: string | null,
      userFullName: string | null,
      userEmail: string | null,
      userImageUrl: string | null,
      userCreatedAt: Date
    })[]>`
    SELECT l.*, 
    (${earthRadiusMiles} * acos(
      cos(radians(${lat})) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(l.latitude))
    )) AS distance,
    li.id AS imageId, li.url AS imageUrl,
    b.id AS bedroomId, b.bedroomNumber, b.bedType,
    u.id AS userId, u.firstName AS userFirstName, u.lastName AS userLastName, 
    u.fullName AS userFullName, u.email AS userEmail, u.imageUrl AS userImageUrl,
    u.createdAt AS userCreatedAt,
    lu.id AS unavailabilityId, lu.startDate AS unavailabilityStartDate, lu.endDate AS unavailabilityEndDate
    FROM Listing l
    LEFT JOIN ListingImage li ON l.id = li.listingId
    LEFT JOIN Bedroom b ON l.id = b.listing_id
    LEFT JOIN User u ON l.userId = u.id
    LEFT JOIN ListingUnavailability lu ON l.id = lu.listingId
    HAVING distance <= ${radiusMiles}
    ORDER BY distance, l.id, li.id, b.bedroomNumber, lu.startDate
    `;

    if (listingsWithDistanceAndBedrooms.length === 0) {
      console.log('No listings found within the specified radius.');
      return []; // Return an empty array when no listings are found
    }

    // Group listing images, bedrooms, and user with their respective listings
    const groupedListings = listingsWithDistanceAndBedrooms.reduce((acc, curr) => {
      const existingListing = acc.find(l => l.id === curr.id);
      if (existingListing) {
        if (curr.imageId && curr.imageUrl &&
          !existingListing.listingImages.some(img => img.id === curr.imageId)) {
          existingListing.listingImages.push({ id: curr.imageId, url: curr.imageUrl });
        }
        if (curr.bedroomId && curr.bedroomNumber && curr.bedType &&
          !existingListing.bedrooms.some(b => b.id === curr.bedroomId)) {
          existingListing.bedrooms.push({
            id: curr.bedroomId,
            bedroomNumber: curr.bedroomNumber,
            bedType: curr.bedType
          });
        }
        if (curr.unavailabilityId && curr.unavailabilityStartDate && curr.unavailabilityEndDate &&
          !existingListing.unavailablePeriods.some(u => u.id === curr.unavailabilityId)) {
          existingListing.unavailablePeriods.push({
            id: curr.unavailabilityId,
            startDate: curr.unavailabilityStartDate,
            endDate: curr.unavailabilityEndDate
          });
        }
      } else {
        acc.push({
          ...curr,
          listingImages: curr.imageId && curr.imageUrl ? [{ id: curr.imageId, url: curr.imageUrl }] : [],
          bedrooms: curr.bedroomId && curr.bedroomNumber && curr.bedType ? [{
            id: curr.bedroomId,
            bedroomNumber: curr.bedroomNumber,
            bedType: curr.bedType
          }] : [],
          unavailablePeriods: curr.unavailabilityId && curr.unavailabilityStartDate && curr.unavailabilityEndDate ? [{
            id: curr.unavailabilityId,
            startDate: curr.unavailabilityStartDate,
            endDate: curr.unavailabilityEndDate
          }] : [],
          user: {
            id: curr.userId,
            firstName: curr.userFirstName,
            lastName: curr.userLastName,
            fullName: curr.userFullName,
            email: curr.userEmail,
            imageUrl: curr.userImageUrl,
            createdAt: curr.userCreatedAt
          }
        });
      }
      return acc;
    }, [] as (ListingAndImages & {
      distance: number,
      bedrooms: { id: string, bedroomNumber: number, bedType: string }[],
      unavailablePeriods: { id: string, startDate: Date, endDate: Date }[],
      user: {
        id: string,
        firstName: string | null,
        lastName: string | null,
        fullName: string | null,
        email: string | null,
        imageUrl: string | null,
        createdAt: Date
      }
    })[]);

    return groupedListings;
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

