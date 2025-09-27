'use server'

import prisma from '@/lib/prismadb';
import { GuestSession } from '@/utils/guest-session';

/**
 * Server actions for guest session database operations
 * Replaces client-side localStorage/cookie storage with database persistence
 */

interface CreateGuestSessionData {
  locationString: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}

interface CreateGuestSessionResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Create a new guest session in the database
 */
export async function createGuestSession(data: CreateGuestSessionData): Promise<CreateGuestSessionResponse> {
  try {
    const today = new Date();
    let { startDate, endDate } = data;

    // Handle date logic (same as existing guest trip creation)
    if (!startDate && !endDate) {
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    } else if (startDate && !endDate) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (!startDate && endDate) {
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));

    const guestSession = await prisma.guestSession.create({
      data: {
        locationString: data.locationString,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        state: data.state,
        startDate,
        endDate,
        numAdults: data.numAdults || 1,
        numChildren: data.numChildren || 0,
        numPets: data.numPets || 0,
        expiresAt,
      },
    });

    return {
      success: true,
      sessionId: guestSession.id,
    };
  } catch (error) {
    console.error('Error creating guest session:', error);
    return {
      success: false,
      error: 'Failed to create guest session',
    };
  }
}

/**
 * Get a guest session by ID
 */
export async function getGuestSession(sessionId: string): Promise<GuestSession | null> {
  try {
    const guestSession = await prisma.guestSession.findUnique({
      where: { id: sessionId },
      include: {
        favorites: {
          select: { listingId: true }
        },
        dislikes: {
          select: { listingId: true }
        }
      }
    });

    if (!guestSession) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > guestSession.expiresAt.getTime()) {
      // Optionally clean up expired session
      await cleanupExpiredSession(sessionId);
      return null;
    }

    // Convert database model to GuestSession interface format
    return {
      id: guestSession.id,
      searchParams: {
        location: guestSession.locationString,
        lat: guestSession.latitude,
        lng: guestSession.longitude,
        startDate: guestSession.startDate,
        endDate: guestSession.endDate,
        guests: {
          adults: guestSession.numAdults,
          children: guestSession.numChildren,
          pets: guestSession.numPets,
        },
      },
      pendingActions: [], // Not stored in DB yet, can be added later if needed
      createdAt: guestSession.createdAt.getTime(),
      expiresAt: guestSession.expiresAt.getTime(),
      tripId: guestSession.tripId,
    };
  } catch (error) {
    console.error('Error fetching guest session:', error);
    return null;
  }
}

/**
 * Update guest session search parameters
 */
export async function updateGuestSession(
  sessionId: string,
  updates: Partial<CreateGuestSessionData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if session exists and is not expired
    const existingSession = await prisma.guestSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return { success: false, error: 'Session not found' };
    }

    if (Date.now() > existingSession.expiresAt.getTime()) {
      return { success: false, error: 'Session expired' };
    }

    await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating guest session:', error);
    return { success: false, error: 'Failed to update session' };
  }
}

/**
 * Mark guest session as converted to an authenticated trip
 */
export async function markSessionAsConverted(
  sessionId: string,
  tripId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        convertedAt: new Date(),
        tripId: tripId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking session as converted:', error);
    return { success: false, error: 'Failed to mark session as converted' };
  }
}

/**
 * Extend guest session expiration by additional hours
 */
export async function extendGuestSession(
  sessionId: string,
  additionalHours: number = 24
): Promise<{ success: boolean; error?: string }> {
  try {
    const newExpiresAt = new Date(Date.now() + (additionalHours * 60 * 60 * 1000));

    await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error extending guest session:', error);
    return { success: false, error: 'Failed to extend session' };
  }
}

/**
 * Clean up a specific expired session
 */
export async function cleanupExpiredSession(sessionId: string): Promise<void> {
  try {
    // Only delete if expired and not converted
    await prisma.guestSession.deleteMany({
      where: {
        id: sessionId,
        expiresAt: { lt: new Date() },
        convertedAt: null,
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired session:', error);
  }
}

/**
 * Clean up all expired unconverted sessions (for scheduled cleanup)
 */
export async function cleanupExpiredSessions(): Promise<{ deletedCount: number }> {
  try {
    const result = await prisma.guestSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        convertedAt: null,
      },
    });

    console.log(`Cleaned up ${result.count} expired guest sessions`);
    return { deletedCount: result.count };
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return { deletedCount: 0 };
  }
}

/**
 * Get guest session analytics (optional, for admin use)
 */
export async function getGuestSessionStats(): Promise<{
  activeSessions: number;
  expiredSessions: number;
  convertedSessions: number;
}> {
  try {
    const now = new Date();

    const [activeCount, expiredCount, convertedCount] = await Promise.all([
      prisma.guestSession.count({
        where: {
          expiresAt: { gt: now },
          convertedAt: null,
        },
      }),
      prisma.guestSession.count({
        where: {
          expiresAt: { lt: now },
          convertedAt: null,
        },
      }),
      prisma.guestSession.count({
        where: {
          convertedAt: { not: null },
        },
      }),
    ]);

    return {
      activeSessions: activeCount,
      expiredSessions: expiredCount,
      convertedSessions: convertedCount,
    };
  } catch (error) {
    console.error('Error getting guest session stats:', error);
    return {
      activeSessions: 0,
      expiredSessions: 0,
      convertedSessions: 0,
    };
  }
}