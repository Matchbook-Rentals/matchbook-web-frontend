'use server';

import prisma from '@/lib/prismadb';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserBookings } from './bookings';
import { getUserHousingRequests } from './housing-requests';

export interface DashboardTrip {
  id: string;
  locationString: string | null;
  city: string | null;
  state: string | null;
  startDate: Date | null;
  endDate: Date | null;
  numAdults: number;
  numChildren: number;
  numPets: number;
  createdAt: Date;
}

export interface DashboardListing {
  id: string;
  title: string;
  category: string | null;
  roomCount: number | null;
  bathroomCount: number | null;
  streetAddress1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  shortestLeasePrice: number | null;
  listingImages: { id: string; url: string }[];
  monthlyPricing: { price: number }[];
}

export interface DashboardMatch {
  id: string;
  tripId: string;
  listingId: string;
  monthlyRent: number | null;
  listing: DashboardListing;
}

export interface DashboardFavorite {
  id: string;
  tripId: string;
  listingId: string;
  listing: DashboardListing;
  isApplied: boolean;
}

export interface DashboardBooking {
  id: string;
  listingId: string;
  tripId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number | null;
  status: string | null;
  listing: {
    title: string | null;
    imageSrc: string | null;
    userId: string;
    locationString: string | null;
    listingImages: { id: string; url: string }[];
  } | null;
  trip: {
    numAdults: number;
    numPets: number;
    numChildren: number;
  } | null;
}

export interface DashboardApplication {
  id: string;
  tripId: string;
  listingId: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  hasMatch: boolean;
  listing: DashboardListing & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  trip: {
    numAdults: number;
    numPets: number;
    numChildren: number;
  };
}

export interface RenterDashboardData {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
  } | null;
  recentSearches: DashboardTrip[];
  bookings: DashboardBooking[];
  matches: DashboardMatch[];
  applications: DashboardApplication[];
  favorites: DashboardFavorite[];
}

