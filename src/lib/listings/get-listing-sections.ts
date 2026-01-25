import prisma from "@/lib/prismadb";
import { ListingAndImages } from "@/types";

const LISTINGS_PER_SECTION = 10;
const MAX_RECENT_SEARCHES = 2;

export interface ListingSection {
  type: 'recent-search' | 'liked' | 'random';
  title: string;
  listings: ListingAndImages[];
  tripId?: string;
}

interface TripWithFavorites {
  id: string;
  city: string | null;
  locationString: string;
  latitude: number;
  longitude: number;
  searchRadius: number | null;
  favorites: { listingId: string | null }[];
  matches: { listingId: string | null }[];
}

export interface UserTripData {
  tripLocation: string | null;
  favoriteListingIds: string[];
  matchedListingIds: string[];
}

/**
 * Serializes listing dates for client compatibility
 */
function serializeListing(listing: any): ListingAndImages {
  return {
    ...listing,
    createdAt: listing.createdAt instanceof Date ? listing.createdAt.toISOString() : listing.createdAt,
    updatedAt: listing.updatedAt instanceof Date ? listing.updatedAt.toISOString() : listing.updatedAt,
    availableFrom: listing.availableFrom instanceof Date ? listing.availableFrom.toISOString() : listing.availableFrom,
    availableTo: listing.availableTo instanceof Date ? listing.availableTo.toISOString() : listing.availableTo,
    listingImages: listing.listingImages?.map((img: any) => ({
      ...img,
      createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt,
      updatedAt: img.updatedAt instanceof Date ? img.updatedAt.toISOString() : img.updatedAt,
    })) || [],
  } as ListingAndImages;
}

/**
 * Fetches full listing data for given IDs with images
 */
async function fetchListingsWithImages(listingIds: string[], limit?: number): Promise<ListingAndImages[]> {
  if (listingIds.length === 0) return [];

  const idsToFetch = limit ? listingIds.slice(0, limit) : listingIds;

  const listings = await prisma.listing.findMany({
    where: { id: { in: idsToFetch } },
    include: { listingImages: true },
  });

  return listings.map(serializeListing);
}

/**
 * Standard listing filter criteria (matches pullListingsFromDb)
 */
const LISTING_FILTER = {
  approvalStatus: 'approved' as const,
  markedActiveByUser: true,
  deletedAt: null,
};

/**
 * Fetches random listings, excluding specified IDs
 */
async function fetchRandomListings(excludeIds: string[], limit: number): Promise<ListingAndImages[]> {
  const listings = await prisma.listing.findMany({
    where: {
      id: { notIn: excludeIds },
      ...LISTING_FILTER,
    },
    include: { listingImages: true },
    take: limit * 2, // Fetch extra to allow for randomization
  });

  // Shuffle and take limit
  const shuffled = listings.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit).map(serializeListing);
}

/**
 * Gets user's recent trips with their favorites and matches
 */
async function getRecentTrips(userId: string, limit: number): Promise<TripWithFavorites[]> {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      favorites: { select: { listingId: true } },
      matches: { select: { listingId: true } },
    },
  });
}

/**
 * Haversine formula to calculate distance between two points in miles
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Fetches listings near a location using Haversine formula
 */
