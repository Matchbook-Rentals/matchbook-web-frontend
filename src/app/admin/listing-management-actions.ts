'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Listing, ListingImage, ListingMonthlyPricing } from '@prisma/client'

const DEFAULT_PAGE_SIZE = 20;

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

export interface DeletionResponse {
  success: boolean;
  canDelete: boolean;
  message: string;
  blockingReasons?: BlockingReason[];
  entityCounts?: EntityCounts;
}

interface GetAllListingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // all, approved, pendingReview, rejected
  active?: string; // all, active, inactive
  showOrphaned?: boolean; // whether to include orphaned listings (listings without users)
}

export interface ListingWithDetails extends Listing {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  listingImages: ListingImage[];
  monthlyPricing: ListingMonthlyPricing[];
}

export async function getAllListings({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search = '',
  status = 'all',
  active = 'all',
  showOrphaned = false
}: GetAllListingsParams = {}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { locationString: { contains: search } },
      { city: { contains: search } },
      { state: { contains: search } },
      { streetAddress1: { contains: search } },
      { 
        user: {
          OR: [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } }
          ]
        }
      }
    ];
  }

  // Status filter
  if (status !== 'all') {
    where.approvalStatus = status;
  }

  // Active filter
  if (active === 'active') {
    where.markedActiveByUser = true;
  } else if (active === 'inactive') {
    where.markedActiveByUser = false;
  }

  // Exclude soft-deleted listings
  where.deletedAt = null;

  const [rawListings, totalCount] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      skip: skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        createdAt: true,
        lastModified: true,
        locationString: true,
        city: true,
        state: true,
        approvalStatus: true,
        isApproved: true,
        markedActiveByUser: true,
        status: true,
        roomCount: true,
        bathroomCount: true,
        category: true,
        userId: true,
        listingImages: {
          take: 1,
          orderBy: {
            rank: 'asc'
          },
          select: {
            url: true
          }
        },
        monthlyPricing: {
          select: {
            months: true,
            price: true,
            utilitiesIncluded: true
          },
          orderBy: {
            months: 'asc'
          }
        }
      },
      orderBy: {
        lastModified: 'desc'
      }
    }),
    prisma.listing.count({ where })
  ]);

  // Fetch user data separately to avoid the orphaned listing error
  const userIds = [...new Set(rawListings.map(l => l.userId))]; // Get unique userIds
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null // Exclude soft-deleted users
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });

  // Create a user lookup map
  const userMap = new Map(users.map(user => [user.id, user]));

  // Combine listings with user data
  const listings = rawListings.map(listing => ({
    ...listing,
    user: userMap.get(listing.userId) || null
  }));

  return { listings, totalCount };
}

export async function getListingDetailsForEdit(listingId: string): Promise<ListingWithDetails | null> {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Fetch listing without user relation to avoid orphaned listing errors
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      listingImages: {
        orderBy: { rank: 'asc' }
      },
      monthlyPricing: {
        orderBy: { months: 'asc' }
      },
      bedrooms: true
    }
  });

  if (!listing) {
    return null;
  }

  // Fetch user data separately if listing exists
  const user = await prisma.user.findUnique({
    where: {
      id: listing.userId,
      deletedAt: null // Exclude soft-deleted users
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });

  // Return listing with user data (or null if orphaned)
  return {
    ...listing,
    user
  } as ListingWithDetails;
}

interface UpdateListingData {
  // Basic info
  title?: string;
  description?: string;
  
  // Location
  locationString?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  
  // Property details
  roomCount?: number;
  bathroomCount?: number;
  squareFootage?: number;
  category?: string;
  
  // Pricing
  depositSize?: number;
  petDeposit?: number;
  petRent?: number;
  rentDueAtBooking?: number;
  shortestLeaseLength?: number;
  longestLeaseLength?: number;
  
  // Features
  furnished?: boolean;
  petsAllowed?: boolean;
  
  // Status
  markedActiveByUser?: boolean;
  approvalStatus?: 'pendingReview' | 'approved' | 'rejected';
  
  // Amenities - we'll handle these dynamically
  [key: string]: any;
}

export async function updateListing(listingId: string, data: UpdateListingData, comment?: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Prepare update data
  const updateData: any = {
    ...data,
    lastModified: new Date()
  };

  // If approval status is being changed, update related fields
  if (data.approvalStatus) {
    updateData.isApproved = data.approvalStatus === 'approved';
    updateData.lastApprovalDecision = new Date();
    if (comment) {
      updateData.lastDecisionComment = comment;
    }
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      listingImages: {
        orderBy: { rank: 'asc' }
      },
      monthlyPricing: {
        orderBy: { months: 'asc' }
      }
    }
  });

  // Revalidate relevant paths
  revalidatePath('/admin/listing-management');
  revalidatePath(`/admin/listing-management/${listingId}`);
  revalidatePath('/admin/listing-approval');
  revalidatePath('/app/host/dashboard');
  
  return listing;
}