export async function getRenterDashboardData(): Promise<RenterDashboardData> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Fetch all data in parallel for optimal performance
  const [
    user,
    recentSearchesRaw,
    bookingsRaw,
    matchesRaw,
    applicationsRaw,
    favoritesRaw,
  ] = await Promise.all([
    // User profile data
    currentUser(),

    // Recent Searches: Fetch the 10 most recent trips for the "Recent Searches" section
    // Only need basic trip information, no related data
    prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        locationString: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        numAdults: true,
        numChildren: true,
        numPets: true,
        createdAt: true,
      },
    }),

    // Bookings: Fetch all user bookings
    getUserBookings(),

    // Matches: Fetch all matches across all user trips
    // Include full listing data with images and pricing
    // Note: Match model doesn't have createdAt, so we don't order by date
    prisma.match.findMany({
      where: {
        trip: { userId },
      },
      include: {
        listing: {
          include: {
            listingImages: true,
            monthlyPricing: true,
          },
        },
      },
    }),

    // Applications: Fetch all pending housing requests without matches
    getUserHousingRequests(),

    // Favorites: Fetch ALL favorites across ALL trips (not limited to recent trips)
    // This ensures we show all favorited listings, not just those from the 10 most recent trips
    prisma.favorite.findMany({
      where: {
        trip: { userId },
        listingId: { not: null },
      },
      select: {
        id: true,
        tripId: true,
        listingId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // For favorites, we need to:
  // 1. Filter out favorites that have been upgraded to matches
  // 2. Check which ones have applications
  // 3. Fetch the listing data for each favorite
  
  // Create a set of listing IDs that are now matches (upgraded from favorites)
  // These should not appear in the Favorites section
  const matchedListingIds = new Set(
    matchesRaw.map((match) => match.listingId)
  );

  // Filter out favorites that have been upgraded to matches
  const activeFavorites = favoritesRaw.filter(
    (fav) => fav.listingId !== null && !matchedListingIds.has(fav.listingId as string)
  );

  const favoriteListingIds = activeFavorites.map((fav) => fav.listingId as string);

  // Fetch all housing requests to check which favorites have applications
  const allHousingRequests = await prisma.housingRequest.findMany({
    where: {
      trip: { userId },
      listingId: { in: favoriteListingIds },
    },
    select: {
      listingId: true,
    },
  });

  const listingsWithApplications = new Set(
    allHousingRequests.map((req) => req.listingId)
  );

  // Fetch listing data for all favorites in one query
  let favoriteListingsMap: Map<string, DashboardListing> = new Map();
  if (favoriteListingIds.length > 0) {
    const favoriteListings = await prisma.listing.findMany({
      where: { id: { in: favoriteListingIds } },
      include: {
        listingImages: true,
        monthlyPricing: true,
      },
    });

    favoriteListingsMap = new Map(
      favoriteListings.map((listing) => [
        listing.id,
        {
          id: listing.id,
          title: listing.title,
          category: listing.category,
          roomCount: listing.roomCount,
          bathroomCount: listing.bathroomCount,
          streetAddress1: listing.streetAddress1,
          city: listing.city,
          state: listing.state,
          postalCode: listing.postalCode,
          shortestLeasePrice: listing.shortestLeasePrice,
          listingImages: listing.listingImages.map((img) => ({
            id: img.id,
            url: img.url,
          })),
          monthlyPricing: listing.monthlyPricing.map((p) => ({
            price: p.price,
          })),
        },
      ])
    );
  }

  // Transform data for each section

  // Recent Searches: Already in the correct format from the query
  const recentSearches: DashboardTrip[] = recentSearchesRaw;

  // Bookings: Transform booking data
  const bookings: DashboardBooking[] = bookingsRaw.map((booking) => ({
    id: booking.id,
    listingId: booking.listingId,
    tripId: booking.tripId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    monthlyRent: booking.monthlyRent,
    status: booking.status,
    listing: booking.listing,
    trip: booking.trip,
  }));

  // Matches: Transform match data with listing information
  const matches: DashboardMatch[] = matchesRaw.map((match) => ({
    id: match.id,
    tripId: match.tripId,
    listingId: match.listingId,
    monthlyRent: match.monthlyRent,
    listing: {
      id: match.listing.id,
      title: match.listing.title,
      category: match.listing.category,
      roomCount: match.listing.roomCount,
      bathroomCount: match.listing.bathroomCount,
      streetAddress1: match.listing.streetAddress1,
      city: match.listing.city,
      state: match.listing.state,
      postalCode: match.listing.postalCode,
      shortestLeasePrice: match.listing.shortestLeasePrice,
      listingImages: match.listing.listingImages.map((img) => ({
        id: img.id,
        url: img.url,
      })),
      monthlyPricing: match.listing.monthlyPricing.map((p) => ({
        price: p.price,
      })),
    },
  }));

  // Applications: Filter and transform housing requests
  const applications: DashboardApplication[] = applicationsRaw
    .filter((req) => req.status === 'pending' && !req.hasMatch)
    .map((req) => ({
      id: req.id,
      tripId: req.tripId,
      listingId: req.listingId,
      status: req.status,
      startDate: req.startDate,
      endDate: req.endDate,
      createdAt: req.createdAt,
      hasMatch: req.hasMatch,
      listing: {
        id: req.listing.id,
        title: req.listing.title,
        category: req.listing.category,
        roomCount: req.listing.roomCount,
        bathroomCount: req.listing.bathroomCount,
        streetAddress1: req.listing.streetAddress1,
        city: req.listing.city,
        state: req.listing.state,
        postalCode: req.listing.postalCode,
        shortestLeasePrice: req.listing.shortestLeasePrice,
        listingImages: req.listing.listingImages.map((img) => ({
          id: img.id,
          url: img.url,
        })),
        monthlyPricing: req.listing.monthlyPricing?.map((p) => ({
          price: p.price,
        })) || [],
        user: req.listing.user ? {
          id: req.listing.user.id,
          firstName: req.listing.user.firstName,
          lastName: req.listing.user.lastName,
        } : undefined,
      },
      trip: {
        numAdults: req.trip.numAdults,
        numPets: req.trip.numPets,
        numChildren: req.trip.numChildren,
      },
    }));

  // Favorites: Transform favorite data with listing and application status
  // Note: We're using activeFavorites which already excludes matches
  const favorites: DashboardFavorite[] = activeFavorites
    .map((fav) => {
      const listing = favoriteListingsMap.get(fav.listingId as string);
      
      // Skip favorites without listing data (listing may have been deleted)
      if (!listing) return null;

      return {
        id: fav.id,
        tripId: fav.tripId as string,
        listingId: fav.listingId as string,
        isApplied: listingsWithApplications.has(fav.listingId as string),
        listing,
      };
    })
    .filter((fav): fav is DashboardFavorite => fav !== null);

  return {
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      : null,
    recentSearches,
    bookings,
    matches,
    applications,
    favorites,
  };
}
