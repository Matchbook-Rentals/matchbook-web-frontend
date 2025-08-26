'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { HousingRequest, Notification } from '@prisma/client'
import { TripAndMatches, ListingAndImages } from '@/types/'
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent'

type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;


export async function getHousingRequestById(housingRequestId: string) {
  try {
    const housingRequest = await prisma.housingRequest.findUnique({
      where: {
        id: housingRequestId,
      },
      include: {
        user: {
          include: {
            applications: {
              include: {
                verificationImages: true,
                incomes: true,
                identifications: {
                  include: {
                    idPhotos: true,
                  }
                },
                residentialHistories: true,
              }
            }
          }
        },
        listing: {
          include: {
            monthlyPricing: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        boldSignLease: true,
        trip: true, // Include trip data directly in the join
      },
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    // Check if there's a booking for this housing request (via match)
    let hasBooking = false;
    if (housingRequest.status === 'approved') {
      const match = await prisma.match.findFirst({
        where: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId
        },
        include: {
          booking: true
        }
      });
      hasBooking = !!match?.booking;
    }

    // Calculate monthly rent for this housing request
    const monthlyRent = calculateRent({ 
      listing: housingRequest.listing, 
      trip: housingRequest.trip 
    });

    return { ...housingRequest, hasBooking, monthlyRent };
  } catch (error) {
    console.error('Error fetching housing request:', error);
    throw new Error('Failed to fetch housing request');
  }
}

export async function getHousingRequestsByListingId(listingId: string) {
  try {
    // Use a single query with proper joins to avoid N+1 problem
    const housingRequests = await prisma.housingRequest.findMany({
      where: {
        listingId: listingId,
      },
      include: {
        user: {
          include: {
            applications: {
              include: {
                verificationImages: true,
                incomes: true,
                identifications: true,
              }
            }
          }
        },
        trip: true // Include trip data directly in the join
      },
    });

    return housingRequests;
  } catch (error) {
    console.error('Error fetching housing requests:', error);
    throw new Error('Failed to fetch housing requests');
  }
}

export const createDbHousingRequest = async (trip: TripAndMatches, listing: ListingAndImages): Promise<HousingRequest> => {
  // NEED TO ENFORCE DATE ADDITION AT APPLICATION LEVEL
  if (!trip.startDate || !trip.endDate) {
    throw new Error(`Need start and end date (both)`);
  }

  // Prevent users from applying to their own listings
  if (trip.userId === listing.userId) {
    throw new Error('You cannot apply to your own listing');
  }

  try {
    const newHousingRequest = await prisma.housingRequest.create({
      data: {
        userId: trip.userId,
        listingId: listing.id,
        tripId: trip.id,
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
    });


    const requester = await prisma.user.findUnique({
      where: {
        id: trip.userId
      }
    });

    let requesterName = ''

    requester?.firstName && (requesterName += requester.firstName + ' ');
    requester?.lastName && (requesterName += requester.lastName);
    !requesterName && (requesterName += requester?.email)
    if (requesterName.length > 28) {
      requesterName = requesterName.slice(0, 25) + '...'
    }


    const messageContent = `${requesterName.trim()} wants to stay at your property ${listing.title}`;

    const notificationData: CreateNotificationInput = {
      userId: listing.userId,
      content: 'New Housing Request',
      url: `/app/host/${listing.id}/applications`,
      actionType: 'view',
      actionId: newHousingRequest.id,
    }
    createNotification(notificationData)

    return newHousingRequest;
  } catch (error) {
    console.error('Error creating housing request:', error);
    throw new Error('Failed to create housing request');
  }

};

export const deleteDbHousingRequest = async (tripId: string, listingId: string) => {
  console.log(`Deleting HousingRequest with trip ${tripId} and listing ${listingId}`);
  try {
    // Delete the favorite
    const deletedRequest = await prisma.housingRequest.delete({
      where: {
        listingId_tripId: {
          tripId,
          listingId
        }
      }
    });

    try {
      await prisma.notification.deleteMany({
        where: {
          AND: [
            { actionType: 'view' },
            { actionId: deletedRequest.id }
          ]
        }
      });
    } catch (error) {
      // Ignore error if notification doesn't exist
      if (!(error instanceof Error) || !error.message.includes('Record to delete does not exist')) {
        throw error;
      }
    }


    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/housingRequests');

    return deletedRequest;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

export async function optimisticApplyDb(tripId: string, listing: ListingAndImages) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        favorites: true,
        dislikes: true,
        housingRequests: true,
        matches: true,
      }
    });

    if (!trip) throw new Error('Trip not found');

    // Prevent users from applying to their own listings
    if (trip.userId === listing.userId) {
      throw new Error('You cannot apply to your own listing');
    }

    const housingRequest = await createDbHousingRequest(trip, listing);

    return { success: true, housingRequest };
  } catch (error) {
    console.error('Failed to apply:', error);
    return { success: false };
  }
}

export async function optimisticRemoveApplyDb(tripId: string, listingId: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    await deleteDbHousingRequest(tripId, listingId);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove application:', error);
    return { success: false };
  }
}

