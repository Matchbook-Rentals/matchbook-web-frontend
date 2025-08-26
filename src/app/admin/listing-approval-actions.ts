'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'

const DEFAULT_PAGE_SIZE = 10;

interface GetPendingListingsParams {
  page?: number;
  pageSize?: number;
}

export async function getPendingListings({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: GetPendingListingsParams = {}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize;

  const [pendingListings, totalCount] = await prisma.$transaction([
    prisma.listing.findMany({
      where: {
        approvalStatus: 'pendingReview'
      },
      skip: skip,
      take: pageSize,
    select: {
      id: true,
      title: true,
      createdAt: true,
      locationString: true,
      userId: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
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
        approvalStatus: 'pendingReview'
      }
    })
  ]);

  return { listings: pendingListings, totalCount };
}

export async function getListingDetails(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.findUnique({
    where: {
      id: listingId
    },
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

  return listing
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
    data: updateData
  })

  revalidatePath('/admin/listing-approval')
  revalidatePath(`/admin/listing-approval/${listingId}`)
  
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
