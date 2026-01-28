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
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        matches: {
          include: {
            booking: true
          }
        },
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
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        matches: {
          include: {
            booking: true
          }
        },
        dislikes: true,
        favorites: true,
        housingRequests: true,
        allParticipants: true,
        //TO DO: FIND OUT WHY THIS BREAKS
        //applications: true,
      },
    });
    return userTrips;
  } catch (error) {
    console.error('Error fetching all trips for user:', error);
    throw new Error('Failed to fetch all trips for user');
  }
}

export async function getUserTripsCount(): Promise<number> {
  const { userId } = auth();
  if (!userId) {
    return 0;
  }

  try {
    const count = await prisma.trip.count({
      where: {
        userId: userId,
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching user trips count:', error);
    return 0;
  }
}

/**
 * Gets the user's most recent trip (by creation date).
 * Returns null if user has no trips or is not authenticated.
 */
export async function getMostRecentTrip(): Promise<Trip | null> {
  const { userId } = auth();
  if (!userId) {
    return null;
  }

  try {
    const trip = await prisma.trip.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      },
    });
    return trip;
  } catch (error) {
    console.error('Error fetching most recent trip:', error);
    return null;
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
        matches: {
          include: {
            booking: true
          }
        },
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
        matches: {
          include: {
            booking: true
          }
        },
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
  startDate?: Date | null;
  endDate?: Date | null;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}): Promise<CreateTripResponse> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const {
      startDate,
      endDate,
      locationString,
      latitude,
      longitude,
      numAdults,
      numChildren,
      numPets
    } = tripData;

    const newTrip = await prisma.trip.create({
      data: {
        userId,
        tripStatus: 'searching',
        locationString,
        latitude: latitude,
        longitude: longitude,
        startDate,
        endDate,
        numAdults,
        numChildren,
        numPets,
        petsAllowed: numPets > 0,
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

    // Auto-enable petsAllowed if numPets > 0
    const dataToUpdate = {
      ...tripData,
      ...(tripData.numPets !== undefined && { petsAllowed: tripData.numPets > 0 })
    };

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: dataToUpdate,
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
        matches: {
          include: {
            booking: true
          }
        },
        dislikes: true,
        favorites: true,
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

interface CreateTripFromGuestSessionResponse {
  success: boolean;
  tripId?: string;
  error?: string;
}

export async function createTripFromGuestSession(guestSessionData: {
  id: string;
  searchParams: {
    location: string;
    lat: number;
    lng: number;
    startDate?: Date;
    endDate?: Date;
    guests: {
      adults: number;
      children: number;
      pets: number;
    };
  };
}): Promise<CreateTripFromGuestSessionResponse> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { searchParams } = guestSessionData;

    // Create trip with the same data as guest session
    const newTrip = await prisma.trip.create({
      data: {
        userId: userId,
        locationString: searchParams.location,
        latitude: searchParams.lat,
        longitude: searchParams.lng,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        numAdults: searchParams.guests.adults,
        numChildren: searchParams.guests.children,
        numPets: searchParams.guests.pets,
        tripStatus: 'searching',
        searchRadius: 100, // Default search radius
        flexibleStart: 0,
        flexibleEnd: 0,
        petsAllowed: searchParams.guests.pets > 0,
      },
    });

    // Revalidate user trips cache
    revalidateTag(`user-trips-${userId}`);

    return {
      success: true,
      tripId: newTrip.id,
    };
  } catch (error) {
    console.error('Error creating trip from guest session:', error);
    return {
      success: false,
      error: 'Failed to create trip from guest session',
    };
  }
}

interface GetOrCreateTripResponse {
  success: boolean;
  trip?: Trip;
  error?: string;
}

/**
 * Gets or creates a trip for applying to a listing from the search page.
 * Priority: dates > tripId > default dates
 *
 * @param listingId - The listing being applied to (used to get location)
 * @param options - Optional tripId or date range
 */
export async function getOrCreateTripForListing(
  listingId: string,
  options?: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<GetOrCreateTripResponse> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { tripId, startDate, endDate } = options || {};

    // Priority 1: If dates are provided, find existing trip with those dates or create new
    if (startDate && endDate) {
      return await findOrCreateTripWithDates(userId, listingId, startDate, endDate);
    }

    // Priority 2: If tripId is provided, verify it belongs to user and return
    if (tripId) {
      const existingTrip = await prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!existingTrip) {
        return { success: false, error: 'Trip not found' };
      }

      if (existingTrip.userId !== userId) {
        return { success: false, error: 'Unauthorized to use this trip' };
      }

      return { success: true, trip: existingTrip };
    }

    // Priority 3: No context provided, create trip for listing
    return await createTripForListing(userId, listingId);
  } catch (error) {
    console.error('Error in getOrCreateTripForListing:', error);
    return {
      success: false,
      error: 'Failed to get or create trip',
    };
  }
}

async function findOrCreateTripWithDates(
  userId: string,
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<GetOrCreateTripResponse> {
  // Try to find existing trip with matching dates
  const existingTrip = await prisma.trip.findFirst({
    where: {
      userId,
      startDate,
      endDate,
      tripStatus: 'searching',
    },
  });

  if (existingTrip) {
    return { success: true, trip: existingTrip };
  }

  // Create new trip with provided dates
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { city: true, state: true, latitude: true, longitude: true },
  });

  if (!listing) {
    return { success: false, error: 'Listing not found' };
  }

  const newTrip = await prisma.trip.create({
    data: {
      userId,
      tripStatus: 'searching',
      locationString: `${listing.city}, ${listing.state}`,
      latitude: listing.latitude,
      longitude: listing.longitude,
      startDate,
      endDate,
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      petsAllowed: false,
    },
  });

  await revalidateTag('user-trips');

  return { success: true, trip: newTrip };
}

async function createTripForListing(
  userId: string,
  listingId: string
): Promise<GetOrCreateTripResponse> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { city: true, state: true, latitude: true, longitude: true },
  });

  if (!listing) {
    return { success: false, error: 'Listing not found' };
  }

  const newTrip = await prisma.trip.create({
    data: {
      userId,
      tripStatus: 'searching',
      locationString: `${listing.city}, ${listing.state}`,
      latitude: listing.latitude,
      longitude: listing.longitude,
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      petsAllowed: false,
    },
  });

  await revalidateTag('user-trips');

  return { success: true, trip: newTrip };
}
