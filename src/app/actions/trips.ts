import prisma from '@/lib/prismadb';
import { TripAndMatches } from '@/types/trip';

export async function getTripsInSearchStatus(): Promise<TripAndMatches[]> {
  'use server';

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
      },
    });

    return searchingTrips;
  } catch (error) {
    console.error('Error fetching trips in searching status:', error);
    throw new Error('Failed to fetch trips in searching status');
  }
}
