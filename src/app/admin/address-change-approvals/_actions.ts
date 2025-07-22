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