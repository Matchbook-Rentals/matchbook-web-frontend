'use server'

import prisma from '@/lib/prismadb';

/**
 * Guest favorites/dislikes actions that persist to database with guestSessionId
 * These will be migrated to a Trip when the guest signs up
 */

export async function guestOptimisticFavorite(guestSessionId: string, listingId: string) {
  try {
    // Check if already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        guestSessionId_listingId: {
          guestSessionId,
          listingId
        }
      }
    });

    if (existing) {
      return { success: true, message: 'Already favorited' };
    }

    // Remove from dislikes if it exists
    await prisma.dislike.deleteMany({
      where: {
        guestSessionId,
        listingId
      }
    });

    // Add to favorites
    await prisma.favorite.create({
      data: {
        guestSessionId,
        listingId
      }
    });

    return { success: true, message: 'Added to favorites' };
  } catch (error) {
    console.error('Error in guestOptimisticFavorite:', error);
    return { success: false, message: 'Failed to add to favorites' };
  }
}

export async function guestOptimisticRemoveFavorite(guestSessionId: string, listingId: string) {
  try {
    await prisma.favorite.deleteMany({
      where: {
        guestSessionId,
        listingId
      }
    });

    return { success: true, message: 'Removed from favorites' };
  } catch (error) {
    console.error('Error in guestOptimisticRemoveFavorite:', error);
    return { success: false, message: 'Failed to remove from favorites' };
  }
}

export async function guestOptimisticDislike(guestSessionId: string, listingId: string) {
  try {
    // Check if already exists
    const existing = await prisma.dislike.findUnique({
      where: {
        guestSessionId_listingId: {
          guestSessionId,
          listingId
        }
      }
    });

    if (existing) {
      return { success: true, message: 'Already disliked' };
    }

    // Remove from favorites if it exists
    await prisma.favorite.deleteMany({
      where: {
        guestSessionId,
        listingId
      }
    });

    // Add to dislikes
    await prisma.dislike.create({
      data: {
        guestSessionId,
        listingId
      }
    });

    return { success: true, message: 'Added to dislikes' };
  } catch (error) {
    console.error('Error in guestOptimisticDislike:', error);
    return { success: false, message: 'Failed to add to dislikes' };
  }
}

export async function guestOptimisticRemoveDislike(guestSessionId: string, listingId: string) {
  try {
    await prisma.dislike.deleteMany({
      where: {
        guestSessionId,
        listingId
      }
    });

    return { success: true, message: 'Removed from dislikes' };
  } catch (error) {
    console.error('Error in guestOptimisticRemoveDislike:', error);
    return { success: false, message: 'Failed to remove from dislikes' };
  }
}

export async function pullGuestFavoritesFromDb(guestSessionId: string) {
  try {
    const [favorites, dislikes] = await Promise.all([
      prisma.favorite.findMany({
        where: { guestSessionId },
        select: { listingId: true }
      }),
      prisma.dislike.findMany({
        where: { guestSessionId },
        select: { listingId: true }
      })
    ]);

    return {
      success: true,
      favoriteIds: favorites.map(f => f.listingId).filter(Boolean) as string[],
      dislikeIds: dislikes.map(d => d.listingId)
    };
  } catch (error) {
    console.error('Error in pullGuestFavoritesFromDb:', error);
    return {
      success: false,
      favoriteIds: [],
      dislikeIds: []
    };
  }
}