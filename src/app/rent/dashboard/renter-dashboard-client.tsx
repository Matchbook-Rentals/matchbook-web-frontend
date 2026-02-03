'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import type {
  RenterDashboardData,
  DashboardTrip,
  DashboardBooking,
  DashboardMatch,
  DashboardApplication,
  DashboardFavorite,
} from '@/app/actions/renter-dashboard';

interface RenterDashboardClientProps {
  data: RenterDashboardData;
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

// Helper functions
const formatDateRange = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate || !endDate) return 'Dates not set';

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear().toString().slice(-2);
    return `${month} ${day}, ${year}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const formatOccupants = (numAdults: number, numChildren: number, numPets: number): string => {
  const parts: string[] = [];
  const totalRenters = numAdults + numChildren;
  if (totalRenters > 0) parts.push(`${totalRenters} renter${totalRenters !== 1 ? 's' : ''}`);
  if (numPets > 0) parts.push(`${numPets} pet${numPets !== 1 ? 's' : ''}`);
  return parts.join(', ') || '1 renter';
};

const getLocationDisplay = (trip: DashboardTrip): string => {
  if (trip.city && trip.state) return `${trip.city}, ${trip.state}`;
  if (trip.locationString) return trip.locationString;
  return 'Location not set';
};

// Dashboard Header
const DashboardHeader = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold text-[#404040]">Renter Dashboard</h1>
  </div>
);

// Recent Searches Section
const RecentSearchesSection = ({ searches }: { searches: DashboardTrip[] }) => {
  if (searches.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Recent Searches</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {searches.map((trip) => (
          <Link
            key={trip.id}
            href={`/guest/rent/searches/${trip.id}`}
            className="flex-shrink-0 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors min-w-[300px]"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#404040] truncate">
                {getLocationDisplay(trip)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
              <p className="text-xs text-gray-500">
                {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};

// Bookings Section
const BookingsSection = ({ bookings }: { bookings: DashboardBooking[] }) => {
  const router = useRouter();

  if (bookings.length === 0) return null;

  const handleMessageHost = (hostUserId: string) => {
    router.push(`/app/rent/messages?userId=${hostUserId}`);
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Your Bookings</h2>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row"
          >
            <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
              <Image
                src={booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                alt={booking.listing?.title || 'Property'}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-[#404040] text-lg">
                  {booking.listing?.title || 'Untitled Property'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateRange(booking.startDate, booking.endDate)}
                </p>
                <p className="text-sm text-gray-500">
                  {booking.listing?.locationString || 'Location not available'}
                </p>
                {booking.trip && (
                  <p className="text-sm text-gray-500">
                    {formatOccupants(booking.trip.numAdults, booking.trip.numChildren, booking.trip.numPets)}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/app/rent/bookings/${booking.id}`}>View Details</Link>
                </Button>
                {booking.listing?.userId && (
                  <Button
                    size="sm"
                    className="bg-primaryBrand hover:bg-primaryBrand/90 text-white"
                    onClick={() => handleMessageHost(booking.listing!.userId)}
                  >
                    Message Host
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Matches Section
const MatchesSection = ({ matches }: { matches: DashboardMatch[] }) => {
  const router = useRouter();

  if (matches.length === 0) return null;

  const handleBookNow = (matchId: string) => {
    router.push(`/app/rent/match/${matchId}/lease-signing`);
  };

  // Transform matches to listing format for HomepageListingCard
  const matchListings = matches.map((match) => ({
    ...match.listing,
    listingImages: match.listing.listingImages.map((img) => ({
      ...img,
      listingId: match.listingId,
      category: null,
      rank: 0,
      createdAt: new Date(),
    })),
  }));

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Your Matches</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {matches.map((match, index) => (
          <HomepageListingCard
            key={match.id}
            listing={matchListings[index] as any}
            badge="matched"
            matchId={match.id}
            tripId={match.tripId}
            onBookNow={handleBookNow}
          />
        ))}
      </div>
    </section>
  );
};

// Applications Section
const ApplicationsSection = ({ applications }: { applications: DashboardApplication[] }) => {
  const router = useRouter();

  if (applications.length === 0) return null;

  const handleMessageHost = (hostUserId: string) => {
    router.push(`/app/rent/messages?userId=${hostUserId}`);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#404040]">Pending Applications</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/rent/applications">Your Applications</Link>
        </Button>
      </div>
      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row"
          >
            <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0">
              <Image
                src={app.listing.listingImages[0]?.url || PLACEHOLDER_IMAGE}
                alt={app.listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[#404040]">{app.listing.title}</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateRange(app.startDate, app.endDate)}
                </p>
                <p className="text-sm text-gray-500">{app.listing.state}</p>
                <p className="text-sm text-gray-500">
                  {formatOccupants(app.trip.numAdults, app.trip.numChildren, app.trip.numPets)}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/app/rent/applications/${app.id}`}>View</Link>
                </Button>
                {app.listing.user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessageHost(app.listing.user!.id)}
                  >
                    Message Host
                  </Button>
                )}
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Favorites Section
const FavoritesSection = ({ favorites }: { favorites: DashboardFavorite[] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();

  if (favorites.length === 0) return null;

  const handleApply = async () => {
    // This would be handled by the HomepageListingCard component
  };

  // Transform favorites to listing format for HomepageListingCard
  const favoriteListings = favorites.map((fav) => ({
    ...fav.listing,
    listingImages: fav.listing.listingImages.map((img) => ({
      ...img,
      listingId: fav.listingId,
      category: null,
      rank: 0,
      createdAt: new Date(),
    })),
  }));

  return (
    <section className="mb-8">
      <button
        className="flex items-center gap-2 mb-4 w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-medium text-[#404040]">Favorites</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
        <span className="text-sm text-gray-500">({favorites.length})</span>
      </button>
      {isExpanded && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {favorites.map((fav, index) => (
            <HomepageListingCard
              key={fav.id}
              listing={favoriteListings[index] as any}
              badge="liked"
              tripId={fav.tripId}
              isApplied={fav.isApplied}
              initialFavorited={true}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// Empty State
const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Home className="w-8 h-8 text-gray-400" />
    </div>
    <h2 className="text-xl font-medium text-[#404040] mb-2">No activity yet</h2>
    <p className="text-gray-500 mb-6">Start searching for your perfect rental home</p>
    <Button asChild className="bg-primaryBrand hover:bg-primaryBrand/90">
      <Link href="/">Start Searching</Link>
    </Button>
  </div>
);

export default function RenterDashboardClient({ data }: RenterDashboardClientProps) {
  const { recentSearches, bookings, matches, applications, favorites } = data;

  const hasContent =
    recentSearches.length > 0 ||
    bookings.length > 0 ||
    matches.length > 0 ||
    applications.length > 0 ||
    favorites.length > 0;

  return (
    <div className={`py-6 ${APP_PAGE_MARGIN}`}>
      <DashboardHeader />
      {hasContent ? (
        <>
          <RecentSearchesSection searches={recentSearches} />
          <BookingsSection bookings={bookings} />
          <MatchesSection matches={matches} />
          <ApplicationsSection applications={applications} />
          <FavoritesSection favorites={favorites} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
