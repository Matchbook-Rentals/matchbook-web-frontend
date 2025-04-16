'use server'

import prisma from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'
import { revalidatePath } from 'next/cache'

export async function getPendingListings() {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  const pendingListings = await prisma.listing.findMany({
    where: {
      approvalStatus: 'pendingReview'
    },
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
  })

  return pendingListings
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
      listingImages: true,
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
  
  return { success: true }
}