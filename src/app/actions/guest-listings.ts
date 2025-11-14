'use server'

import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { ListingAndImages } from '@/types/';
import { statesInRadiusData } from "@/constants/state-radius-data";
import { calculateLengthOfStay } from '@/lib/calculate-rent';

/**
 * Guest version of pullListingsFromDb that doesn't require authentication
 * Fetches listings for unauthenticated users to browse
 */
export const pullGuestListingsFromDb = async (
  lat: number,
  lng: number,
  radiusMiles: number,
  state: string,
  startDate: Date,
  endDate: Date
): Promise<ListingAndImages[]> => {
  const startTime = performance.now();
  const earthRadiusMiles = 3959; // Earth's radius in miles

  try {
    // Input validation
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude. Must be a number between -90 and 90. received ${lat}`);
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude. Must be a number between -180 and 180. received ${lng}`);
    }
    if (typeof radiusMiles !== 'number' || isNaN(radiusMiles) || radiusMiles <= 0 || radiusMiles > 500) {
      throw new Error(`Invalid radius. Must be a number between 1 and 500 miles. received ${radiusMiles}`);
    }

    const trimmedState = state.trim().toUpperCase(); // Trim and ensure uppercase for lookup

    // Find the states to include in the search (same logic as authenticated version)
    const stateRadiusInfo = statesInRadiusData.find(item => item.state === trimmedState);
    const statesToSearch = stateRadiusInfo && stateRadiusInfo.statesInRadius ? stateRadiusInfo.statesInRadius : [trimmedState]; // Fallback to only the input state if not found

    // Debug logging
    console.log(`[Guest Listings] State: ${trimmedState}, States to search: ${JSON.stringify(statesToSearch)}`);

    // Calculate trip length in days and months (same as authenticated version)
    const tripLengthDays: number = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const tripLengthMonths: number = Math.max(1, Math.floor(tripLengthDays / 30.44));

    // First, filter by states (indexed) and then get listing IDs and distances within the radius
    // Use the same raw query as authenticated version
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
        AND l.deletedAt IS NULL -- Exclude soft-deleted listings
      HAVING distance <= ${radiusMiles} -- Then filter by distance
      ORDER BY distance
      LIMIT 100 -- Limit for guests to prevent abuse
    `;

    if (!listingsWithDistance || listingsWithDistance.length === 0) {
      return [];
    }

    // Then fetch full listing details for those IDs (same filters as authenticated version)
    const listingIds = listingsWithDistance.map(l => l.id);
    const listings = await prisma.listing.findMany({
      where: {
        AND: [ // Combine ID filter, unavailability filter, monthly pricing filter, and soft delete filter
          {
            deletedAt: null // Exclude soft-deleted listings
          },
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
                months: { gte: tripLengthMonths } // >= floored months for inclusivity
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

    // Combine the distance information with the full listing details (same as authenticated version)
    const listingsWithDistanceMap = new Map(listingsWithDistance.map(l => [l.id, l.distance]));

    const listingsWithFullDetails = listings.map(listing => {
      const distance = listingsWithDistanceMap.get(listing.id) || 0;

      // Normalize category to handle inconsistent casing in database
      const normalizedCategory = listing.category
        ? listing.category.toLowerCase().replace(/\s+/g, '')
        : listing.category;

      // Calculate utilities for this specific trip duration and write to deprecated field
      const lengthOfStay = calculateLengthOfStay(startDate, endDate);
      const matchingPricing = listing.monthlyPricing?.find(
        pricing => pricing.months === lengthOfStay.months
      );

      // Use duration-specific utilities with fallback to 1-month policy
      let utilitiesIncluded = false;
      if (matchingPricing?.utilitiesIncluded !== undefined) {
        utilitiesIncluded = matchingPricing.utilitiesIncluded;
      } else {
        const oneMonthPricing = listing.monthlyPricing?.find(pricing => pricing.months === 1);
        utilitiesIncluded = oneMonthPricing?.utilitiesIncluded ?? false;
      }

      return {
        ...listing,
        category: normalizedCategory, // Normalize category format
        utilitiesIncluded, // Set utilities based on trip duration
        distance: Math.round(distance * 100) / 100,
      } as ListingAndImages;
    });

    // Already sorted by distance from the raw query

    console.log(`[Guest Listings] Found ${listingsWithFullDetails.length} listings in ${(performance.now() - startTime).toFixed(2)}ms`);

    return listingsWithFullDetails;
  } catch (error) {
    console.error(`[${(performance.now() - startTime).toFixed(2)}ms] Error in pullGuestListingsFromDb:`, error);
    throw error;
  }
}