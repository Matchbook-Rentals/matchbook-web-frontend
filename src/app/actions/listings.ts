'use server'
//Imports
import prisma from "@/lib/prismadb";
import { checkAuth } from '@/lib/auth-utils';
import { ListingAndImages } from "@/types/";
import { Listing, ListingUnavailability, Prisma } from "@prisma/client"; // Import Prisma namespace
import { statesInRadiusData } from "@/constants/state-radius-data";
import { STATE_CODE_MAPPING } from "@/constants/state-code-mapping";
import { differenceInDays, isValid } from 'date-fns'; // Import date-fns for validation
import { capNumberValue } from '@/lib/number-validation';
import { revalidatePath } from "next/cache";
import { calculateLengthOfStay } from '@/lib/calculate-rent';
import { normalizeCategory, getCategoryDisplay } from '@/constants/enums';

// Types for deletion checking
interface BookingDetail {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
}

interface MatchDetail {
  id: string;
  landlordSignedAt: Date | null;
  tenantSignedAt: Date | null;
  paymentStatus: string | null;
}

interface HousingRequestDetail {
  id: string;
  status: string;
}

interface BlockingReason {
  type: 'activeStays' | 'futureBookings' | 'openMatches' | 'pendingHousingRequests';
  count: number;
  message: string;
  details: (BookingDetail | MatchDetail | HousingRequestDetail)[];
}

interface EntityCounts {
  unavailabilityPeriods: number;
  images: number;
  bedrooms: number;
  monthlyPricing: number;
  dislikes: number;
  maybes: number;
  favorites: number;
  locationChanges: number;
  pdfTemplates: number;
  conversations: number;
  total: number;
}

interface DeletionCheckResult {
  canDelete: boolean;
  blockingReasons: BlockingReason[];
  entityCounts: EntityCounts;
}

interface DeletionResponse {
  success: boolean;
  canDelete: boolean;
  message: string;
  blockingReasons?: BlockingReason[];
  entityCounts?: EntityCounts;
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

    // Resolve state to abbreviation with multiple fallback strategies
    const resolveStateAbbreviation = (stateInput: string): string | null => {
      // 1. Try direct lookup (already a valid state abbreviation like "NY")
      const directMatch = statesInRadiusData.find(item => item.state === stateInput);
      if (directMatch) return stateInput;

      // 2. Try mapping full state name to abbreviation (e.g., "NEW YORK" → "NY")
      const abbreviation = STATE_CODE_MAPPING[stateInput];
      if (abbreviation) {
        const abbreviationMatch = statesInRadiusData.find(item => item.state === abbreviation);
        if (abbreviationMatch) return abbreviation;
      }

      // 3. No valid state found - return null to skip state filtering
      return null;
    };

    const resolvedState = resolveStateAbbreviation(trimmedState);

    // Find the states to include in the search
    let statesToSearch: string[] | null = null;
    if (resolvedState) {
      const stateRadiusInfo = statesInRadiusData.find(item => item.state === resolvedState);
      statesToSearch = stateRadiusInfo ? stateRadiusInfo.statesInRadius : [resolvedState];
    }
    // If resolvedState is null, statesToSearch remains null and we skip state filtering

    // Log the states being used for filtering

    // Calculate trip length in days and months
    const tripLengthDays: number = Math.max(1, differenceInDays(endDate, startDate)); // Accurate days, min 1 to handle short trips
    // Floor months for inclusive min matching (e.g., 1.99 months floors to 1 to match 1-month listings)
    const tripLengthMonths: number = Math.max(1, Math.floor(tripLengthDays / 30.44));

