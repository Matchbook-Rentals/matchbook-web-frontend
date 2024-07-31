'use server'
import prisma from "@/lib/prismadb";
import { ListingAndImages } from "@/types/";

export const pullListingsFromDb = async (lat: number, lng: number, radiusMiles: number): Promise<ListingAndImages[]> => {
  'use server';

  const earthRadiusMiles = 3959; // Earth's radius in miles

  try {
    // Input validation
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Invalid latitude. Must be a number between -90 and 90.');
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Invalid longitude. Must be a number between -180 and 180.');
    }
    if (typeof radiusMiles !== 'number' || isNaN(radiusMiles) || radiusMiles <= 0) {
      throw new Error('Invalid radius. Must be a positive number.');
    }

    const listingsWithDistance = await prisma.$queryRaw<(ListingAndImages & { distance: number })[]>`
    SELECT l.*, 
    (${earthRadiusMiles} * acos(
      cos(radians(${lat})) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(l.latitude))
    )) AS distance,
    li.id AS imageId, li.url AS imageUrl
    FROM Listing l
    LEFT JOIN ListingImage li ON l.id = li.listingId
    HAVING distance <= ${radiusMiles}
    ORDER BY distance, l.id, li.id
    `;

    if (listingsWithDistance.length === 0) {
      console.log('No listings found within the specified radius.');
      return []; // Return an empty array when no listings are found
    }

    // Group listing images with their respective listings
    const groupedListings = listingsWithDistance.reduce((acc, curr) => {
      const existingListing = acc.find(l => l.id === curr.id);
      if (existingListing) {
        if (curr.imageId && curr.imageUrl) {
          existingListing.listingImages.push({ id: curr.imageId, url: curr.imageUrl });
        }
      } else {
        acc.push({
          ...curr,
          listingImages: curr.imageId && curr.imageUrl ? [{ id: curr.imageId, url: curr.imageUrl }] : []
        });
      }
      return acc;
    }, [] as (ListingAndImages & { distance: number })[]);

    return groupedListings;
  } catch (error) {
    console.error('Error in pullListingsFromDb:', error);
    throw error; // Re-throw the error for the caller to handle
  }
}