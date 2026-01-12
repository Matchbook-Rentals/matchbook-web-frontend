'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/app/actions/notifications'

const DEFAULT_PAGE_SIZE = 9;

interface GetPendingListingsParams {
  page?: number;
  pageSize?: number;
}

export async function getPendingListings({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: GetPendingListingsParams = {}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize;

  // Fetch listings without user relation to avoid orphaned listing errors
  const [rawListings, baseTotalCount] = await prisma.$transaction([
    prisma.listing.findMany({
      where: {
        approvalStatus: 'pendingReview',
        deletedAt: null
      },
      skip: skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        createdAt: true,
        locationString: true,
        userId: true,
        listingImages: {
          take: 1,
          select: {
            url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.listing.count({
      where: {
        approvalStatus: 'pendingReview',
        deletedAt: null
      }
    })
  ]);

  // Fetch user data separately to avoid orphaned listing errors
  const userIds = [...new Set(rawListings.map(l => l.userId))];
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

  // Create user lookup map
  const userMap = new Map(users.map(user => [user.id, user]));

  // Filter out orphaned listings and add user data
  const listingsWithUsers = rawListings
    .map(listing => {
      const userData = userMap.get(listing.userId);
      return {
        ...listing,
        createdAt: listing.createdAt.toISOString(), // Serialize Date to string
        user: userData ? {
          ...userData,
          fullName: userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || null
        } : null
      };
    })
    .filter(listing => listing.user !== null); // Filter out orphaned listings

  // Return the results (pagination already applied at database level)
  return { listings: listingsWithUsers, totalCount: baseTotalCount };
}

export async function getListingDetails(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Fetch listing without user relation to avoid orphaned listing errors
  const listing = await prisma.listing.findUnique({
    where: {
      id: listingId,
      deletedAt: null
    },
    include: {
      listingImages: {
        orderBy: {
          rank: 'asc'
        }
      },
      bedrooms: true,
      monthlyPricing: {
        orderBy: {
          months: 'asc'
        }
      }
    }
  })

  if (!listing) {
    return null
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
  })

  // Return listing with user data (or null if orphaned)
  return {
    ...listing,
    user
  }
}

export async function approveRejectListing(
  listingId: string, 
  action: 'approve' | 'reject', 
  comment?: string,
  newLatitude?: number,
  newLongitude?: number
) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Build the update data
  const updateData: any = {
    approvalStatus: action === 'approve' ? 'approved' : 'rejected',
    isApproved: action === 'approve',
    lastApprovalDecision: new Date(),
    lastDecisionComment: comment || null
  }

  // If approving with new coordinates, update them
  if (action === 'approve' && newLatitude !== undefined && newLongitude !== undefined) {
    updateData.latitude = newLatitude
    updateData.longitude = newLongitude
    
    // Add coordinates update info to the comment
    const coordsInfo = `Coordinates updated to: ${newLatitude.toFixed(6)}, ${newLongitude.toFixed(6)}`
    updateData.lastDecisionComment = comment 
      ? `${comment}\n${coordsInfo}` 
      : coordsInfo
  }

  const listing = await prisma.listing.update({
    where: {
      id: listingId
    },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  // Send notification to host when listing is approved
  if (action === 'approve' && listing.user) {
    await createNotification({
      userId: listing.userId,
      content: `Your listing "${listing.title}" is now live on MatchBook!`,
      url: `/app/host/${listingId}/calendar`,
      actionType: 'listing_approved',
      actionId: listingId,
      emailData: {
        listingTitle: listing.title,
        listingId: listingId
      }
    })
  }

  revalidatePath('/admin/listing-approval')
  revalidatePath(`/admin/listing-approval/${listingId}`)
  revalidatePath('/admin/listing-management')

  return listing
}

export async function deleteListing(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  // Delete bedrooms related to this listing
  await prisma.bedroom.deleteMany({
    where: {
      listingId
    }
  })
  
  // Delete images related to this listing
  await prisma.listingImage.deleteMany({
    where: {
      listingId
    }
  })
  
  // Delete the listing itself
  await prisma.listing.delete({
    where: {
      id: listingId
    }
  })

  revalidatePath('/admin/listing-approval')
  
  // Also revalidate host dashboard pages in case the host is viewing their listings
  revalidatePath('/app/host/dashboard')
  revalidatePath('/app/host/dashboard/overview')
  revalidatePath('/app/host/dashboard/listings')
  revalidatePath('/app/host/listings')
  
  // Invalidate the specific listing detail page
  revalidatePath(`/app/host/${listingId}`)
  
  return { success: true }
}
