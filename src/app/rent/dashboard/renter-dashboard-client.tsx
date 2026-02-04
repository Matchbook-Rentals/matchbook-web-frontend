'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
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
const INITIAL_SEARCHES_COUNT = 3;
const SEARCHES_PER_PAGE = 9;

const SearchCard = ({ trip, compact = false }: { trip: DashboardTrip; compact?: boolean }) => (
  <Link
    href={`/guest/rent/searches/${trip.id}`}
    className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors"
  >
    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <Home className="w-5 h-5 text-gray-500" />
    </div>
    <p className="font-medium text-sm text-[#404040] truncate min-w-0 shrink">
      {getLocationDisplay(trip)}
    </p>
    <p className="text-sm text-gray-500 truncate min-w-0 shrink-[2]">
      {formatDateRange(trip.startDate, trip.endDate)}
    </p>
    <p className="hidden sm:block text-sm text-gray-500 truncate min-w-0 shrink-[3]">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </p>
    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
  </Link>
);

const RecentSearchesSection = ({ searches }: { searches: DashboardTrip[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  if (searches.length === 0) return null;

  const hasMore = searches.length > INITIAL_SEARCHES_COUNT;
  const remainingCount = searches.length - INITIAL_SEARCHES_COUNT;

  const visibleSearches = isExpanded
    ? searches.slice(0, INITIAL_SEARCHES_COUNT + currentPage * SEARCHES_PER_PAGE)
    : searches.slice(0, INITIAL_SEARCHES_COUNT);

  const totalExpandedPages = Math.ceil((searches.length - INITIAL_SEARCHES_COUNT) / SEARCHES_PER_PAGE);
  const hasMorePages = isExpanded && currentPage < totalExpandedPages;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Recent Searches</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {visibleSearches.map((trip) => (
          <SearchCard key={trip.id} trip={trip} compact />
        ))}
      </div>

      {/* See more button */}
      {hasMore && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-4 text-sm text-primaryBrand hover:text-primaryBrand/80 font-medium"
        >
          See more searches ({remainingCount})
        </button>
      )}

      {/* Load more / Show less when expanded */}
      {isExpanded && (
        <div className="flex items-center gap-4 mt-4">
          {hasMorePages && (
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="text-sm text-primaryBrand hover:text-primaryBrand/80 font-medium"
            >
              Load more ({searches.length - visibleSearches.length} remaining)
            </button>
          )}
          <button
            onClick={() => {
              setIsExpanded(false);
              setCurrentPage(1);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Show less
          </button>
        </div>
      )}
    </section>
  );
};

// Bookings Section
const INITIAL_BOOKINGS_COUNT = 3;

const BookingsSection = ({ bookings }: { bookings: DashboardBooking[] }) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  if (bookings.length === 0) return null;

  const handleMessageHost = (hostUserId: string) => {
    router.push(`/app/rent/messages?userId=${hostUserId}`);
  };

  const visibleBookings = showAll ? bookings : bookings.slice(0, INITIAL_BOOKINGS_COUNT);
  const hasMore = bookings.length > INITIAL_BOOKINGS_COUNT;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Your Bookings</h2>
      <div className="space-y-4">
        {visibleBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-inherit rounded-xl overflow-hidden flex flex-col md:flex-row"
          >
            <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 rounded-[12px] overflow-hidden">
              <Image
                src={booking.listing?.listingImages?.[0]?.url || booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                alt={booking.listing?.title || 'Property'}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-poppins font-medium text-[#373940] text-[19px]">
                  {booking.listing?.title || 'Untitled Property'}
                </h3>
                <div className="flex flex-col justify-center py-1 flex-1">
                  <p className="font-poppins font-normal text-[15px] text-[#777B8B]">
                    {formatDateRange(booking.startDate, booking.endDate)}
                  </p>
                </div>
                <div className="flex flex-col justify-center py-1 flex-1">
                  <p className="font-poppins font-normal text-[15px] text-[#777B8B]">
                    {booking.listing?.locationString || 'Location not available'}
                  </p>
                </div>
                {booking.trip && (
                  <div className="flex flex-col justify-center py-1 flex-1">
                    <p className="font-poppins font-normal text-[15px] text-[#777B8B]">
                      {formatOccupants(booking.trip.numAdults, booking.trip.numChildren, booking.trip.numPets)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <BrandButton variant="outline" size="sm" href={`/app/rent/bookings/${booking.id}`}>
                  View Details
                </BrandButton>
                {booking.listing?.userId && (
                  <BrandButton
                    variant="default"
                    size="sm"
                    onClick={() => handleMessageHost(booking.listing!.userId)}
                  >
                    Message Host
                  </BrandButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm text-primaryBrand hover:text-primaryBrand/80 font-medium"
        >
          View More Bookings ({bookings.length - INITIAL_BOOKINGS_COUNT})
        </button>
      )}
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
            initialFavorited={true}
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
