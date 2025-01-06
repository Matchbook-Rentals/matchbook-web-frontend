'use server'
import prisma from '@/lib/prismadb';
import { revalidateTag } from 'next/cache';
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

export async function getAllUserTrips(options?: { next?: { tags?: string[] } }): Promise<TripAndMatches[]> {
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
    const { matches, dislikes, favorites, housingRequests, maybes, allParticipants, ...updateData } = tripData;

    const updated = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        maybes: true,
        housingRequests: true,
        allParticipants: true,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw new Error(`Failed to update trip: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
}

interface DeleteTripResponse {
  success: boolean;
  trip?: Trip;
  message?: string;
}

export async function deleteTrip(tripId: string): Promise<DeleteTripResponse> {
  const { userId } = auth();
  if (!userId) {
    return {
      success: false,
      message: 'Unauthorized'
    };
  }

  try {
    const deletedTrip = await prisma.trip.delete({
      where: { id: tripId },
    });

    // Invalidate the cache for getAllUserTrips when a trip is deleted
    await revalidateTag('user-trips');

    return {
      success: true,
      trip: deletedTrip
    };
  } catch (error) {
    console.error('Error deleting trip:', error);
    return {
      success: false,
      message: 'Failed to delete trip'
    };
  }
}

export async function getTripById(tripId: string, options?: { next?: { tags?: string[] } }): Promise<TripAndMatches | null> {
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


    // Invalidate the cache for getAllUserTrips
    await revalidateTag('user-trips');

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

interface EditTripResponse {
  success: boolean;
  trip?: Trip;
  error?: string;
}

export async function editTrip(tripId: string, tripData: {
  locationString?: string;
  latitude?: number;
  longitude?: number;
  startDate?: Date;
  endDate?: Date;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}): Promise<EditTripResponse> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // First verify the trip belongs to the user
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!existingTrip) {
      return { success: false, error: 'Trip not found' };
    }

    if (existingTrip.userId !== userId) {
      return { success: false, error: 'Unauthorized to edit this trip' };
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: tripData,
    });


    // Invalidate both the specific trip and user trips list
    await Promise.all([
      revalidateTag('user-trips'),
      revalidateTag(`trip-${tripId}`)
    ]);

    return {
      success: true,
      trip: updatedTrip,
    };
  } catch (error) {
    console.error('Error editing trip:', error);
    return {
      success: false,
      error: 'Failed to edit trip',
    };
  }
}

export const updateTripFilters = async (tripId: string, filters: Object): Promise<TripAndMatches> => {
  // Check authentication
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Update trip with new filters
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { ...filters },
      include: {
        matches: true,
        dislikes: true,
        favorites: true,
        maybes: true,
        housingRequests: true,
        allParticipants: true,
      },
    });

    // Revalidate the cache for this specific trip
    await Promise.all([
      revalidateTag(`trip-${tripId}`),
    ]);

    return updatedTrip;

  } catch (error) {
    console.log('FILTERS', filters)
    console.error('Error updating trip filters:', error);
    throw new Error('Failed to update trip filters');
  }
}