    // Query functions for getting listings with distance calculations
    const queryWithStateInfo = async (states: string[]) => {
      return await prisma.$queryRaw<{ id: string, distance: number }[]>`
        SELECT l.id,
        (${earthRadiusMiles} * acos(
          cos(radians(${lat})) * cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(l.latitude))
        )) AS distance
        FROM Listing l
        WHERE l.state IN (${ Prisma.join(states) }) -- Filter by states first
          AND l.approvalStatus = 'approved' -- Only include approved listings
          AND l.markedActiveByUser = true -- Only include listings marked active by host
          AND l.deletedAt IS NULL -- Exclude soft-deleted listings
        HAVING distance <= ${radiusMiles} -- Then filter by distance
        ORDER BY distance
      `;
    };

    const queryNoStateInfo = async () => {
      return await prisma.$queryRaw<{ id: string, distance: number }[]>`
        SELECT l.id,
        (${earthRadiusMiles} * acos(
          cos(radians(${lat})) * cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(l.latitude))
        )) AS distance
        FROM Listing l
        WHERE l.approvalStatus = 'approved' -- Only include approved listings
          AND l.markedActiveByUser = true -- Only include listings marked active by host
          AND l.deletedAt IS NULL -- Exclude soft-deleted listings
        HAVING distance <= ${radiusMiles} -- Then filter by distance
        ORDER BY distance
      `;
    };

    // Execute the appropriate query based on whether we have valid state information
    const listingsWithDistance = statesToSearch
      ? await queryWithStateInfo(statesToSearch)
      : await queryNoStateInfo();

    if (!listingsWithDistance || listingsWithDistance.length === 0) {
      return [];
    }

