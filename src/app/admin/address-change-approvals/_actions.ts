'use server'

import prisma from '@/lib/prismadb'

export async function getLocationChanges(
  page: number = 1,
  pageSize: number = 20,
  sortBy: 'createdAt' | 'listingId' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  try {
    // Check if the table exists by trying a simple count first
    console.log('Checking if ListingLocationChange table exists...');
    
    const offset = (page - 1) * pageSize;

    const [locationChanges, total] = await Promise.all([
      prisma.listingLocationChange.findMany({
        skip: offset,
        take: pageSize,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              status: true,
              approvalStatus: true,
              isApproved: true,
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      }),
      prisma.listingLocationChange.count()
    ]);

    console.log(`Found ${total} location changes`);

    return {
      locationChanges,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching location changes:', error);
    console.error('Error details:', error);
    
    // Return empty data instead of throwing to prevent page crash
    return {
      locationChanges: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

export async function getLocationChangeById(id: string) {
  try {
    console.log(`Fetching location change with ID: ${id}`);
    
    const locationChange = await prisma.listingLocationChange.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            status: true,
            approvalStatus: true,
            isApproved: true,
            streetAddress1: true,
            streetAddress2: true,
            city: true,
            state: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            lastDecisionComment: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!locationChange) {
      console.error(`No location change found with ID: ${id}`);
      throw new Error('Location change not found');
    }

    return locationChange;
  } catch (error) {
    console.error('Error fetching location change:', error);
    console.error('Error details:', error);
    throw error; // Re-throw to trigger notFound() in the page
  }
}

export async function approveLocationChange(listingId: string) {
  try {
    console.log(`Approving location changes for listing: ${listingId}`);
    
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        approvalStatus: 'approved',
        isApproved: true,
        lastApprovalDecision: new Date(),
        lastDecisionComment: 'Location changes approved by admin'
      }
    });

    console.log(`Listing ${listingId} location changes approved successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error approving location changes:', error);
    throw new Error('Failed to approve location changes');
  }
}

export async function rejectLocationChange(listingId: string, rejectionReason: string) {
  try {
    console.log(`Rejecting location changes for listing: ${listingId} with reason: ${rejectionReason}`);
    
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        approvalStatus: 'rejected',
        isApproved: false,
        lastApprovalDecision: new Date(),
        lastDecisionComment: rejectionReason || 'Location changes rejected by admin'
      }
    });

    console.log(`Listing ${listingId} location changes rejected successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error rejecting location changes:', error);
    throw new Error('Failed to reject location changes');
  }
}

export async function getLocationChangesForListing(listingId: string) {
  try {
    console.log(`Fetching location changes for listing: ${listingId}`);
    
    const locationChanges = await prisma.listingLocationChange.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    console.log(`Found ${locationChanges.length} location changes for listing ${listingId}`);
    return locationChanges;
  } catch (error) {
    console.error('Error fetching location changes for listing:', error);
    return []; // Return empty array on error to prevent crashes
  }
}