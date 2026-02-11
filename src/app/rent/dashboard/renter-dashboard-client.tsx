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
  isAdmin: boolean;
  currentMode?: string;
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

// Section Empty State
const SectionEmptyState = ({
  imageSrc,
  title,
  subtitle,
  imageSize = 64,
}: {
  imageSrc: string;
  title: string;
  subtitle: string;
  imageSize?: number;
}) => (
  <div className="flex flex-col items-center justify-center py-10">
    <Image
      src={imageSrc}
      alt=""
      width={imageSize}
      height={imageSize}
      className="mb-3 opacity-80"
    />
    <p className="font-poppins font-medium text-sm text-[#484a54]">{title}</p>
    <p className="font-poppins text-xs text-[#777b8b] mt-1">{subtitle}</p>
  </div>
);

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
const DashboardHeader = ({ 
  isAdmin, 
  currentMode 
}: { 
  isAdmin: boolean;
  currentMode?: string;
}) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className="text-2xl font-semibold text-[#404040]">Renter Dashboard</h1>
    {isAdmin && (
      <div className="flex gap-2">
        <Button 
          variant={currentMode === 'demo' ? 'default' : 'outline'} 
          size="sm"
          asChild
        >
          <Link href="/rent/dashboard?mode=demo">See Demo</Link>
        </Button>
        <Button 
          variant={currentMode === 'empty' ? 'default' : 'secondary'} 
          size="sm"
          asChild
        >
          <Link href="/rent/dashboard?mode=empty">See Empty</Link>
        </Button>
        {currentMode && (
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link href="/rent/dashboard">Reset</Link>
          </Button>
        )}
      </div>
    )}
  </div>
);