    // Then fetch full listing details for those IDs
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
          { // Add condition to exclude listings with overlapping active bookings
            NOT: {
              bookings: {
                some: {
                  AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } },
                    { status: { in: ['reserved', 'pending_payment', 'confirmed', 'active'] } }
                  ]
                }
              }
            }
          },
          { // Add condition to include only listings with compatible monthly pricing
            monthlyPricing: {
              some: {
                months: tripLengthMonths // Exact match on floored trip length in months
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

    // Combine the distance information with the full listing details
    const listingsWithDistanceMap = new Map(listingsWithDistance.map(l => [l.id, l.distance]));

    const listingsWithFullDetails = listings.map(listing => {
      const distance = listingsWithDistanceMap.get(listing.id) ?? Infinity; // Use Infinity if somehow not found

      // Normalize category to PropertyType enum value
      const normalizedCategory = normalizeCategory(listing.category);

      // Calculate utilities for this specific trip duration and write to deprecated field
      const lengthOfStay = calculateLengthOfStay(startDate, endDate);
      const matchingPricing = listing.monthlyPricing?.find(
        pricing => pricing.months === lengthOfStay.months
      );

      // Use duration-specific utilities with fallback to closest month
      let utilitiesIncluded = false;
      if (matchingPricing?.utilitiesIncluded !== undefined) {
        utilitiesIncluded = matchingPricing.utilitiesIncluded;
      } else if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
        const closest = listing.monthlyPricing.reduce((prev, curr) => {
          const prevDiff = Math.abs(prev.months - lengthOfStay.months);
          const currDiff = Math.abs(curr.months - lengthOfStay.months);
          if (currDiff < prevDiff) return curr;
          if (currDiff === prevDiff && curr.months < prev.months) return curr;
          return prev;
        });
        utilitiesIncluded = closest.utilitiesIncluded;
      }

      return {
        ...listing,
        category: normalizedCategory, // Normalize category format
        displayCategory: getCategoryDisplay(normalizedCategory), // Add human-readable display name
        utilitiesIncluded, // Set utilities based on trip duration
        distance, // Add the distance calculated by the raw query
        listingImages: listing.listingImages,
        bedrooms: listing.bedrooms,
        unavailablePeriods: listing.unavailablePeriods
      };
    });

    // Sort by distance (maintaining the original distance-based order)
    listingsWithFullDetails.sort((a, b) => a.distance - b.distance);
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

    // Apply server-side validation to cap numeric values
    const validatedUpdateData = { ...updateData };
    if (validatedUpdateData.squareFootage !== undefined) {
      validatedUpdateData.squareFootage = capNumberValue(validatedUpdateData.squareFootage);
    }
    if (validatedUpdateData.depositSize !== undefined) {
      validatedUpdateData.depositSize = capNumberValue(validatedUpdateData.depositSize);
    }
    if (validatedUpdateData.petDeposit !== undefined) {
      validatedUpdateData.petDeposit = capNumberValue(validatedUpdateData.petDeposit);
    }
    if (validatedUpdateData.petRent !== undefined) {
      validatedUpdateData.petRent = capNumberValue(validatedUpdateData.petRent);
    }
    if (validatedUpdateData.rentDueAtBooking !== undefined) {
      validatedUpdateData.rentDueAtBooking = capNumberValue(validatedUpdateData.rentDueAtBooking);
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: validatedUpdateData,
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
          price: capNumberValue(pricingData.price) || 0,          // Schema: price (Int) - Price for this month length
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

/**
 * TEMPORARY: Simulates listing deletion with comprehensive constraint checking
 * Logs all checks and entities that would be deleted WITHOUT actually deleting
 * Returns ALL blocking reasons for the delete confirmation modal
 *
 * For detailed deletion rules and constraints, see:
 * docs/listing-deletion-constraints.md
 */
export const deleteListing = async (listingId: string, performDelete: boolean = false): Promise<DeletionResponse> => {
  const userId = await checkAuth();

  try {
    console.log(`🔍 DELETE: Starting deletion process for listing ${listingId}`);
    console.log(`👤 User ID: ${userId}`);

    // Fetch the listing to ensure it belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, title: true }
    });

    if (!listing) {
      console.log('❌ DELETE: Listing not found');
      return {
        success: false,
        canDelete: false,
        message: 'Listing not found'
      };
    }

    if (listing.userId !== userId) {
      console.log('❌ DELETE: Unauthorized access attempt');
      return {
        success: false,
        canDelete: false,
        message: 'Unauthorized to delete this listing'
      };
    }

    console.log(`✅ DELETE: Authorization passed for listing "${listing.title}"`);

    // Check for blocking constraints and collect ALL issues
    const deletionResult = await collectAllConstraintIssues(listingId);

    if (deletionResult.canDelete) {
      if (performDelete) {
        console.log('🎉 ACTUAL DELETE: All checks passed - proceeding with soft deletion');

        // Perform soft delete and clean up operational data in transaction
        await prisma.$transaction(async (tx) => {
          // Soft delete the listing (preserves consumer preference data)
          await tx.listing.update({
            where: { id: listingId },
            data: {
              deletedAt: new Date(),
              deletedBy: userId
            }
          });

          // Delete only operational data (preserve consumer behavior data)
          //await tx.listingUnavailability.deleteMany({ where: { listingId } });
          //await tx.listingImage.deleteMany({ where: { listingId } });
          //await tx.listingLocationChange.deleteMany({ where: { listingId } });
          //await tx.pdfTemplate.deleteMany({ where: { listingId } });
          //await tx.conversation.deleteMany({ where: { listingId } });

          // PRESERVE consumer preference data for analytics:
          // - favorites, dislikes, maybes (user preferences)
          // - listingMonthlyPricing (pricing insights)
          // - bedroom configurations (space preferences)
          // - listing amenities (feature preferences in main record)
        });

        console.log('✅ SOFT DELETE: Listing soft deleted successfully');

        return {
          success: true,
          canDelete: true,
          message: 'Listing deleted successfully',
          entityCounts: deletionResult.entityCounts
        };
      } else {
        console.log('✅ CHECK ONLY: Deletion constraints passed - ready for confirmation');

        return {
          success: true,
          canDelete: true,
          message: 'Ready for deletion confirmation',
          entityCounts: deletionResult.entityCounts
        };
      }
    } else {
      console.log('❌ DELETE: Deletion blocked by constraints');
      console.log(`📝 Found ${deletionResult.blockingReasons.length} blocking constraint(s)`);

      return {
        success: true,
        canDelete: false,
        message: 'Listing cannot be deleted due to active constraints',
        blockingReasons: deletionResult.blockingReasons,
        entityCounts: deletionResult.entityCounts
      };
    }
  } catch (error) {
    console.error('❌ DELETE Error:', error);
    return {
      success: false,
      canDelete: false,
      message: `Deletion check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Collects ALL constraint issues without throwing early
 * Returns comprehensive deletion check result
 */
const collectAllConstraintIssues = async (listingId: string): Promise<DeletionCheckResult> => {
  console.log('🔍 DELETE: Checking deletion constraints...');

  const blockingReasons: BlockingReason[] = [];
  const now = new Date();

  // Check for active or future bookings
  console.log('📋 DELETE: Checking bookings...');
  const activeBookings = await prisma.booking.findMany({
    where: {
      listingId,
      AND: [
        {
          status: {
            notIn: ['completed', 'cancelled']
          }
        }
      ]
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true
    }
  });

  console.log(`📊 DELETE: Found ${activeBookings.length} active bookings`);

  if (activeBookings.length > 0) {
    const futureBookings = activeBookings.filter(b => b.startDate > now);
    const currentBookings = activeBookings.filter(b => b.startDate <= now && b.endDate >= now);

    console.log(`📅 DELETE: ${currentBookings.length} current bookings, ${futureBookings.length} future bookings`);

    // Add current stays as blocking reason
    if (currentBookings.length > 0) {
      console.log('❌ DELETE: BLOCKED - Active stays found');
      currentBookings.forEach(booking => {
        console.log(`  📝 Current Booking ${booking.id}: ${booking.status}, ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}`);
      });

      blockingReasons.push({
        type: 'activeStays',
        count: currentBookings.length,
        message: 'Cannot delete listing with active stays. Please wait for current bookings to complete.',
        details: currentBookings
      });
    }

    // Add future bookings as blocking reason
    if (futureBookings.length > 0) {
      console.log('❌ DELETE: BLOCKED - Future bookings found');
      futureBookings.forEach(booking => {
        console.log(`  📝 Future Booking ${booking.id}: ${booking.status}, ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}`);
      });

      blockingReasons.push({
        type: 'futureBookings',
        count: futureBookings.length,
        message: 'Cannot delete listing with future bookings. Please cancel or complete all bookings first.',
        details: futureBookings
      });
    }
  } else {
    console.log('✅ DELETE: No blocking bookings found');
  }

  // Check for open matches
  console.log('🤝 DELETE: Checking matches...');
  const openMatches = await prisma.match.findMany({
    where: {
      listingId,
      OR: [
        { landlordSignedAt: null },
        { tenantSignedAt: null },
        {
          AND: [
            { paymentAuthorizedAt: { not: null } },
            { paymentCapturedAt: null }
          ]
        }
      ]
    },
    select: {
      id: true,
      landlordSignedAt: true,
      tenantSignedAt: true,
      paymentStatus: true
    }
  });

  console.log(`🤝 DELETE: Found ${openMatches.length} open matches`);
  if (openMatches.length > 0) {
    console.log('❌ DELETE: BLOCKED - Open matches found');
    openMatches.forEach(match => {
      console.log(`  📝 Match ${match.id}: landlord signed: ${!!match.landlordSignedAt}, tenant signed: ${!!match.tenantSignedAt}, payment: ${match.paymentStatus}`);
    });

    blockingReasons.push({
      type: 'openMatches',
      count: openMatches.length,
      message: 'Cannot delete listing with approved applications. Please complete the lease signing process or cancel the applications first.',
      details: openMatches
    });
  } else {
    console.log('✅ DELETE: No blocking matches found');
  }

  // Check for pending housing requests
  console.log('🏠 DELETE: Checking housing requests...');
  const pendingRequests = await prisma.housingRequest.findMany({
    where: {
      listingId,
      status: 'pending'
    },
    select: {
      id: true,
      status: true
    }
  });

  console.log(`🏠 DELETE: Found ${pendingRequests.length} pending housing requests`);
  if (pendingRequests.length > 0) {
    console.log('❌ DELETE: BLOCKED - Pending housing requests found');
    pendingRequests.forEach(request => {
      console.log(`  📝 Request ${request.id}: ${request.status}`);
    });

    blockingReasons.push({
      type: 'pendingHousingRequests',
      count: pendingRequests.length,
      message: 'Cannot delete listing with pending housing requests. Please approve or decline all requests first.',
      details: pendingRequests
    });
  } else {
    console.log('✅ DELETE: No blocking housing requests found');
  }

  // Get entity counts
  const entityCounts = await getEntityCounts(listingId);

  const canDelete = blockingReasons.length === 0;

  if (canDelete) {
    console.log('✅ DELETE: All constraint checks passed');
  } else {
    console.log(`❌ DELETE: Found ${blockingReasons.length} blocking constraint(s)`);
  }

  return {
    canDelete,
    blockingReasons,
    entityCounts
  };
}

/**
 * Counts entities that would be deleted
 */
const getEntityCounts = async (listingId: string): Promise<EntityCounts> => {
  console.log('🗑️ DELETE: Counting entities that would be deleted...');

  // Count entities that would be deleted
  const unavailabilityPeriods = await prisma.listingUnavailability.count({ where: { listingId } });
  const images = await prisma.listingImage.count({ where: { listingId } });
  const bedrooms = await prisma.bedroom.count({ where: { listingId } });
  const monthlyPricing = await prisma.listingMonthlyPricing.count({ where: { listingId } });
  const dislikes = await prisma.dislike.count({ where: { listingId } });
  const maybes = await prisma.maybe.count({ where: { listingId } });
  const favorites = await prisma.favorite.count({ where: { listingId } });
  const locationChanges = await prisma.listingLocationChange.count({ where: { listingId } });
  const pdfTemplates = await prisma.pdfTemplate.count({ where: { listingId } });
  const conversations = await prisma.conversation.count({ where: { listingId } });

  const total = unavailabilityPeriods + images + bedrooms + monthlyPricing +
               dislikes + maybes + favorites + locationChanges +
               pdfTemplates + conversations + 1; // +1 for the listing itself

  console.log('📊 DELETE: Entity deletion summary:');
  console.log(`  🚫 Unavailability periods: ${unavailabilityPeriods}`);
  console.log(`  🖼️ Images: ${images}`);
  console.log(`  🛏️ Bedrooms: ${bedrooms}`);
  console.log(`  💰 Monthly pricing: ${monthlyPricing}`);
  console.log(`  👎 Dislikes: ${dislikes}`);
  console.log(`  🤔 Maybes: ${maybes}`);
  console.log(`  ⭐ Favorites: ${favorites}`);
  console.log(`  📍 Location changes: ${locationChanges}`);
  console.log(`  📄 PDF templates: ${pdfTemplates}`);
  console.log(`  💬 Conversations: ${conversations}`);
  console.log(`🔢 DELETE: Total entities that would be deleted: ${total}`);

  return {
    unavailabilityPeriods,
    images,
    bedrooms,
    monthlyPricing,
    dislikes,
    maybes,
    favorites,
    locationChanges,
    pdfTemplates,
    conversations,
    total
  };
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
    
    // Calculate pagination
    const skip = (page - 1) * itemsPerPage;
    
    // Get total count
    const totalCount = await prisma.listing.count({
      where: {
        userId: userId,
        status: { not: "draft" }, // Exclude draft listings
        deletedAt: null // Exclude soft-deleted listings
      }
    });
    
    // Get paginated listings
    const hostListings = await prisma.listing.findMany({
      where: {
        userId: userId,
        status: { not: "draft" }, // Exclude draft listings
        deletedAt: null // Exclude soft-deleted listings
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
        deletedAt: null // Exclude soft-deleted listings
      }
    });

    return totalCount;
  } catch (error) {
    console.error('Error in getHostListingsCount:', error);
    return 0;
  }
}

export const getHostListingsCountForUser = async (userId: string): Promise<number> => {
  try {
    const totalCount = await prisma.listing.count({
      where: {
        userId: userId,
        deletedAt: null
      }
    });
    return totalCount;
  } catch (error) {
    console.error('Error in getHostListingsCountForUser:', error);
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
            price: capNumberValue(pricing.price) || 0,
            utilitiesIncluded: pricing.utilitiesIncluded || false,
          })),
        });
      }
      
      // Delete all user drafts after successful creation
      await tx.listingInCreation.deleteMany({
        where: { userId: userId }
      });

      return listing;
    });

    return result;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

export async function saveLocationChangeHistory(
  listingId: string,
  currentListing: any,
  formData: any,
  changedFields: string[],
  userId?: string
) {
  try {
    // Create the location change record
    await prisma.listingLocationChange.create({
      data: {
        listingId,
        userId,
        // Old values
        oldStreetAddress1: currentListing.streetAddress1,
        oldStreetAddress2: currentListing.streetAddress2,
        oldCity: currentListing.city,
        oldState: currentListing.state,
        oldPostalCode: currentListing.postalCode,
        oldLatitude: currentListing.latitude,
        oldLongitude: currentListing.longitude,
        // New values
        newStreetAddress1: formData.streetAddress1 || currentListing.streetAddress1,
        newStreetAddress2: formData.streetAddress2 || currentListing.streetAddress2,
        newCity: formData.city || currentListing.city,
        newState: formData.state || currentListing.state,
        newPostalCode: formData.postalCode || currentListing.postalCode,
        newLatitude: formData.latitude || currentListing.latitude,
        newLongitude: formData.longitude || currentListing.longitude,
        // Changed fields as JSON array
        changedFields: changedFields,
      },
    });

    console.log('Location change history saved successfully');
  } catch (error) {
    console.error('Error saving location change history:', error);
    // Don't throw error here - we don't want to block the main update if history saving fails
  }
}

export const fetchSoftDeletedListings = async () => {
  try {
    const userId = await checkAuth();

    const softDeletedListings = await prisma.listing.findMany({
      where: {
        userId: userId,
        deletedAt: { not: null }
      },
      select: {
        id: true,
        title: true,
        streetAddress1: true,
        city: true,
        state: true,
        deletedAt: true,
        deletedBy: true
      },
      orderBy: {
        deletedAt: 'desc'
      }
    });

    return { success: true, listings: softDeletedListings };
  } catch (error) {
    console.error("Error fetching soft-deleted listings:", error);
    return { success: false, error: "Failed to fetch soft-deleted listings" };
  }
};

export const restoreSoftDeletedListing = async (listingId: string) => {
  try {
    const userId = await checkAuth();

    const updatedListing = await prisma.listing.update({
      where: {
        id: listingId,
        userId: userId,
        deletedAt: { not: null }
      },
      data: {
        deletedAt: null,
        deletedBy: null
      }
    });

    revalidatePath("/app/host/dashboard");
    revalidatePath("/admin/test/restore-listings");

    return { success: true, listing: updatedListing };
  } catch (error) {
    console.error("Error restoring listing:", error);
    return { success: false, error: "Failed to restore listing" };
  }
};

/**
 * Fetches random active listings for homepage display.
 * No authentication required - public endpoint.
 */
export const getRandomActiveListings = async (count: number = 12): Promise<ListingAndImages[]> => {
  const fetchRandomListingIds = async () => {
    return prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM Listing
      WHERE approvalStatus = 'approved'
        AND markedActiveByUser = true
        AND deletedAt IS NULL
      ORDER BY RAND()
      LIMIT ${count}
    `;
  };

  const fetchListingDetails = async (ids: string[]) => {
    return prisma.listing.findMany({
      where: { id: { in: ids } },
      include: {
        listingImages: { orderBy: { rank: 'asc' }, take: 1 },
        monthlyPricing: true
      }
    });
  };

  const formatListingsForDisplay = (listings: any[]): ListingAndImages[] => {
    return listings.map(listing => ({
      ...listing,
      displayCategory: getCategoryDisplay(normalizeCategory(listing.category))
    }));
  };

  try {
    const randomIds = await fetchRandomListingIds();
    if (randomIds.length === 0) return [];

    const ids = randomIds.map(l => l.id);
    const listings = await fetchListingDetails(ids);

    return formatListingsForDisplay(listings);
  } catch (error) {
    console.error('Error fetching random listings:', error);
    return [];
  }
};

