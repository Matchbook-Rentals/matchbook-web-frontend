import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { getListingSections } from '@/lib/listings/get-listing-sections';

export async function GET() {
  // Find user by email
  const clerkUser = await prisma.user.findFirst({
    where: { email: 'tyler.bennett52@gmail.com' },
  });
  const userId = clerkUser?.id || null;

  // Raw data check
  const trips = userId ? await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      favorites: { select: { id: true, listingId: true } },
      matches: { select: { id: true, listingId: true } },
    },
  }) : [];

  // Get sections from our function
  const { sections, tripData } = await getListingSections(userId);

  // Check ALL listings (any status)
  const totalCount = await prisma.listing.count();
  const publishedCount = await prisma.listing.count({ where: { approvalStatus: 'approved' } });

  // Listings by status
  const statusCounts = await prisma.listing.groupBy({
    by: ['status'],
    _count: true,
  });

  // Find listings with non-zero coordinates (any status)
  const realListings = await prisma.listing.findMany({
    where: {
      NOT: { latitude: 0, longitude: 0 },
    },
    select: { id: true, city: true, state: true, latitude: true, longitude: true, status: true },
    take: 20,
  });

  // Sample of all listings
  const allListings = await prisma.listing.findMany({
    select: { id: true, city: true, state: true, latitude: true, longitude: true, status: true },
    take: 10,
  });

  // Check listings near each trip location
  const listingsNearTrips = await Promise.all(
    trips.map(async (t) => {
      const radiusDegrees = (t.searchRadius || 50) / 69;
      const count = await prisma.listing.count({
        where: {
          approvalStatus: 'approved',
          latitude: { gte: t.latitude - radiusDegrees, lte: t.latitude + radiusDegrees },
          longitude: { gte: t.longitude - radiusDegrees, lte: t.longitude + radiusDegrees },
        },
      });
      return { location: t.locationString, count };
    })
  );

  return NextResponse.json({
    userId,
    tripCount: trips.length,
    listingCounts: { total: totalCount, published: publishedCount, byStatus: statusCounts },
    realListingsWithCoords: realListings,
    sampleListings: allListings,
    listingsNearTrips,
    trips: trips.map(t => ({
      id: t.id,
      city: t.city,
      locationString: t.locationString,
      latitude: t.latitude,
      longitude: t.longitude,
      searchRadius: t.searchRadius,
      createdAt: t.createdAt,
      favoritesCount: t.favorites.length,
      favorites: t.favorites,
      matchesCount: t.matches.length,
      matches: t.matches,
    })),
    tripData,
    sectionsCount: sections.length,
    sections: sections.map(s => ({
      type: s.type,
      title: s.title,
      listingsCount: s.listings.length,
      listingIds: s.listings.map(l => l.id),
    })),
  }, { status: 200 });
}
