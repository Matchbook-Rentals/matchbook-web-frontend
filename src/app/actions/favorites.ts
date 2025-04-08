'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { TripAndMatches } from '@/types';
import { auth } from '@clerk/nextjs/server';

export const createDbFavorite = async (tripId: string, listingId: string): Promise<string> => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  console.log('Creating new favrorite with trip and listing ->', tripId, listingId)
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
    // Check if a favorite with the same tripId and listingId already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        tripId,
        listingId,
      },
    });

    if (existingFavorite) {
      throw new Error('Favorite already exists for this trip and listing');
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

    console.log('Favorite Created', newFavorite)

    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/favorites');

    return newFavorite.id;
  } catch (error) {
    console.error('Error creating favorite:', error);
    throw error;
  }
}

export const deleteDbFavorite = async (favoriteId: string) => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  console.log('Deleting favorite with ID ->', favoriteId)
  try {
    const favorite = await prisma.favorite.findUnique({
      where: { id: favoriteId },
      include: {
        trip: {
          select: { userId: true }
        }
      }
    });
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    if (favorite.trip.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to delete this favorite');
    }
    // Delete the favorite
    const deletedFavorite = await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    console.log('Favorite Deleted', deletedFavorite)

    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/favorites');

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
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      return { success: false, error: 'Trip not found' };
    }
    
    if (trip.userId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to modify this trip' };
    }
    // Perform DB operation - createDbFavorite already handles duplicate checking
    const newFavoriteId = await createDbFavorite(tripId, listingId);

    return {
      success: true,
      favoriteId: newFavoriteId
    };
  } catch (error) {
    // If the error is our duplicate check from createDbFavorite
    if (error instanceof Error && error.message.includes('Favorite already exists')) {
      return {
        success: false,
        error: 'Already favorited'
      };
    }

    // For any other errors
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
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }
  
  console.log('Starting optimisticRemoveFavorite with:', { tripId, listingId });
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      return { success: false, error: 'Trip not found' };
    }
    
    if (trip.userId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to modify this trip' };
    }
    const result = await prisma.favorite.deleteMany({
      where: {
        tripId,
        listingId
      }
    });

    console.log('Delete operation result:', result);
    revalidatePath('/favorites');

    return { success: true };
  } catch (error) {
    console.error('Remove favorite operation failed:', error);
    return {
      success: false,
      error: 'Failed to remove favorite'
    };
  }
}