/**
 * Fetches random test listings for development/preview display.
 * Returns recently imported test listings.
 */
export const getRandomTestListings = async (count: number = 12): Promise<ListingAndImages[]> => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        isTestListing: true,
        deletedAt: null,
      },
      include: {
        listingImages: { orderBy: { rank: 'asc' }, take: 1 },
        monthlyPricing: true
      },
      orderBy: { createdAt: 'desc' },
      take: count
    });

    return listings.map(listing => ({
      ...listing,
      displayCategory: getCategoryDisplay(normalizeCategory(listing.category))
    }));
  } catch (error) {
    console.error('Error fetching test listings:', error);
    return [];
  }
};

// December 2025 cutoff for dev environment test listings
const DEV_LISTINGS_CUTOFF = new Date('2025-12-01');

/**
 * Fetches listings by city/state for homepage sections.
 * Filters to test listings created after Dec 2025 for dev environment.
 */
export const getListingsByLocation = async (
  city: string | null,
  state: string | null,
  count: number = 12
): Promise<ListingAndImages[]> => {
  try {
    const whereClause: Prisma.ListingWhereInput = {
      deletedAt: null,
      isTestListing: true,
      createdAt: { gte: DEV_LISTINGS_CUTOFF },
      monthlyPricing: { some: {} }
    };

    if (city) whereClause.city = city;
    if (state) whereClause.state = state;

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        listingImages: { orderBy: { rank: 'asc' }, take: 1 },
        monthlyPricing: true
      },
      orderBy: { createdAt: 'desc' },
      take: count
    });

    return listings.map(listing => ({
      ...listing,
      displayCategory: getCategoryDisplay(normalizeCategory(listing.category))
    }));
  } catch (error) {
    console.error('Error fetching listings by location:', error);
    return [];
  }
};

