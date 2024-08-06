'use server'
import prisma from '@/lib/prismadb';
import { TripAndMatches } from '@/types/';
import { auth } from '@clerk/nextjs/server';

export async function getTripsInSearchStatus(): Promise<TripAndMatches[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const searchingTrips = await prisma.trip.findMany({
      where: {
        tripStatus: 'searching',
      },
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        housingRequests: true,
        allParticipants: true, // Include this if you want to fetch participants
      },
    });
    return searchingTrips;
  } catch (error) {
    console.error('Error fetching trips in searching status:', error);
    throw new Error('Failed to fetch trips in searching status');
  }
}

export async function addParticipant(tripId: string, email: string): Promise<string[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // First, fetch the current trip to get existing participants
    const currentTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { allParticipants: true },
    });

    if (!currentTrip) {
      throw new Error('Trip not found');
    }

    // Check if the user is already a participant
    const existingParticipant = currentTrip.allParticipants.find(
      participant => participant.email === email
    );

    if (existingParticipant) {
      throw new Error('User is already a participant in this trip');
    }

    // Update the trip by adding the new user to allParticipants
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        allParticipants: {
          connect: [{ email: email }],
        },
      },
      include: {
        allParticipants: true,
      },
    });

    // Return the IDs of all participants
    return updatedTrip.allParticipants.map(participant => participant.id);
  } catch (error) {
    console.error('Error adding participant to trip:', error);
    throw error;
  }
}

export async function updateTrip(updatedTrip: TripAndMatches): Promise<TripAndMatches> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const { id, ...tripData } = updatedTrip;

    // Remove related fields that can't be directly updated
    const { matches, dislikes, favorites, housingRequests, allParticipants, ...updateData } = tripData;

    const updated = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        housingRequests: true,
        allParticipants: true,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw new Error('Failed to update trip');
  }
}