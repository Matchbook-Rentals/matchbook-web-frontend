/**
 * Guest session database helpers for E2E tests.
 *
 * Uses direct Prisma calls instead of dev API routes.
 * Safe: this file lives in e2e/ which is tracked in git but never part of the Next.js build.
 */
import { getTestPrisma } from './prisma';

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

/**
 * Create a guest session directly in the database.
 * Returns the session ID (a UUID).
 */
export async function createGuestSessionInDb(params: {
  locationString?: string;
  latitude?: number;
  longitude?: number;
}): Promise<string> {
  const prisma = getTestPrisma();

  const session = await prisma.guestSession.create({
    data: {
      locationString: params.locationString ?? 'E2E Test Location',
      latitude: params.latitude ?? 40.7608,
      longitude: params.longitude ?? -111.891,
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      expiresAt: new Date(Date.now() + TEN_YEARS_MS),
    },
  });

  return session.id;
}

/**
 * Add a guest favorite to the database.
 */
export async function addGuestFavorite(guestSessionId: string, listingId: string): Promise<void> {
  const prisma = getTestPrisma();

  await prisma.favorite.create({
    data: {
      guestSessionId,
      listingId,
    },
  });
}

/**
 * Get all favorites for a guest session.
 */
export async function getGuestFavorites(guestSessionId: string): Promise<string[]> {
  const prisma = getTestPrisma();

  const favorites = await prisma.favorite.findMany({
    where: { guestSessionId },
    select: { listingId: true },
  });

  return favorites.map(f => f.listingId).filter(Boolean) as string[];
}

/**
 * Check if a guest session has been converted (has a tripId and convertedAt).
 */
export async function isGuestSessionConverted(guestSessionId: string): Promise<boolean> {
  const prisma = getTestPrisma();

  const session = await prisma.guestSession.findUnique({
    where: { id: guestSessionId },
    select: { convertedAt: true, tripId: true },
  });

  return session?.convertedAt != null && session?.tripId != null;
}

/**
 * Get the trip ID a guest session was converted into.
 */
export async function getConvertedTripId(guestSessionId: string): Promise<string | null> {
  const prisma = getTestPrisma();

  const session = await prisma.guestSession.findUnique({
    where: { id: guestSessionId },
    select: { tripId: true },
  });

  return session?.tripId ?? null;
}

/**
 * Get favorites that belong to a trip (post-conversion).
 */
export async function getTripFavorites(tripId: string): Promise<string[]> {
  const prisma = getTestPrisma();

  const favorites = await prisma.favorite.findMany({
    where: { tripId },
    select: { listingId: true },
  });

  return favorites.map(f => f.listingId).filter(Boolean) as string[];
}

/**
 * Get listing IDs from the most popular areas (for use in tests).
 */
export async function getTestListingIds(count: number = 3): Promise<string[]> {
  const prisma = getTestPrisma();

  // Use numeric range to implicitly exclude null values
  const listings = await prisma.listing.findMany({
    where: {
      deletedAt: null,
      latitude: { gte: -90 },
      longitude: { gte: -180 },
    },
    select: { id: true },
    take: count,
    orderBy: { createdAt: 'desc' },
  });

  return listings.map(l => l.id);
}

/**
 * Clean up a guest session and its associated favorites/dislikes.
 */
export async function cleanupGuestSession(guestSessionId: string): Promise<void> {
  const prisma = getTestPrisma();

  await prisma.favorite.deleteMany({ where: { guestSessionId } });
  await prisma.dislike.deleteMany({ where: { guestSessionId } });
  await prisma.guestSession.delete({ where: { id: guestSessionId } }).catch(() => {
    // Ignore if already deleted
  });
}

/**
 * Clean up a trip and its associated favorites/dislikes.
 */
export async function cleanupTrip(tripId: string): Promise<void> {
  const prisma = getTestPrisma();

  await prisma.favorite.deleteMany({ where: { tripId } });
  await prisma.dislike.deleteMany({ where: { tripId } });
  await prisma.trip.delete({ where: { id: tripId } }).catch(() => {
    // Ignore if already deleted
  });
}
