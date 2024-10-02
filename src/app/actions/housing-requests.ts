'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { HousingRequest } from '@prisma/client'
import { TripAndMatches, ListingAndImages } from '@/types/'
import { auth } from '@clerk/nextjs/server'


export async function getHousingRequestsByListingId(listingId: string) {
  try {
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

    let deleted = await prisma.notification.delete({
      where: {
        actionType_actionId: {
          actionType: 'housingRequest',
          actionId: deletedRequest.id
        }
      }
    })


    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/housingRequests');

    return deletedRequest;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}
