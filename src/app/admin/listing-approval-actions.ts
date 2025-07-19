'use server'

import prisma from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'
import { revalidatePath } from 'next/cache'

const DEFAULT_PAGE_SIZE = 10;

interface GetPendingListingsParams {
  page?: number;
  pageSize?: number;
}

export async function getPendingListings({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: GetPendingListingsParams = {}) {
  if (!checkRole('admin')) {
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
          fullName: true,
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
  if (!checkRole('admin')) {
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
          fullName: true,
          email: true
        }
      },
      listingImages: {
        orderBy: {
          rank: 'asc'
        }
      },
      bedrooms: true
    }
  })

  return listing
}

export async function approveRejectListing(listingId: string, action: 'approve' | 'reject', comment?: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.update({
    where: {
      id: listingId
    },
    data: {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      isApproved: action === 'approve',
      lastApprovalDecision: new Date(),
      lastDecisionComment: comment || null
    }
  })

  revalidatePath('/admin/listing-approval')
  revalidatePath(`/admin/listing-approval/${listingId}`)
  
  return listing
}

export async function deleteListing(listingId: string) {
  if (!checkRole('admin')) {
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
