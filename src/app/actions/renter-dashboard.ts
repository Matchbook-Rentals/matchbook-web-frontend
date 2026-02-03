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

  const user = await currentUser();

  // Fetch trips with favorites (without listing), matches (with listing), and housing requests
  const [trips, bookingsRaw, housingRequestsRaw] = await Promise.all([
    prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        favorites: true,
        matches: {
          include: {
            listing: {
              include: {
                listingImages: true,
                monthlyPricing: true,
              },
            },
          },
        },
        housingRequests: true,
      },
    }),
    getUserBookings(),
    getUserHousingRequests(),
  ]);

  // Collect all favorite listingIds to fetch listings separately
  const favoriteListingIds = trips.flatMap((trip) =>
    trip.favorites
      .filter((fav) => fav.listingId !== null)
      .map((fav) => fav.listingId as string)
  );

  // Fetch listings for favorites if there are any
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

  // Transform trips for recent searches
  const recentSearches: DashboardTrip[] = trips.map((trip) => ({
    id: trip.id,
    locationString: trip.locationString,
    city: trip.city,
    state: trip.state,
    startDate: trip.startDate,
    endDate: trip.endDate,
    numAdults: trip.numAdults,
    numChildren: trip.numChildren,
    numPets: trip.numPets,
    createdAt: trip.createdAt,
  }));

  // Transform bookings
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

  // Collect all matches from all trips
  const matches: DashboardMatch[] = trips.flatMap((trip) =>
    trip.matches.map((match) => ({
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
    }))
  );

  // Transform housing requests to applications (pending ones without matches)
  const applications: DashboardApplication[] = housingRequestsRaw
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

  // Collect all favorites from all trips, marking which ones have applications
  const favorites: DashboardFavorite[] = trips.flatMap((trip) =>
    trip.favorites
      .filter((fav) => fav.listingId !== null && fav.tripId !== null)
      .map((fav) => {
        const hasApplication = trip.housingRequests.some(
          (req) => req.listingId === fav.listingId
        );
        const listing = favoriteListingsMap.get(fav.listingId as string);

        // Skip favorites without listing data
        if (!listing) return null;

        return {
          id: fav.id,
          tripId: fav.tripId as string,
          listingId: fav.listingId as string,
          isApplied: hasApplication,
          listing,
        };
      })
      .filter((fav): fav is DashboardFavorite => fav !== null)
  );

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
