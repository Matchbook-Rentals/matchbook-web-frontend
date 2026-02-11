'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { SingleFamilyIcon } from '@/components/icons-v3';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Card, CardContent } from '@/components/ui/card';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import { RenterDashboardApplicationCard } from './renter-dashboard-application-card';
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
    className="flex w-full max-w-[318px] h-[52px] items-center gap-2 px-0 hover:bg-transparent"
  >
    <div className="flex w-9 h-9 items-center justify-center p-3 bg-white rounded-[10px] border border-solid border-[#eaecf0] shadow-shadows-shadow-xs shrink-0">
      <SingleFamilyIcon className="w-6 h-6" />
    </div>

    <div className="flex items-center justify-center min-w-[77px] h-[52px] font-poppins font-medium text-[#373940] text-[11px] tracking-[0] leading-[normal]">
      {getLocationDisplay(trip)}
    </div>

    <div className="flex items-center justify-center min-w-[109px] h-[52px] font-poppins font-normal text-[#777b8b] text-[10px] tracking-[0] leading-[normal]">
      {formatDateRange(trip.startDate, trip.endDate)}
    </div>

    <div className="flex items-center justify-center min-w-[72px] h-[52px] font-poppins font-normal text-[#777b8b] text-[10px] tracking-[0] leading-[normal]">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </div>

    <ChevronRight className="w-[15px] h-[15px] text-gray-700 shrink-0" />
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
  const [showAll, setShowAll] = useState(false);

  if (bookings.length === 0) return null;

  const visibleBookings = showAll ? bookings : bookings.slice(0, INITIAL_BOOKINGS_COUNT);
  const hasMore = bookings.length > INITIAL_BOOKINGS_COUNT;

  return (
    <section>
      <h2 className="text-lg font-medium text-[#404040] mb-4 md:mb-6 lg:mb-8">Your Bookings</h2>
      <div className="flex flex-col gap-12">
        {visibleBookings.map((booking) => (
          <Card
            key={booking.id}
            className="flex items-start bg-white border-0 shadow-none overflow-hidden"
            style={{ borderRadius: 'clamp(10px, 2vw, 15px)' }}
          >
            <CardContent className="flex items-start p-0 w-full">
              <div
                className="relative flex-shrink-0"
                style={{
                  width: 'clamp(140px, 30vw, 293px)',
                  height: 'clamp(120px, 22vw, 211px)',
                }}
              >
                <Image
                  src={booking.listing?.listingImages?.[0]?.url || booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                  alt={booking.listing?.title || 'Property'}
                  fill
                  className="object-cover"
                  style={{ borderRadius: 'clamp(10px, 2vw, 15px) 0 0 clamp(10px, 2vw, 15px)' }}
                />
              </div>

              <div
                className="flex flex-col justify-between flex-1"
                style={{
                  padding: 'clamp(8px, 1.5vw, 16px) clamp(12px, 1.5vw, 16px) clamp(8px, 1.5vw, 16px) clamp(16px, 3vw, 32px)',
                  minHeight: 'clamp(120px, 22vw, 211px)',
                }}
              >
                <div className="flex flex-col" style={{ gap: 'clamp(2px, 0.5vw, 4px)' }}>
                  <h3
                    className="font-poppins font-semibold text-[#373940] leading-normal"
                    style={{ fontSize: 'clamp(14px, 2vw, 20px)' }}
                  >
                    {booking.listing?.title || 'Untitled Property'}
                  </h3>

                  <div className="flex flex-col">
                    <p
                      className="font-poppins font-normal text-[#6b7085] leading-relaxed"
                      style={{ fontSize: 'clamp(11px, 1.5vw, 15px)' }}
                    >
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </p>
                    <p
                      className="font-poppins font-normal text-[#6b7085] leading-relaxed"
                      style={{ fontSize: 'clamp(11px, 1.5vw, 15px)' }}
                    >
                      {booking.listing?.locationString || 'Location not available'}
                    </p>
                    {booking.trip && (
                      <p
                        className="font-poppins font-normal text-[#6b7085] leading-relaxed"
                        style={{ fontSize: 'clamp(11px, 1.5vw, 15px)' }}
                      >
                        {formatOccupants(booking.trip.numAdults, booking.trip.numChildren, booking.trip.numPets)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center" style={{ gap: 'clamp(8px, 1.5vw, 16px)' }}>
                  <Button
                    variant="outline"
                    className="rounded-[8px] border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787]/10 font-poppins font-semibold"
                    style={{ height: 'clamp(30px, 4vw, 40px)', padding: '0 clamp(12px, 1.5vw, 20px)', fontSize: 'clamp(12px, 1.3vw, 14px)' }}
                    asChild
                  >
                    <Link href={`/app/rent/bookings/${booking.id}`}>View Details</Link>
                  </Button>
                  {booking.listing?.userId && (
                    <Button
                      className="rounded-[8px] bg-[#3c8787] hover:bg-[#3c8787]/90 text-white font-poppins font-semibold"
                      style={{ height: 'clamp(30px, 4vw, 40px)', padding: '0 clamp(16px, 2vw, 24px)', fontSize: 'clamp(12px, 1.3vw, 14px)' }}
                      asChild
                    >
                      <Link href={`/app/rent/messages?userId=${booking.listing.userId}`}>Message Host</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
  if (applications.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between px-6 py-3">
        <h2 className="font-['Poppins'] font-medium text-[14px] leading-5" style={{ color: '#0D1B2A' }}>Applications</h2>
        <BrandButton variant="outline" size="xs" href="/app/rent/applications">
          Your Application
        </BrandButton>
      </div>
      <div className="space-y-4">
        {applications.map((app) => {
          const location = app.listing.city && app.listing.state
            ? `${app.listing.city}, ${app.listing.state}`
            : app.listing.state || 'Location not available';

          return (
            <RenterDashboardApplicationCard
              key={app.id}
              title={app.listing.title}
              status="Pending"
              dateRange={formatDateRange(app.startDate, app.endDate)}
              location={location}
              guests={formatOccupants(app.trip.numAdults, app.trip.numChildren, app.trip.numPets)}
              imageUrl={app.listing.listingImages[0]?.url || PLACEHOLDER_IMAGE}
              applicationId={app.id}
              userId={app.listing.user?.id}
            />
          );
        })}
      </div>
    </section>
  );
};

// Favorites Section
const FAVORITES_PER_LOAD = 12;

const FavoritesSection = ({ favorites }: { favorites: DashboardFavorite[] }) => {
  const [displayedCount, setDisplayedCount] = useState(FAVORITES_PER_LOAD);
  const [gridColumns, setGridColumns] = useState(2);
  const gridRef = useRef<HTMLDivElement>(null);

  if (favorites.length === 0) return null;

  const displayedFavorites = favorites.slice(0, displayedCount);
  const hasMore = displayedCount < favorites.length;

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

  // Reset displayed count when favorites change
  useEffect(() => {
    setDisplayedCount(FAVORITES_PER_LOAD);
  }, [favorites.length]);

  // Track grid columns for trigger calculation
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setGridColumns(5);
      else if (width >= 768) setGridColumns(4);
      else if (width >= 640) setGridColumns(3);
      else setGridColumns(2);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + FAVORITES_PER_LOAD, favorites.length));
  }, [favorites.length]);

  // IntersectionObserver to trigger loading more
  useEffect(() => {
    if (!hasMore) return;

    const triggerIndex = Math.max(0, displayedFavorites.length - gridColumns * 2);
    const triggerElement = gridRef.current?.children[triggerIndex] as HTMLElement | undefined;
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [displayedFavorites.length, gridColumns, hasMore, loadMore]);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-medium text-[#404040]">Favorites</h2>
        <span className="text-sm text-gray-500">({favorites.length})</span>
      </div>
      <div ref={gridRef} className="flex flex-wrap gap-6">
        {displayedFavorites.map((fav, index) => (
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
    </section>
  );
};

// Empty State
const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <SingleFamilyIcon className="w-8 h-8 text-gray-400" />
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
    <div className={`py-6 ${APP_PAGE_MARGIN} max-w-[1280px] mx-auto`}>
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