// Recent Searches Section
const SearchCard = ({ trip, compact = false }: { trip: DashboardTrip; compact?: boolean }) => (
  <Link
    href={`/guest/rent/searches/${trip.id}`}
    className="flex w-full h-[52px] items-center gap-3 px-3 hover:bg-transparent bg-inherit rounded-[10px] border border-solid border-[#eaecf0] shadow-shadows-shadow-xs"
  >
    <div className="flex w-8 h-8 items-center justify-center shrink-0">
      <Home size={20} className="text-gray-600" />
    </div>

    <div className="flex-1 flex items-center font-poppins font-medium text-[#373940] text-[11px] truncate">
      {getLocationDisplay(trip)}
    </div>

    <div className="flex-1 flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate">
      {formatDateRange(trip.startDate, trip.endDate)}
    </div>

    <div className="flex-1 flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </div>

    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
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

  if (searches.length === 0) return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Recent Searches</h2>
      <SectionEmptyState
        imageSrc="/empty-states/no-searches.png"
        title="No recent searches"
        subtitle="Start exploring rentals to see your searches here"
      />
    </section>
  );

  // Group searches into pairs for mobile
  const mobileSlides = [];
  for (let i = 0; i < searches.length; i += 2) {
    mobileSlides.push(searches.slice(i, i + 2));
  }

  return (
    <section className="mb-8 overflow-x-hidden">
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

  if (bookings.length === 0) return (
    <section className="mb-8">
      <h2 className="font-poppins font-semibold text-[#484a54] text-sm mb-4">Bookings</h2>
      <SectionEmptyState
        imageSrc="/empty-states/no-bookings.png"
        title="No bookings yet"
        subtitle="Your confirmed bookings will appear here"
      />
    </section>
  );

  const visibleBookings = showAll ? bookings : bookings.slice(0, INITIAL_BOOKINGS_COUNT);
  const hasMore = bookings.length > INITIAL_BOOKINGS_COUNT;

  return (
    <section className="flex flex-col items-start gap-3.5 overflow-x-hidden">
      <header className="flex items-center justify-between w-full">
        <h2 className="font-poppins font-semibold text-[#484a54] text-sm">
          Bookings
        </h2>
      </header>

      <div className="flex flex-col gap-12 w-full overflow-x-hidden">
        {visibleBookings.map((booking) => (
          <Card
            key={booking.id}
            className="w-full bg-white rounded-[15px] border-0 shadow-none"
          >
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-stretch overflow-hidden">
                <div className="relative flex-shrink-0 w-full sm:w-[207px] h-[200px] sm:h-auto">
                  <Image
                    src={booking.listing?.listingImages?.[0]?.url || booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                    alt={booking.listing?.title || 'Property'}
                    fill
                    className="object-cover sm:rounded-l-xl rounded-t-xl sm:rounded-tr-none"
                  />
                </div>

                <div className="flex flex-col flex-1 p-4 sm:pl-6 sm:pr-3 min-w-0">
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
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="h-[29px] px-3.5 py-2.5 rounded-lg border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787]/10 font-poppins font-semibold text-[11px]"
                        asChild
                      >
                        <Link href={`/rent/bookings/${booking.id}`}>View Details</Link>
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

  if (matches.length === 0) return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Your Matches</h2>
      <SectionEmptyState
        imageSrc="/empty-states/no-matches.png"
        title="No matches yet"
        subtitle="Apply to listings to get matched with hosts"
      />
    </section>
  );

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
    <section className="mb-8 overflow-x-hidden">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Your Matches</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
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
  if (applications.length === 0) return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Poppins'] font-medium text-[14px] leading-5" style={{ color: '#0D1B2A' }}>Applications</h2>
        <BrandButton variant="outline" size="xs" href="/app/rent/applications">
          Your Application
        </BrandButton>
      </div>
      <SectionEmptyState
        imageSrc="/empty-states/no-applications.png"
        title="No applications"
        subtitle="Apply to listings you're interested in"
      />
    </section>
  );

  return (
    <section className="mb-8 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Poppins'] font-medium text-[14px] leading-5" style={{ color: '#0D1B2A' }}>Applications</h2>
        <BrandButton variant="outline" size="xs" href="/app/rent/applications">
          Your Application
        </BrandButton>
      </div>
      <div className="space-y-4">
        {applications.map((app) => {
          const location = app.listing?.city && app.listing?.state
            ? `${app.listing.city}, ${app.listing.state}`
            : app.listing?.state || 'Location not available';

          return (
            <RenterDashboardApplicationCard
              key={app.id}
              title={app.listing?.title || 'Untitled Property'}
              status="Pending"
              dateRange={formatDateRange(app.startDate, app.endDate)}
              location={location}
              guests={formatOccupants(app.trip?.numAdults || 0, app.trip?.numChildren || 0, app.trip?.numPets || 0)}
              imageUrl={app.listing?.listingImages?.[0]?.url || PLACEHOLDER_IMAGE}
              applicationId={app.id}
              userId={app.listing?.user?.id}
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
  const favoriteListings = favorites
    .filter((fav) => fav.listing !== null)
    .map((fav) => ({
      ...fav.listing,
      listingImages: fav.listing?.listingImages?.map((img) => ({
        ...img,
        listingId: fav.listingId,
        category: null,
        rank: 0,
        createdAt: new Date(),
      })) || [],
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

  if (favorites.length === 0) return (
    <section className="mb-8">
      <h2 className="text-lg font-medium text-[#404040] mb-4">Favorites</h2>
      <SectionEmptyState
        imageSrc="/empty-states/no-favorites.png"
        title="No favorites yet"
        subtitle="Save listings you love to find them later"
      />
    </section>
  );

  return (
    <section className="mb-8 overflow-x-hidden">
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

export default function RenterDashboardClient({ data, isAdmin, currentMode }: RenterDashboardClientProps) {
  const { recentSearches, bookings, matches, applications, favorites } = data;

  return (
    <div className={`py-6 ${APP_PAGE_MARGIN} max-w-[1280px] mx-auto overflow-x-hidden`}>
      <DashboardHeader isAdmin={isAdmin} currentMode={currentMode} />
      <RecentSearchesSection searches={recentSearches} />
      <BookingsSection bookings={bookings} />
      <MatchesSection matches={matches} />
      <ApplicationsSection applications={applications} />
      <FavoritesSection favorites={favorites} />
    </div>
  );
}
