'use server'
import prisma from '@/lib/prismadb';
import { TripAndMatches } from '@/types/';
import { auth } from '@clerk/nextjs/server';
import { Trip } from '@prisma/client';

export async function getTripsInSearchStatus(): Promise<TripAndMatches[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const searchingTrips = await prisma.trip.findMany({
      where: {
        tripStatus: 'searching',
        userId: userId,
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

export async function getAllUserTrips(): Promise<TripAndMatches[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const userTrips = await prisma.trip.findMany({
      where: {
        userId: userId,
      },
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        housingRequests: true,
        allParticipants: true,
        applications: true,
      },
    });
    return userTrips;
  } catch (error) {
    console.error('Error fetching all trips for user:', error);
    throw new Error('Failed to fetch all trips for user');
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

export async function deleteTrip(tripId: string): Promise<void> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.trip.delete({
      where: { id: tripId },
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw new Error('Failed to delete trip');
  }
}

export async function getTripById(tripId: string): Promise<TripAndMatches | null> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        maybes: true,
        housingRequests: true,
        allParticipants: true,
      },
    });

    return trip;
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    throw new Error('Failed to fetch trip');
  }
}

interface CreateTripResponse {
  success: boolean;
  trip?: Trip;
  error?: string;
}

export async function createTrip(tripData: {
  locationString: string;
  latitude: number;
  longitude: number;
  startDate?: Date;
  endDate?: Date;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}): Promise<CreateTripResponse> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Handle date logic
    let { startDate, endDate } = tripData;
    const today = new Date();

    if (!startDate && !endDate) {
      // If neither date is provided, start next month and end the month after
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    } else if (startDate && !endDate) {
      // If only start date is provided, end date is start date + 1 month
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (!startDate && endDate) {
      // If only end date is provided, start date is end date - 1 month
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const newTrip = await prisma.trip.create({
      data: {
        ...tripData,
        startDate,
        endDate,
        userId,
        tripStatus: 'searching',
      },
    });

    return {
      success: true,
      trip: newTrip,
    };
  } catch (error) {
    console.error('Error creating trip:', error);
    return {
      success: false,
      error: 'Failed to create trip',
    };
  }
}

