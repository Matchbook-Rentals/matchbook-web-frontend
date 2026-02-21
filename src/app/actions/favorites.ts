'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

const authenticateAndVerifyTrip = async (tripId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });
  if (!trip || trip.userId !== userId) throw new Error('Unauthorized');

  return userId;
};

export const createDbFavorite = async (tripId: string, listingId: string): Promise<string> => {
  await authenticateAndVerifyTrip(tripId);

  try {
    // Check if a favorite with the same tripId and listingId already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        tripId,
        listingId,
      },
    });

    if (existingFavorite) {
      return existingFavorite.id;
    }

    // Get the highest rank for the current trip
    const highestRank = await prisma.favorite.findFirst({
      where: { tripId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });

    const newRank = (highestRank?.rank || 0) + 1;

    // Create the new favorite
    const newFavorite = await prisma.favorite.create({
      data: {
        tripId,
        listingId,
        rank: newRank,
      },
    });

    // Revalidate the favorites page and trip cache
    revalidatePath('/favorites');
    revalidateTag(`trip-${tripId}`);
    revalidateTag('user-trips');

    return newFavorite.id;
  } catch (error) {
    console.error('Error creating favorite:', error);
    throw error;
  }
}

export const deleteDbFavorite = async (favoriteId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Verify ownership through the trip
    const favorite = await prisma.favorite.findUnique({
      where: { id: favoriteId },
      select: { tripId: true, trip: { select: { userId: true } } },
    });
    if (!favorite || favorite.trip.userId !== userId) throw new Error('Unauthorized');

    const deletedFavorite = await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    // Revalidate the favorites page and trip cache
    revalidatePath('/favorites');
    if (deletedFavorite.tripId) {
      revalidateTag(`trip-${deletedFavorite.tripId}`);
      revalidateTag('user-trips');
    }

    return deletedFavorite;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

export const optimisticFavorite = async (
  tripId: string,
  listingId: string,
): Promise<{ success: boolean, favoriteId?: string, error?: string }> => {
  try {
    // Auth is handled inside createDbFavorite
    const favoriteId = await createDbFavorite(tripId, listingId);

    return {
      success: true,
      favoriteId: favoriteId
    };
  } catch (error) {
    console.error('Favorite operation failed:', error);
    return {
      success: false,
      error: 'Failed to create favorite'
    };
  }
}

export const optimisticRemoveFavorite = async (
  tripId: string,
  listingId: string,
): Promise<{ success: boolean, error?: string }> => {
  try {
    await authenticateAndVerifyTrip(tripId);

    await prisma.favorite.deleteMany({
      where: {
        tripId,
        listingId
      }
    });
    revalidatePath('/favorites');
    revalidateTag(`trip-${tripId}`);
    revalidateTag('user-trips');

    return { success: true };
  } catch (error) {
    console.error('Remove favorite operation failed:', error);
    return {
      success: false,
      error: 'Failed to remove favorite'
    };
  }
}