/**
 * Gets top areas (city/state) by listing count for homepage sections.
 * Returns areas with the most listings, filtered to dev test listings.
 */
export const getPopularListingAreas = async (
  limit: number = 5
): Promise<{ city: string; state: string; count: number; avgLat: number; avgLng: number }[]> => {
  try {
    const result = await prisma.listing.groupBy({
      by: ['city', 'state'],
      where: {
        deletedAt: null,
        isTestListing: true,
        createdAt: { gte: DEV_LISTINGS_CUTOFF },
        city: { not: null },
        monthlyPricing: { some: {} }
      },
      _count: { id: true },
      _avg: { latitude: true, longitude: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    return result
      .filter(r => r.city && r.state && r._avg.latitude != null && r._avg.longitude != null)
      .map(r => ({
        city: r.city as string,
        state: r.state as string,
        count: r._count.id,
        avgLat: r._avg.latitude!,
        avgLng: r._avg.longitude!,
      }));
  } catch (error) {
    console.error('Error fetching popular listing areas:', error);
    return [];
  }
};

/**
 * Fetches listings near a lat/lng coordinate for "near me" section.
 * Uses Haversine formula for distance calculation.
 * Filters match pullListingsFromDb: approved, active, not deleted.
 */
export const getListingsNearLocation = async (
  lat: number,
  lng: number,
  count: number = 12,
  radiusMiles: number = 50
): Promise<ListingAndImages[]> => {
  try {
    const earthRadiusMiles = 3959;

    // Get listing IDs with distance (matches pullListingsFromDb SQL style)
    const listingsWithDistance = await prisma.$queryRaw<{ id: string, distance: number }[]>`
      SELECT l.id,
        (${earthRadiusMiles} * acos(
          cos(radians(${lat})) * cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(l.latitude))
        )) AS distance
      FROM Listing l
      WHERE l.approvalStatus = 'approved'
        AND l.markedActiveByUser = true
        AND l.deletedAt IS NULL
        AND l.latitude != 0
        AND l.longitude != 0
        AND EXISTS (
          SELECT 1 FROM ListingMonthlyPricing lmp
          WHERE lmp.listingId = l.id
        )
      HAVING distance <= ${radiusMiles}
      ORDER BY distance
      LIMIT ${count}
    `;

    const listingIds = listingsWithDistance.map(l => l.id);

    if (listingIds.length === 0) {
      return [];
    }

    // Fetch full listings with images
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      include: { listingImages: { orderBy: { rank: 'asc' } } }
    });

    // Create distance map for sorting
    const distanceMap = new Map(listingsWithDistance.map(l => [l.id, l.distance]));

    // Sort by distance and add displayCategory
    return listings
      .sort((a, b) => (distanceMap.get(a.id) || 0) - (distanceMap.get(b.id) || 0))
      .map(listing => ({
        ...listing,
        listingImages: listing.listingImages || [],
        displayCategory: getCategoryDisplay(normalizeCategory(listing.category))
      }));
  } catch (error) {
    console.error('Error fetching listings near location:', error);
    return [];
  }
};

/**
 * Fetches listings within the given map bounds.
 * Used for dynamic map-based search where listings are fetched as user pans/zooms.
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function getListingsByBounds(bounds: MapBounds): Promise<ListingAndImages[]> {
  try {
    const listingsWithRating = await prisma.$queryRaw<{ id: string; avgRating: number }[]>`
      SELECT l.id,
        COALESCE(AVG(r.rating), 0) AS avgRating
      FROM Listing l
      LEFT JOIN Review r
        ON r.reviewedListingId = l.id
        AND r.reviewType = 'RENTER_TO_LISTING'
        AND r.isPublished = true
      WHERE l.latitude BETWEEN ${bounds.south} AND ${bounds.north}
        AND l.longitude BETWEEN ${bounds.west} AND ${bounds.east}
        AND l.latitude != 0
        AND l.longitude != 0
        AND l.approvalStatus = 'approved'
        AND l.markedActiveByUser = true
        AND l.deletedAt IS NULL
        AND EXISTS (
          SELECT 1 FROM ListingMonthlyPricing lmp
          WHERE lmp.listingId = l.id
        )
      GROUP BY l.id
      ORDER BY avgRating DESC
      LIMIT 100
    `;

    const listingIds = listingsWithRating.map(listing => listing.id);
    if (listingIds.length === 0) {
      return [];
    }

    const listings = await prisma.listing.findMany({
      where: {
        id: { in: listingIds },
      },
      include: {
        listingImages: {
          orderBy: { rank: 'asc' },
          take: 1,
        },
        monthlyPricing: true,
        bedrooms: true,
      },
    });

    const listingById = new Map(listings.map(listing => [listing.id, listing]));
    return listingIds
      .map((id) => listingById.get(id))
      .filter((listing): listing is (typeof listings)[number] => Boolean(listing))
      .map(listing => ({
        ...listing,
        displayCategory: getCategoryDisplay(normalizeCategory(listing.category))
      })) as ListingAndImages[];
  } catch (error) {
    console.error('Error fetching listings by bounds:', error);
    return [];
  }
}
