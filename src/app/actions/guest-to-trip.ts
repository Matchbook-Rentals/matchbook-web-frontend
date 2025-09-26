'use server'

import prisma from '@/lib/prismadb';

/**
 * Migration function to convert guest session data to a Trip
 * Called during sign-up flow when creating the first authenticated Trip
 */

export async function convertGuestSessionToTrip(guestSessionId: string, newTripId: string) {
  try {
    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update all favorites to belong to the new trip
      const favoritesUpdated = await tx.favorite.updateMany({
        where: { guestSessionId },
        data: {
          tripId: newTripId,
          guestSessionId: null
        }
      });

      // Update all dislikes to belong to the new trip
      const dislikesUpdated = await tx.dislike.updateMany({
        where: { guestSessionId },
        data: {
          tripId: newTripId,
          guestSessionId: null
        }
      });

      return {
        favoritesCount: favoritesUpdated.count,
        dislikesCount: dislikesUpdated.count
      };
    });

    console.log(`Converted guest session ${guestSessionId} to trip ${newTripId}:`, result);

    return {
      success: true,
      message: `Migrated ${result.favoritesCount} favorites and ${result.dislikesCount} dislikes to your account`,
      ...result
    };
  } catch (error) {
    console.error('Error in convertGuestSessionToTrip:', error);
    return {
      success: false,
      message: 'Failed to migrate guest data to account',
      favoritesCount: 0,
      dislikesCount: 0
    };
  }
}

/**
 * Get counts of guest data before migration (for UI display)
 */
export async function getGuestDataCounts(guestSessionId: string) {
  try {
    const [favoritesCount, dislikesCount] = await Promise.all([
      prisma.favorite.count({
        where: { guestSessionId }
      }),
      prisma.dislike.count({
        where: { guestSessionId }
      })
    ]);

    return {
      success: true,
      favoritesCount,
      dislikesCount,
      totalCount: favoritesCount + dislikesCount
    };
  } catch (error) {
    console.error('Error in getGuestDataCounts:', error);
    return {
      success: false,
      favoritesCount: 0,
      dislikesCount: 0,
      totalCount: 0
    };
  }
}