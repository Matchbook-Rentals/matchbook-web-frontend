'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { revalidatePath } from 'next/cache'
import { Listing, ListingImage, ListingMonthlyPricing } from '@prisma/client'

const DEFAULT_PAGE_SIZE = 20;

interface GetAllListingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // all, approved, pendingReview, rejected
  active?: string; // all, active, inactive
}

export interface ListingWithDetails extends Listing {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  listingImages: ListingImage[];
  monthlyPricing: ListingMonthlyPricing[];
}

export async function getAllListings({ 
  page = 1, 
  pageSize = DEFAULT_PAGE_SIZE,
  search = '',
  status = 'all',
  active = 'all'
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
      { title: { contains: search, mode: 'insensitive' } },
      { locationString: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { state: { contains: search, mode: 'insensitive' } },
      { streetAddress1: { contains: search, mode: 'insensitive' } },
      { 
        user: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
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

  const [listings, totalCount] = await prisma.$transaction([
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

  return { listings, totalCount };
}

export async function getListingDetailsForEdit(listingId: string): Promise<ListingWithDetails | null> {
  if (!(await checkAdminAccess())) {
    throw new Error('Unauthorized')
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
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
      },
      bedrooms: true
    }
  });

  return listing as ListingWithDetails | null;
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