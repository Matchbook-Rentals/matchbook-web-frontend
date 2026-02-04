'use server';

import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

export interface HomepageUserState {
  favoritedListingIds: string[];
  matchedListings: { listingId: string; matchId: string; tripId: string }[];
  appliedListingIds: string[];
}

export async function getHomepageUserState(): Promise<HomepageUserState | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const trips = await prisma.trip.findMany({
    where: { userId },
    select: {
      id: true,
      favorites: {
        where: { listingId: { not: null } },
        select: { listingId: true }
      },
      matches: {
        select: { id: true, listingId: true }
      },
      housingRequests: {
        where: { status: 'pending' },
        select: { listingId: true }
      }
    }
  });

  // Aggregate across all trips
  const favoritedListingIds = new Set<string>();
  const matchedListings: { listingId: string; matchId: string; tripId: string }[] = [];
  const appliedListingIds = new Set<string>();

  for (const trip of trips) {
    for (const fav of trip.favorites) {
      if (fav.listingId) favoritedListingIds.add(fav.listingId);
    }
    for (const match of trip.matches) {
      matchedListings.push({ listingId: match.listingId, matchId: match.id, tripId: trip.id });
    }
    for (const req of trip.housingRequests) {
      appliedListingIds.add(req.listingId);
    }
  }

  return {
    favoritedListingIds: Array.from(favoritedListingIds),
    matchedListings,
    appliedListingIds: Array.from(appliedListingIds)
  };
}
