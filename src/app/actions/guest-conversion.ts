'use server'

import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';
import { markSessionAsConverted } from './guest-session-db';

/**
 * Check if a guest session has already been converted to a trip for this user
 */
export async function checkExistingGuestConversion(guestSessionId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, existingTrip: null };
    }

    // Check if the guest session has already been converted
    const guestSession = await prisma.guestSession.findUnique({
      where: { id: guestSessionId },
      include: {
        trip: true,
        favorites: true,
        dislikes: true
      }
    });

    if (!guestSession) {
      return { success: false, existingTrip: null, error: 'Guest session not found' };
    }

    // If session has already been converted to a trip
    if (guestSession.convertedAt && guestSession.trip) {
      // Check if the converted trip belongs to this user
      if (guestSession.trip.userId === userId) {
        return {
          success: true,
          existingTrip: guestSession.trip,
          needsConversion: false,
          alreadyConverted: true
        };
      } else {
        // Session was converted but for a different user (shouldn't happen)
        return {
          success: false,
          existingTrip: null,
          error: 'Session converted for different user'
        };
      }
    }

    // Session hasn't been converted yet
    return {
      success: true,
      existingTrip: null,
      needsConversion: true,
      alreadyConverted: false,
      hasData: guestSession.favorites.length > 0 || guestSession.dislikes.length > 0
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
    // Get session data with related counts
    const guestSession = await prisma.guestSession.findUnique({
      where: { id: guestSessionId },
      include: {
        _count: {
          select: {
            favorites: true,
            dislikes: true
          }
        },
        trip: true // Include trip info if already converted
      }
    });

    if (!guestSession) {
      return {
        success: false,
        guestSessionId,
        favoritesCount: 0,
        dislikesCount: 0,
        hasData: false,
        error: 'Guest session not found'
      };
    }

    // Check if session is expired
    if (Date.now() > guestSession.expiresAt.getTime()) {
      return {
        success: false,
        guestSessionId,
        favoritesCount: 0,
        dislikesCount: 0,
        hasData: false,
        error: 'Guest session expired'
      };
    }

    return {
      success: true,
      guestSessionId,
      favoritesCount: guestSession._count.favorites,
      dislikesCount: guestSession._count.dislikes,
      hasData: guestSession._count.favorites > 0 || guestSession._count.dislikes > 0,
      isConverted: !!guestSession.convertedAt,
      tripId: guestSession.tripId
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