export async function updateListingPricing(
  listingId: string, 
  pricingData: Array<{ months: number; price: number; utilitiesIncluded: boolean }>
) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Delete existing pricing
  await prisma.listingMonthlyPricing.deleteMany({
    where: { listingId }
  });

  // Add new pricing
  await prisma.listingMonthlyPricing.createMany({
    data: pricingData.map(pricing => ({
      listingId,
      months: pricing.months,
      price: pricing.price,
      utilitiesIncluded: pricing.utilitiesIncluded
    }))
  });

  // Update listing lastModified
  await prisma.listing.update({
    where: { id: listingId },
    data: { lastModified: new Date() }
  });

  // Revalidate paths
  revalidatePath('/admin/listing-management');
  revalidatePath(`/admin/listing-management/${listingId}`);
  
  return { success: true };
}

export async function toggleListingActive(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { markedActiveByUser: true }
  });

  if (!listing) {
    throw new Error('Listing not found')
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { 
      markedActiveByUser: !listing.markedActiveByUser,
      lastModified: new Date()
    }
  });

  revalidatePath('/admin/listing-management');
  revalidatePath(`/admin/listing-management/${listingId}`);
  
  return updated;
}

export async function approveListing(listingId: string, comment?: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  return updateListing(listingId, { approvalStatus: 'approved' }, comment);
}

export async function bulkUpdateListingStatus(
  listingIds: string[], 
  action: 'activate' | 'deactivate' | 'approve' | 'reject',
  comment?: string
) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const updateData: any = {
    lastModified: new Date()
  };

  switch (action) {
    case 'activate':
      updateData.markedActiveByUser = true;
      break;
    case 'deactivate':
      updateData.markedActiveByUser = false;
      break;
    case 'approve':
      updateData.approvalStatus = 'approved';
      updateData.isApproved = true;
      updateData.lastApprovalDecision = new Date();
      if (comment) updateData.lastDecisionComment = comment;
      break;
    case 'reject':
      updateData.approvalStatus = 'rejected';
      updateData.isApproved = false;
      updateData.lastApprovalDecision = new Date();
      if (comment) updateData.lastDecisionComment = comment;
      break;
  }

  await prisma.listing.updateMany({
    where: {
      id: { in: listingIds }
    },
    data: updateData
  });

  revalidatePath('/admin/listing-management');
  revalidatePath('/admin/listing-approval');
  
  return { success: true, updated: listingIds.length };
}

