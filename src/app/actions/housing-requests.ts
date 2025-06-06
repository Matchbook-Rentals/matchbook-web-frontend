'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { HousingRequest } from '@prisma/client'
import { TripAndMatches, ListingAndImages } from '@/types/'
import { auth } from '@clerk/nextjs/server'


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
        listing: true,
      },
    });

    if (!housingRequest) {
      throw new Error('Housing request not found');
    }

    // Manually fetch trip data to handle potential null cases
    try {
      const trip = await prisma.trip.findUnique({
        where: { id: housingRequest.tripId }
      });
      return { ...housingRequest, trip };
    } catch (error) {
      console.warn(`Failed to fetch trip ${housingRequest.tripId} for housing request ${housingRequest.id}:`, error);
      return { ...housingRequest, trip: null };
    }
  } catch (error) {
    console.error('Error fetching housing request:', error);
    throw new Error('Failed to fetch housing request');
  }
}

export async function getHousingRequestsByListingId(listingId: string) {
  try {
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
      },
    });

    // Manually fetch trip data for each housing request to handle potential null cases
    const housingRequestsWithTrips = await Promise.all(
      housingRequests.map(async (request) => {
        try {
          const trip = await prisma.trip.findUnique({
            where: { id: request.tripId }
          });
          return { ...request, trip };
        } catch (error) {
          console.warn(`Failed to fetch trip ${request.tripId} for housing request ${request.id}:`, error);
          return { ...request, trip: null };
        }
      })
    );

    return housingRequestsWithTrips;
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
      url: `/platform/host-dashboard/${listing.id}?tab=applications`,
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
