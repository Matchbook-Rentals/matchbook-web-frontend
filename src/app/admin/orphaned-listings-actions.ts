'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'

const DEFAULT_PAGE_SIZE = 20;

interface GetOrphanedListingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface OrphanedListingData {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  locationString: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: string;
  isApproved: boolean;
  markedActiveByUser: boolean;
  status: string;
  roomCount: number;
  bathroomCount: number;
  category: string | null;
  userId: string;
  listingImages: Array<{
    url: string;
  }>;
  monthlyPricing: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;
}

export async function getOrphanedListings({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search = ''
}: GetOrphanedListingsParams = {}) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const skip = (page - 1) * pageSize;

  // Build where clause for search
  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { locationString: { contains: search } },
      { city: { contains: search } },
      { state: { contains: search } },
      { streetAddress1: { contains: search } }
    ];
  }

  // Get all listings that match search criteria
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

  // Fetch user data separately to identify orphaned listings
  const userIds = [...new Set(rawListings.map(l => l.userId))];
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null // Only get active users
    },
    select: {
      id: true
    }
  });

  // Create a user lookup map
  const userMap = new Map(users.map(user => [user.id, user]));

  // Filter to only include orphaned listings (listings without valid active users)
  // This includes both listings with non-existent users AND users that are soft-deleted
  const orphanedListings = rawListings.filter(listing => !userMap.has(listing.userId));

  return {
    listings: orphanedListings as OrphanedListingData[],
    totalCount: orphanedListings.length,
    totalListingsSearched: totalCount
  };
}

export async function setListingInactive(listingId: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      markedActiveByUser: false,
      lastModified: new Date()
    }
  });

  revalidatePath('/admin/orphaned-listings');

  return listing;
}

export async function setListingRejected(listingId: string, comment?: string) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      approvalStatus: 'rejected',
      isApproved: false,
      markedActiveByUser: false,
      lastApprovalDecision: new Date(),
      lastDecisionComment: comment || 'Rejected - Orphaned listing',
      lastModified: new Date()
    }
  });

  revalidatePath('/admin/orphaned-listings');

  return listing;
}

export async function bulkUpdateOrphanedListings(
  listingIds: string[],
  action: 'inactive' | 'rejected'
) {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const updateData: any = {
    lastModified: new Date()
  };

  switch (action) {
    case 'inactive':
      updateData.markedActiveByUser = false;
      break;
    case 'rejected':
      updateData.approvalStatus = 'rejected';
      updateData.isApproved = false;
      updateData.markedActiveByUser = false;
      updateData.lastApprovalDecision = new Date();
      updateData.lastDecisionComment = 'Bulk rejected - Orphaned listing';
      break;
  }

  await prisma.listing.updateMany({
    where: {
      id: { in: listingIds }
    },
    data: updateData
  });

  revalidatePath('/admin/orphaned-listings');

  return { success: true, updated: listingIds.length };
}