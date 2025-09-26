'use server'

import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

/**
 * Check if a guest session has already been converted to a trip for this user
 */
export async function checkExistingGuestConversion(guestSessionId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, existingTrip: null };
    }

    // Look for trips that have favorites or dislikes with this guestSessionId that were converted
    // We can't directly link guest session to trip, so we check via the migration pattern

    // First, check if there are any favorites/dislikes with this guestSessionId
    const guestData = await prisma.$transaction(async (tx) => {
      const [favorites, dislikes] = await Promise.all([
        tx.favorite.findMany({
          where: { guestSessionId },
          include: { trip: true }
        }),
        tx.dislike.findMany({
          where: { guestSessionId },
          include: { trip: true }
        })
      ]);
      return { favorites, dislikes };
    });

    // If we find any data still tied to guestSessionId, it hasn't been converted
    if (guestData.favorites.length > 0 || guestData.dislikes.length > 0) {
      return { success: true, existingTrip: null, needsConversion: true };
    }

    // Check if there's a trip for this user that matches the session timing/location
    // This is a heuristic approach since we don't have direct session->trip mapping in DB
    const recentTrips = await prisma.trip.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5 // Check recent trips
    });

    return {
      success: true,
      existingTrip: null, // Could implement trip matching logic here if needed
      recentTrips,
      needsConversion: false
    };
  } catch (error) {
    console.error('Error checking existing guest conversion:', error);
    return { success: false, existingTrip: null };
  }
}

/**
 * Get guest session data including favorites/dislikes counts for conversion
 */
export async function getGuestSessionForConversion(guestSessionId: string) {
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
      guestSessionId,
      favoritesCount,
      dislikesCount,
      hasData: favoritesCount > 0 || dislikesCount > 0
    };
  } catch (error) {
    console.error('Error getting guest session data:', error);
    return {
      success: false,
      guestSessionId,
      favoritesCount: 0,
      dislikesCount: 0,
      hasData: false
    };
  }
}