export async function copyListingToAdmin(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const { userId: adminUserId } = auth()
  if (!adminUserId) {
    throw new Error('Admin user not found')
  }

  // Fetch the original listing with all related data
  const originalListing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      listingImages: {
        orderBy: { rank: 'asc' }
      },
      monthlyPricing: true,
      bedrooms: true,
      unavailablePeriods: true
    }
  })

  if (!originalListing) {
    throw new Error('Listing not found')
  }

  // Use transaction to ensure all data is copied atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create the new listing copy
    const newListing = await tx.listing.create({
      data: {
        // Copy all listing fields except ID, userId, and some metadata
        title: `[ADMIN COPY] ${originalListing.title}`,
        description: originalListing.description,
        category: originalListing.category,
        roomCount: originalListing.roomCount,
        bathroomCount: originalListing.bathroomCount,
        guestCount: originalListing.guestCount,
        latitude: originalListing.latitude,
        longitude: originalListing.longitude,
        locationString: originalListing.locationString,
        city: originalListing.city,
        state: originalListing.state,
        streetAddress1: originalListing.streetAddress1,
        streetAddress2: originalListing.streetAddress2,
        postalCode: originalListing.postalCode,
        squareFootage: originalListing.squareFootage,
        depositSize: originalListing.depositSize,
        petDeposit: originalListing.petDeposit,
        petRent: originalListing.petRent,
        reservationDeposit: originalListing.reservationDeposit,
        rentDueAtBooking: originalListing.rentDueAtBooking,
        requireBackgroundCheck: originalListing.requireBackgroundCheck,
        shortestLeaseLength: originalListing.shortestLeaseLength,
        longestLeaseLength: originalListing.longestLeaseLength,
        shortestLeasePrice: originalListing.shortestLeasePrice,
        longestLeasePrice: originalListing.longestLeasePrice,
        furnished: originalListing.furnished,
        utilitiesIncluded: originalListing.utilitiesIncluded,
        petsAllowed: originalListing.petsAllowed,
        markedActiveByUser: originalListing.markedActiveByUser,
        
        // Copy all amenities
        airConditioner: originalListing.airConditioner,
        laundryFacilities: originalListing.laundryFacilities,
        fitnessCenter: originalListing.fitnessCenter,
        elevator: originalListing.elevator,
        wheelchairAccess: originalListing.wheelchairAccess,
        doorman: originalListing.doorman,
        parking: originalListing.parking,
        wifi: originalListing.wifi,
        kitchen: originalListing.kitchen,
        dedicatedWorkspace: originalListing.dedicatedWorkspace,
        hairDryer: originalListing.hairDryer,
        iron: originalListing.iron,
        heater: originalListing.heater,
        hotTub: originalListing.hotTub,
        smokingAllowed: originalListing.smokingAllowed,
        eventsAllowed: originalListing.eventsAllowed,
        privateEntrance: originalListing.privateEntrance,
        security: originalListing.security,
        waterfront: originalListing.waterfront,
        beachfront: originalListing.beachfront,
        mountainView: originalListing.mountainView,
        cityView: originalListing.cityView,
        waterView: originalListing.waterView,
        
        // Washer and Dryer Options
        washerInUnit: originalListing.washerInUnit,
        washerHookup: originalListing.washerHookup,
        washerNotAvailable: originalListing.washerNotAvailable,
        washerInComplex: originalListing.washerInComplex,
        dryerInUnit: originalListing.dryerInUnit,
        dryerHookup: originalListing.dryerHookup,
        dryerNotAvailable: originalListing.dryerNotAvailable,
        dryerInComplex: originalListing.dryerInComplex,
        
        // Parking Options
        offStreetParking: originalListing.offStreetParking,
        streetParking: originalListing.streetParking,
        streetParkingFree: originalListing.streetParkingFree,
        coveredParking: originalListing.coveredParking,
        coveredParkingFree: originalListing.coveredParkingFree,
        uncoveredParking: originalListing.uncoveredParking,
        uncoveredParkingFree: originalListing.uncoveredParkingFree,
        garageParking: originalListing.garageParking,
        garageParkingFree: originalListing.garageParkingFree,
        evCharging: originalListing.evCharging,
        
        // Pet Policies
        allowDogs: originalListing.allowDogs,
        allowCats: originalListing.allowCats,
        
        // Structural Amenities
        gym: originalListing.gym,
        balcony: originalListing.balcony,
        patio: originalListing.patio,
        sunroom: originalListing.sunroom,
        fireplace: originalListing.fireplace,
        firepit: originalListing.firepit,
        
        // Admin-specific settings
        userId: adminUserId,
        isTestListing: true,
        approvalStatus: 'pendingReview',
        isApproved: false,
        lastDecisionComment: `Admin copy of listing ${listingId} created for troubleshooting purposes`,
        status: 'available'
      }
    })

    // Copy listing images
    if (originalListing.listingImages.length > 0) {
      await tx.listingImage.createMany({
        data: originalListing.listingImages.map(image => ({
          listingId: newListing.id,
          url: image.url,
          category: image.category,
          rank: image.rank
        }))
      })
    }

    // Copy monthly pricing
    if (originalListing.monthlyPricing.length > 0) {
      await tx.listingMonthlyPricing.createMany({
        data: originalListing.monthlyPricing.map(pricing => ({
          listingId: newListing.id,
          months: pricing.months,
          price: pricing.price,
          utilitiesIncluded: pricing.utilitiesIncluded
        }))
      })
    }

    // Copy bedrooms
    if (originalListing.bedrooms.length > 0) {
      await tx.bedroom.createMany({
        data: originalListing.bedrooms.map(bedroom => ({
          listingId: newListing.id,
          bedroomNumber: bedroom.bedroomNumber,
          bedType: bedroom.bedType
        }))
      })
    }

    // Copy unavailability periods
    if (originalListing.unavailablePeriods.length > 0) {
      await tx.listingUnavailability.createMany({
        data: originalListing.unavailablePeriods.map(unavail => ({
          listingId: newListing.id,
          startDate: unavail.startDate,
          endDate: unavail.endDate,
          reason: unavail.reason
        }))
      })
    }

    return newListing
  })

  // Revalidate paths
  revalidatePath('/admin/listing-management')

  return {
    success: true,
    newListingId: result.id,
    message: 'Listing copied successfully to admin account'
  }
}

/**
 * Admin function to soft-delete a listing with constraint checking
 * Uses the same constraint logic as user-side deletion
 */
