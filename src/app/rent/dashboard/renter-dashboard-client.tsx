'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, MoreHorizontal, ChevronLeft, ChevronRight as ChevronRightIcon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Card, CardContent } from '@/components/ui/card';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
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
const SearchCard = ({ trip, compact = false }: { trip: DashboardTrip; compact?: boolean }) => (
  <Link
    href={`/guest/rent/searches/${trip.id}`}
    className="flex w-full h-[52px] items-center gap-2 px-0 hover:bg-transparent"
  >
    <div className="flex w-10 h-10 items-center justify-center p-2 bg-white rounded-[10px] border border-solid border-[#eaecf0] shadow-shadows-shadow-xs shrink-0">
      <Home className="w-5 h-5 text-gray-600" />
    </div>

    <div className="flex items-center min-w-[77px] font-poppins font-medium text-[#373940] text-[11px]">
      {getLocationDisplay(trip)}
    </div>

    <div className="flex items-center min-w-[109px] font-poppins font-normal text-[#777b8b] text-[10px]">
      {formatDateRange(trip.startDate, trip.endDate)}
    </div>

    <div className="flex items-center min-w-[72px] font-poppins font-normal text-[#777b8b] text-[10px]">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </div>

    <ChevronRight className="w-[15px] h-[15px] text-gray-700 shrink-0" />
  </Link>
);

const RecentSearchesSection = ({ searches }: { searches: DashboardTrip[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!api) return;

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });

    api.on('reInit', () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });
  }, [api]);

  if (searches.length === 0) return null;

  // Group searches into pairs for mobile
  const mobileSlides = [];
  for (let i = 0; i < searches.length; i += 2) {
    mobileSlides.push(searches.slice(i, i + 2));
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium text-[#404040]">Recent Searches</h2>
        
        {searches.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => api?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-7 w-7 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous searches</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => api?.scrollNext()}
              disabled={!canScrollNext}
              className="h-7 w-7 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next searches</span>
            </Button>
          </div>
        )}
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
          slidesToScroll: 1,
        }}
        className="w-full"
        keyboardControls={false}
      >
        <CarouselContent className="-ml-3">
          {isMobile
            ? // Mobile: Each slide has 2 cards stacked
              mobileSlides.map((slideTrips, idx) => (
                <CarouselItem key={idx} className="pl-3 basis-full">
                  <div className="flex flex-col gap-3">
                    {slideTrips.map((trip) => (
                      <SearchCard key={trip.id} trip={trip} compact />
                    ))}
                  </div>
                </CarouselItem>
              ))
            : // Desktop: Each slide has 1 card, side by side
              searches.map((trip) => (
                <CarouselItem key={trip.id} className="pl-3 basis-1/2">
                  <SearchCard trip={trip} compact />
                </CarouselItem>
              ))}
        </CarouselContent>
      </Carousel>
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
    <section className="flex flex-col items-start gap-3.5">
      <header className="flex items-center justify-between w-full">
        <h2 className="font-poppins font-semibold text-[#484a54] text-sm">
          Bookings
        </h2>
      </header>

      <div className="flex flex-col gap-12 w-full">
        {visibleBookings.map((booking) => (
          <Card
            key={booking.id}
            className="w-full bg-white rounded-[15px] border-0 shadow-none"
          >
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="relative flex-shrink-0 w-[207px]">
                  <Image
                    src={booking.listing?.listingImages?.[0]?.url || booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                    alt={booking.listing?.title || 'Property'}
                    fill
                    className="object-cover rounded-l-xl"
                  />
                </div>

                <div className="flex flex-col flex-1 pl-6 pr-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <h3 className="font-poppins font-medium text-[#373940] text-base truncate">
                      {booking.listing?.title || 'Untitled Property'}
                    </h3>
                    <p className="font-poppins font-normal text-[#777b8b] text-xs">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </p>
                    <p className="font-poppins font-normal text-[#777b8b] text-xs">
                      {booking.listing?.locationString || 'Location not available'}
                    </p>
                    {booking.trip && (
                      <p className="font-poppins font-normal text-[#777b8b] text-xs">
                        {formatOccupants(booking.trip.numAdults, booking.trip.numChildren, booking.trip.numPets)}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="h-[29px] px-3.5 py-2.5 rounded-lg border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787]/10 font-poppins font-semibold text-[11px]"
                        asChild
                      >
                        <Link href={`/app/rent/bookings/${booking.id}`}>View Details</Link>
                      </Button>
                      {booking.listing?.userId && (
                        <Button
                          className="h-[29px] px-3.5 py-2.5 rounded-lg bg-[#3c8787] hover:bg-[#3c8787]/90 text-white font-poppins font-semibold text-[11px]"
                          asChild
                        >
                          <Link href={`/app/rent/messages?userId=${booking.listing.userId}`}>Message Host</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 mb-4 text-xs text-primaryBrand hover:text-primaryBrand/80 font-medium"
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
      <div className="flex items-center justify-between mb-4">
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

  const displayedFavorites = favorites.slice(0, displayedCount);
  const hasMore = displayedCount < favorites.length;

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

  if (favorites.length === 0) return null;

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
