'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { Notification } from '@prisma/client'

type NotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>
import { HousingRequest } from '@prisma/client'
import { TripAndMatches, ListingAndImages } from '@/types/'
import { auth } from '@clerk/nextjs/server'


export async function getHousingRequestsByListingId(listingId: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    if (listing.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to view housing requests for this listing');
    }
    const housingRequests = await prisma.housingRequest.findMany({
      where: {
        listingId: listingId,
      },
      include: {
        user: true,
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

    const notificationData: NotificationInput = {
      userId: listing.userId,
      content: 'New Housing Request',
      url: `/platform/host-dashboard/${listing.id}?tab=applications`,
      actionType: 'view',
      actionId: newHousingRequest.id,
      unread: true
    }
    createNotification(notificationData)

    return newHousingRequest;
  } catch (error) {
    console.error('Error creating housing request:', error);
    throw new Error('Failed to create housing request');
  }

};

export const deleteDbHousingRequest = async (tripId: string, listingId: string) => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  console.log(`Deleting HousingRequest with trip ${tripId} and listing ${listingId}`);
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    if (trip.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to modify this trip');
    }
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

    const housingRequest = await createDbHousingRequest(trip as unknown as TripAndMatches, listing);

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