export async function adminDeleteListing(listingId: string, performDelete: boolean = false): Promise<DeletionResponse> {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const { userId: adminUserId } = auth()
  if (!adminUserId) {
    throw new Error('Admin user not found')
  }

  try {
    console.log(`🔍 [ADMIN DELETE] Starting deletion process for listing ${listingId}`)
    console.log(`👤 [ADMIN DELETE] Admin User ID: ${adminUserId}`)

    // Fetch the listing to ensure it exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, title: true, deletedAt: true }
    })

    if (!listing) {
      console.log('❌ [ADMIN DELETE] Listing not found')
      return {
        success: false,
        canDelete: false,
        message: 'Listing not found'
      }
    }

    if (listing.deletedAt) {
      console.log('❌ [ADMIN DELETE] Listing already deleted')
      return {
        success: false,
        canDelete: false,
        message: 'Listing is already deleted'
      }
    }

    console.log(`✅ [ADMIN DELETE] Authorization passed for listing "${listing.title}"`)

    // Check for blocking constraints
    const deletionResult = await collectAllConstraintIssues(listingId)

    if (deletionResult.canDelete) {
      if (performDelete) {
        console.log('🎉 [ADMIN DELETE] All checks passed - proceeding with soft deletion')

        // Perform soft delete in transaction
        await prisma.$transaction(async (tx) => {
          // Soft delete the listing
          await tx.listing.update({
            where: { id: listingId },
            data: {
              deletedAt: new Date(),
              deletedBy: adminUserId
            }
          })
        })

        console.log('✅ [ADMIN DELETE] Listing soft deleted successfully')

        // Revalidate all relevant paths
        revalidatePath('/admin/listing-management')
        revalidatePath(`/admin/listing-management/${listingId}`)
        revalidatePath('/app/host/dashboard/listings')
        revalidatePath('/app/host/dashboard')

        return {
          success: true,
          canDelete: true,
          message: 'Listing deleted successfully',
          entityCounts: deletionResult.entityCounts
        }
      } else {
        console.log('✅ [ADMIN DELETE] Deletion constraints passed - ready for confirmation')

        return {
          success: true,
          canDelete: true,
          message: 'Ready for deletion confirmation',
          entityCounts: deletionResult.entityCounts
        }
      }
    } else {
      console.log('❌ [ADMIN DELETE] Deletion blocked by constraints')
      console.log(`📝 Found ${deletionResult.blockingReasons.length} blocking constraint(s)`)

      return {
        success: true,
        canDelete: false,
        message: 'Listing cannot be deleted due to active constraints',
        blockingReasons: deletionResult.blockingReasons,
        entityCounts: deletionResult.entityCounts
      }
    }
  } catch (error) {
    console.error('❌ [ADMIN DELETE] Error:', error)
    return {
      success: false,
      canDelete: false,
      message: `Deletion check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Collects ALL constraint issues without throwing early
 * Returns comprehensive deletion check result
 */
async function collectAllConstraintIssues(listingId: string): Promise<DeletionCheckResult> {
  console.log('🔍 [ADMIN DELETE] Checking deletion constraints...')

  const blockingReasons: BlockingReason[] = []
  const now = new Date()

  // Check for active or future bookings
  console.log('📋 [ADMIN DELETE] Checking bookings...')
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
  })

  console.log(`📊 [ADMIN DELETE] Found ${activeBookings.length} active bookings`)

  if (activeBookings.length > 0) {
    const futureBookings = activeBookings.filter(b => b.startDate > now)
    const currentBookings = activeBookings.filter(b => b.startDate <= now && b.endDate >= now)

    console.log(`📅 [ADMIN DELETE] ${currentBookings.length} current bookings, ${futureBookings.length} future bookings`)

    // Add current stays as blocking reason
    if (currentBookings.length > 0) {
      console.log('❌ [ADMIN DELETE] BLOCKED - Active stays found')
      currentBookings.forEach(booking => {
        console.log(`  📝 Current Booking ${booking.id}: ${booking.status}, ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}`)
      })

      blockingReasons.push({
        type: 'activeStays',
        count: currentBookings.length,
        message: 'Cannot delete listing with active stays. Please wait for current bookings to complete.',
        details: currentBookings
      })
    }

    // Add future bookings as blocking reason
    if (futureBookings.length > 0) {
      console.log('❌ [ADMIN DELETE] BLOCKED - Future bookings found')
      futureBookings.forEach(booking => {
        console.log(`  📝 Future Booking ${booking.id}: ${booking.status}, ${booking.startDate.toISOString()} to ${booking.endDate.toISOString()}`)
      })

      blockingReasons.push({
        type: 'futureBookings',
        count: futureBookings.length,
        message: 'Cannot delete listing with future bookings. Please cancel or complete all bookings first.',
        details: futureBookings
      })
    }
  } else {
    console.log('✅ [ADMIN DELETE] No blocking bookings found')
  }

  // Check for open matches
  console.log('🤝 [ADMIN DELETE] Checking matches...')
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
  })

  console.log(`🤝 [ADMIN DELETE] Found ${openMatches.length} open matches`)
  if (openMatches.length > 0) {
    console.log('❌ [ADMIN DELETE] BLOCKED - Open matches found')
    openMatches.forEach(match => {
      console.log(`  📝 Match ${match.id}: landlord signed: ${!!match.landlordSignedAt}, tenant signed: ${!!match.tenantSignedAt}, payment: ${match.paymentStatus}`)
    })

    blockingReasons.push({
      type: 'openMatches',
      count: openMatches.length,
      message: 'Cannot delete listing with approved applications. Please complete the lease signing process or cancel the applications first.',
      details: openMatches
    })
  } else {
    console.log('✅ [ADMIN DELETE] No blocking matches found')
  }

  // Check for pending housing requests
  console.log('🏠 [ADMIN DELETE] Checking housing requests...')
  const pendingRequests = await prisma.housingRequest.findMany({
    where: {
      listingId,
      status: 'pending'
    },
    select: {
      id: true,
      status: true
    }
  })

  console.log(`🏠 [ADMIN DELETE] Found ${pendingRequests.length} pending housing requests`)
  if (pendingRequests.length > 0) {
    console.log('❌ [ADMIN DELETE] BLOCKED - Pending housing requests found')
    pendingRequests.forEach(request => {
      console.log(`  📝 Request ${request.id}: ${request.status}`)
    })

    blockingReasons.push({
      type: 'pendingHousingRequests',
      count: pendingRequests.length,
      message: 'Cannot delete listing with pending housing requests. Please approve or decline all requests first.',
      details: pendingRequests
    })
  } else {
    console.log('✅ [ADMIN DELETE] No blocking housing requests found')
  }

  // Get entity counts
  const entityCounts = await getEntityCounts(listingId)

  const canDelete = blockingReasons.length === 0

  if (canDelete) {
    console.log('✅ [ADMIN DELETE] All constraint checks passed')
  } else {
    console.log(`❌ [ADMIN DELETE] Found ${blockingReasons.length} blocking constraint(s)`)
  }

  return {
    canDelete,
    blockingReasons,
    entityCounts
  }
}

/**
 * Counts entities that would be affected by deletion
 */
async function getEntityCounts(listingId: string): Promise<EntityCounts> {
  console.log('🗑️ [ADMIN DELETE] Counting entities that would be affected...')

  // Count entities
  const unavailabilityPeriods = await prisma.listingUnavailability.count({ where: { listingId } })
  const images = await prisma.listingImage.count({ where: { listingId } })
  const bedrooms = await prisma.bedroom.count({ where: { listingId } })
  const monthlyPricing = await prisma.listingMonthlyPricing.count({ where: { listingId } })
  const dislikes = await prisma.dislike.count({ where: { listingId } })
  const maybes = await prisma.maybe.count({ where: { listingId } })
  const favorites = await prisma.favorite.count({ where: { listingId } })
  const locationChanges = await prisma.listingLocationChange.count({ where: { listingId } })
  const pdfTemplates = await prisma.pdfTemplate.count({ where: { listingId } })
  const conversations = await prisma.conversation.count({ where: { listingId } })

  const total = unavailabilityPeriods + images + bedrooms + monthlyPricing +
               dislikes + maybes + favorites + locationChanges +
               pdfTemplates + conversations + 1 // +1 for the listing itself

  console.log('📊 [ADMIN DELETE] Entity summary:')
  console.log(`  🚫 Unavailability periods: ${unavailabilityPeriods}`)
  console.log(`  🖼️ Images: ${images}`)
  console.log(`  🛏️ Bedrooms: ${bedrooms}`)
  console.log(`  💰 Monthly pricing: ${monthlyPricing}`)
  console.log(`  👎 Dislikes: ${dislikes}`)
  console.log(`  🤔 Maybes: ${maybes}`)
  console.log(`  ⭐ Favorites: ${favorites}`)
  console.log(`  📍 Location changes: ${locationChanges}`)
  console.log(`  📄 PDF templates: ${pdfTemplates}`)
  console.log(`  💬 Conversations: ${conversations}`)
  console.log(`🔢 [ADMIN DELETE] Total entities: ${total}`)

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
  }
}