// Get all housing requests for the current host's listings
export async function getHostHousingRequests() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching housing requests for userId:', userId);

    // Use a single query with proper joins to avoid N+1 problem
    const housingRequests = await prisma.housingRequest.findMany({
      where: {
        listing: {
          userId: userId // Get housing requests where the listing belongs to the current user (host)
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true
          }
        },
        listing: {
          select: {
            title: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true,
            minPrice: true,
            maxPrice: true
          }
        }
      }
    });

    console.log('Found housing requests:', housingRequests.length);
    return housingRequests;
  } catch (error) {
    console.error('Error in getHostHousingRequests:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}

// Approve a housing request
export async function approveHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true,
        trip: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only approve requests for your own listings');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update the housing request status to approved
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { status: 'approved' }
      });

      // Create a match for this approved housing request
      const monthlyRent = calculateRent({ 
        listing: housingRequest.listing, 
        trip: housingRequest.trip 
      });

      const match = await tx.match.create({
        data: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId,
          monthlyRent: monthlyRent,
          leaseDocumentId: housingRequest.leaseDocumentId, // Copy from housing request
        },
      });

      return { updatedRequest, match };
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your application for ${housingRequest.listing.title} has been approved!`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_approved',
      actionId: housingRequestId,
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');
    revalidatePath(`/app/rent/searches/${housingRequest.tripId}`);

    return { success: true, housingRequest: result.updatedRequest, match: result.match };
  } catch (error) {
    console.error('Error approving housing request:', error);
    throw error;
  }
}

// Decline a housing request
export async function declineHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only decline requests for your own listings');
    }

    // Update the housing request status to declined
    const updatedRequest = await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { status: 'declined' }
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your application for ${housingRequest.listing.title} has been declined.`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_declined',
      actionId: housingRequestId,
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: updatedRequest };
  } catch (error) {
    console.error('Error declining housing request:', error);
    throw error;
  }
}

// Undo an approval (revert back to pending and delete the match)
export async function undoApprovalHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only undo approvals for your own listings');
    }

    if (housingRequest.status !== 'approved') {
      throw new Error('Can only undo approved requests');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Find and delete the match associated with this housing request
      const match = await tx.match.findFirst({
        where: {
          tripId: housingRequest.tripId,
          listingId: housingRequest.listingId
        },
        include: {
          BoldSignLease: true
        }
      });

      if (match) {
        // Check if there's already a booking for this match
        const booking = await tx.booking.findUnique({
          where: { matchId: match.id }
        });

        if (booking) {
          throw new Error('Cannot undo approval: A booking already exists for this match');
        }

        // Delete the BoldSignLease if it exists
        if (match.BoldSignLease) {
          await tx.boldSignLease.delete({
            where: { id: match.BoldSignLease.id }
          });
        }

        // Delete the match
        await tx.match.delete({
          where: { id: match.id }
        });
      }

      // Update the housing request status back to pending and remove boldSignLeaseId
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { 
          status: 'pending',
          boldSignLeaseId: null
        }
      });

      // Delete the original approval notification
      await tx.notification.deleteMany({
        where: {
          userId: housingRequest.userId,
          actionType: 'application_approved',
          actionId: housingRequestId
        }
      });

      return { updatedRequest };
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your approval for ${housingRequest.listing.title} has been revoked.`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_revoked',
      actionId: housingRequestId,
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');
    revalidatePath(`/app/rent/searches/${housingRequest.tripId}`);

    return { success: true, housingRequest: result.updatedRequest };
  } catch (error) {
    console.error('Error undoing approval:', error);
    throw error;
  }
}

// Undo a decline (revert back to pending)
export async function undoDeclineHousingRequest(housingRequestId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        user: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only undo declines for your own listings');
    }

    if (housingRequest.status !== 'declined') {
      throw new Error('Can only undo declined requests');
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update the housing request status back to pending
      const updatedRequest = await tx.housingRequest.update({
        where: { id: housingRequestId },
        data: { status: 'pending' }
      });

      // Delete the original decline notification
      await tx.notification.deleteMany({
        where: {
          userId: housingRequest.userId,
          actionType: 'application_declined',
          actionId: housingRequestId
        }
      });

      return { updatedRequest };
    });

    // Create a notification for the applicant
    const notificationData = {
      userId: housingRequest.userId,
      content: `Your application for ${housingRequest.listing.title} is being reconsidered.`,
      url: `/app/rent/searches/${housingRequest.tripId}`,
      actionType: 'application_reconsidered',
      actionId: housingRequestId,
    };
    
    await createNotification(notificationData);

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: result.updatedRequest };
  } catch (error) {
    console.error('Error undoing decline:', error);
    throw error;
  }
}

// Update a housing request with new data
export async function updateHousingRequest(housingRequestId: string, data: { leaseDocumentId?: string | null }) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify that the housing request belongs to a listing owned by the current user
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true
      }
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    if (housingRequest.listing.userId !== userId) {
      throw new Error('Unauthorized: You can only update requests for your own listings');
    }

    // Update the housing request
    const updatedRequest = await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: data
    });

    // Revalidate relevant paths
    revalidatePath(`/app/host/${housingRequest.listingId}/applications`);
    revalidatePath('/app/host/dashboard/applications');

    return { success: true, housingRequest: updatedRequest };
  } catch (error) {
    console.error('Error updating housing request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