async function fetchListingsNearLocation(
  lat: number,
  lng: number,
  radiusMiles: number,
  excludeIds: string[],
  limit: number
): Promise<ListingAndImages[]> {
  // First, get a broader set using bounding box (for performance)
  // Then filter with Haversine for accuracy
  const roughRadiusDegrees = radiusMiles / 50; // Generous bounding box

  const candidates = await prisma.listing.findMany({
    where: {
      id: { notIn: excludeIds },
      ...LISTING_FILTER,
      latitude: {
        gte: lat - roughRadiusDegrees,
        lte: lat + roughRadiusDegrees,
      },
      longitude: {
        gte: lng - roughRadiusDegrees,
        lte: lng + roughRadiusDegrees,
      },
    },
    include: { listingImages: true },
  });

  // Filter by actual Haversine distance and sort by distance
  const listingsWithDistance = candidates
    .map(listing => ({
      listing,
      distance: haversineDistance(lat, lng, listing.latitude ?? 0, listing.longitude ?? 0),
    }))
    .filter(item => item.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return listingsWithDistance.map(item => serializeListing(item.listing));
}

/**
 * Extracts valid listing IDs from favorites and matches
 */
function extractListingIds(trip: TripWithFavorites): { favoriteIds: string[]; matchedIds: string[] } {
  const favoriteIds = trip.favorites
    .map(f => f.listingId)
    .filter((id): id is string => id !== null);

  const matchedIds = trip.matches
    .map(m => m.listingId)
    .filter((id): id is string => id !== null);

  return { favoriteIds, matchedIds };
}

/**
 * Gets location string for a trip
 */
function getTripLocation(trip: TripWithFavorites): string {
  return trip.city || trip.locationString || 'your area';
}

/**
 * Builds a "Recent Search" section for a trip
 * Prioritizes favorites/matches, then fills with nearby listings
 */
async function buildRecentSearchSection(
  trip: TripWithFavorites,
  usedListingIds: Set<string>
): Promise<{ section: ListingSection | null; listingIds: string[] }> {
  const { favoriteIds, matchedIds } = extractListingIds(trip);
  const priorityIds = [...new Set([...matchedIds, ...favoriteIds])]; // Matched first

  // Filter out already-used listings
  const availablePriorityIds = priorityIds.filter(id => !usedListingIds.has(id));

  // Fetch priority listings (favorites/matches) first
  const priorityListings = await fetchListingsWithImages(availablePriorityIds, LISTINGS_PER_SECTION);

  // Calculate how many more we need to fill the section
  const remainingSlots = LISTINGS_PER_SECTION - priorityListings.length;

  // Track IDs we've used so far
  const usedInSection = new Set([...usedListingIds, ...priorityListings.map(l => l.id)]);

  // Fill remaining slots with nearby listings from trip's search area
  let nearbyListings: ListingAndImages[] = [];
  if (remainingSlots > 0 && trip.latitude && trip.longitude) {
    const searchRadius = trip.searchRadius || 50; // Default 50 miles
    nearbyListings = await fetchListingsNearLocation(
      trip.latitude,
      trip.longitude,
      searchRadius,
      [...usedInSection],
      remainingSlots
    );
  }

  const allListings = [...priorityListings, ...nearbyListings];

  if (allListings.length === 0) {
    return { section: null, listingIds: [] };
  }

  const location = getTripLocation(trip);

  return {
    section: {
      type: 'recent-search',
      title: `Your recent search in ${location}`,
      listings: allListings,
      tripId: trip.id,
    },
    listingIds: allListings.map(l => l.id),
  };
}

/**
 * Builds "Liked Listings" section from all user favorites not yet shown
 */
async function buildLikedSection(
  trips: TripWithFavorites[],
  usedListingIds: Set<string>
): Promise<{ section: ListingSection | null; listingIds: string[] }> {
  // Gather all favorite IDs across all trips
  const allFavoriteIds = trips.flatMap(trip =>
    trip.favorites.map(f => f.listingId).filter((id): id is string => id !== null)
  );

  // Filter out already-used listings
  const availableIds = [...new Set(allFavoriteIds)].filter(id => !usedListingIds.has(id));

  if (availableIds.length === 0) {
    return { section: null, listingIds: [] };
  }

  const listings = await fetchListingsWithImages(availableIds, LISTINGS_PER_SECTION);

  if (listings.length === 0) {
    return { section: null, listingIds: [] };
  }

  return {
    section: {
      type: 'liked',
      title: 'Listings you liked',
      listings,
    },
    listingIds: listings.map(l => l.id),
  };
}

export interface GetListingSectionsResult {
  sections: ListingSection[];
  tripData: UserTripData;
}

/**
 * Main function to determine which listing sections to display and in what order.
 *
 * Logic:
 * 1. Up to 2 most recent trip searches (10 listings each)
 * 2. Liked listings (favorites not already shown)
 * 3. Random listings to fill
 */
export async function getListingSections(userId: string | null): Promise<GetListingSectionsResult> {
  const sections: ListingSection[] = [];
  const usedListingIds = new Set<string>();

  // Default trip data for non-logged-in users
  let tripData: UserTripData = {
    tripLocation: null,
    favoriteListingIds: [],
    matchedListingIds: [],
  };

  if (userId) {
    const recentTrips = await getRecentTrips(userId, MAX_RECENT_SEARCHES);

    // Build trip data from most recent trip (for badge logic)
    if (recentTrips.length > 0) {
      const mostRecent = recentTrips[0];
      const { favoriteIds, matchedIds } = extractListingIds(mostRecent);
      tripData = {
        tripLocation: getTripLocation(mostRecent),
        favoriteListingIds: favoriteIds,
        matchedListingIds: matchedIds,
      };
    }

    // Section 1 & 2: Recent searches (up to 2 trips)
    for (const trip of recentTrips) {
      const { section, listingIds } = await buildRecentSearchSection(trip, usedListingIds);
      if (section) {
        sections.push(section);
        listingIds.forEach(id => usedListingIds.add(id));
      }
    }

    // Section 3: Liked listings (favorites not already shown)
    const { section: likedSection, listingIds: likedIds } = await buildLikedSection(recentTrips, usedListingIds);
    if (likedSection) {
      sections.push(likedSection);
      likedIds.forEach(id => usedListingIds.add(id));
    }
  }

  // Section 4: Random listings
  const randomListings = await fetchRandomListings([...usedListingIds], LISTINGS_PER_SECTION);
  if (randomListings.length > 0) {
    sections.push({
      type: 'random',
      title: 'Explore rentals',
      listings: randomListings,
    });
  }

  return { sections, tripData };
}
