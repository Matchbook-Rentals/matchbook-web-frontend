'use client';

import { ListingAndImages } from '@/types';
import HomepageListingCard from './homepage-listing-card';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGuestSession } from '@/app/actions/guest-session-db';
import { GuestSessionService } from '@/utils/guest-session';
import { HomepageUserState } from '@/app/actions/homepage-user-state';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export interface ListingSection {
  title: string;
  listings: ListingAndImages[];
  showBadges?: boolean;
  center?: { lat: number; lng: number };
  locationString?: string;
  city?: string;
  state?: string;
  sectionTripId?: string;
}

interface PopularListingsSectionProps {
  sections: ListingSection[];
  guestFavoriteIds?: Set<string>;
  onFavorite?: (listingId: string, isFavorited: boolean, sectionTripId?: string, center?: { lat: number; lng: number }, locationString?: string) => void;
  onSignInPrompt?: () => void;
  authUserState?: Partial<HomepageUserState>;
  isSignedIn?: boolean;
}

type BadgeType = 'matched' | 'liked';

interface ListingRowProps {
  title: string;
  listings: ListingAndImages[];
  showBadges?: boolean;
  guestFavoriteIds?: Set<string>;
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
  onSignInPrompt?: () => void;
  onExploreClick?: () => void;
  isExploreLoading?: boolean;
  authUserState?: Partial<HomepageUserState>;
  sectionTripId?: string;
  isSignedIn?: boolean;
}

const getListingState = (
  listingId: string,
  authUserState?: Partial<HomepageUserState>,
  guestFavoriteIds?: Set<string>,
  sectionTripId?: string
) => {
  // Matches take priority
  const matchData = authUserState?.matchedListings?.find(m => m.listingId === listingId);
  if (matchData) {
    return {
      badge: 'matched' as const,
      initialFavorited: true,
      matchId: matchData.matchId,
      tripId: matchData.tripId,
      isApplied: false
    };
  }

  // Check favorites (auth user OR guest)
  const isFavorited = authUserState?.favoritedListingIds?.includes(listingId)
    ?? guestFavoriteIds?.has(listingId)
    ?? false;
  const isApplied = authUserState?.appliedListingIds?.includes(listingId) ?? false;

  return {
    badge: (isFavorited ? 'liked' : undefined) as BadgeType | undefined,
    initialFavorited: isFavorited,
    isApplied,
    tripId: sectionTripId
  };
};

function ListingRow({ title, listings = [], showBadges = false, guestFavoriteIds, onFavorite, onSignInPrompt, onExploreClick, isExploreLoading, authUserState, sectionTripId, isSignedIn }: ListingRowProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Calculate how many slides are visible based on viewport
  const getSlidesToScroll = () => {
    if (typeof window === 'undefined') return 1;
    const width = window.innerWidth;
    if (width >= 1024) return 5; // lg breakpoint - 5 cards visible
    if (width >= 768) return 4;  // md breakpoint - 4 cards visible
    if (width >= 640) return 3;  // sm breakpoint - 3 cards visible
    return 2; // mobile - 2 cards visible
  };

  // Update button states when carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const updateButtonStates = () => {
      setCanScrollLeft(carouselApi.canScrollPrev());
      setCanScrollRight(carouselApi.canScrollNext());
    };

    updateButtonStates();
    carouselApi.on('select', updateButtonStates);
    carouselApi.on('reInit', updateButtonStates);

    return () => {
      carouselApi.off('select', updateButtonStates);
    };
  }, [carouselApi]);

  const scrollLeft = () => {
    if (!carouselApi) return;
    const slidesToScroll = getSlidesToScroll();
    const targetIndex = Math.max(0, carouselApi.selectedScrollSnap() - slidesToScroll);
    carouselApi.scrollTo(targetIndex);
  };

  const scrollRight = () => {
    if (!carouselApi) return;
    const slidesToScroll = getSlidesToScroll();
    const targetIndex = Math.min(
      carouselApi.scrollSnapList().length - 1,
      carouselApi.selectedScrollSnap() + slidesToScroll
    );
    carouselApi.scrollTo(targetIndex);
  };

  const hasListings = listings.length > 0;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[#404040] text-lg font-medium">{title}</h3>
          {onExploreClick ? (
            <button
              onClick={onExploreClick}
              disabled={isExploreLoading}
              className="p-1 rounded-full bg-primaryBrand/10 hover:bg-primaryBrand/20 transition-colors disabled:opacity-50"
            >
              {isExploreLoading ? (
                <Loader2 className="w-4 h-4 text-primaryBrand animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-primaryBrand" />
              )}
            </button>
          ) : (
            <div className="p-1 rounded-full bg-primaryBrand/10">
              <ArrowRight className="w-4 h-4 text-primaryBrand" />
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              canScrollLeft
                ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-50 cursor-default'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className={`w-5 h-5 ${canScrollLeft ? 'text-gray-500' : 'text-gray-300'}`} />
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              canScrollRight
                ? 'bg-primaryBrand/10 hover:bg-primaryBrand/20 cursor-pointer'
                : 'bg-gray-50 cursor-default'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className={`w-5 h-5 ${canScrollRight ? 'text-primaryBrand' : 'text-gray-300'}`} />
          </button>
        </div>
      </div>

      {hasListings ? (
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
            skipSnaps: false,
          }}
          setApi={setCarouselApi}
          className="w-full"
          keyboardControls={false}
        >
          <CarouselContent className="-ml-6">
            {listings.map(listing => {
              const state = getListingState(listing.id, authUserState, guestFavoriteIds, sectionTripId);
              return (
                <CarouselItem key={listing.id} className="pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <HomepageListingCard
                    listing={listing}
                    badge={state.badge}
                    initialFavorited={state.initialFavorited}
                    isApplied={state.isApplied}
                    tripId={state.tripId}
                    matchId={state.matchId}
                    onFavorite={onFavorite}
                    onSignInPrompt={onSignInPrompt}
                    isSignedIn={isSignedIn}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="text-gray-500 text-sm">No listings available</div>
      )}
    </div>
  );
}

const hasExploreTarget = (section: ListingSection): boolean =>
  section.center !== undefined;

export default function PopularListingsSection({ sections, guestFavoriteIds, onFavorite, onSignInPrompt, authUserState, isSignedIn }: PopularListingsSectionProps) {
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleExploreClick = async (section: ListingSection, index: number) => {
    if (!section.center) return;
    setLoadingIndex(index);
    try {
      const result = await createGuestSession({
        locationString: section.locationString || `${section.city}, ${section.state}`,
        latitude: section.center.lat,
        longitude: section.center.lng,
        city: section.city,
        state: section.state,
      });
      if (!result.success || !result.sessionId) return;

      GuestSessionService.storeSession(
        GuestSessionService.createGuestSessionData({
          locationString: section.locationString || `${section.city}, ${section.state}`,
          latitude: section.center.lat,
          longitude: section.center.lng,
        }, result.sessionId)
      );

      router.push(`/search?sessionId=${result.sessionId}`);
    } finally {
      setLoadingIndex(null);
    }
  };

  const hasSections = sections.length > 0;

  const renderEmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      No listings available at this time.
    </div>
  );

  return (
    <MarketingContainer>
      <section className="py-8">
        {hasSections ? (
          sections.map((section, index) => (
          <ListingRow
            key={`${section.title}-${index}`}
            title={section.title}
            listings={section.listings}
            showBadges={section.showBadges}
            guestFavoriteIds={guestFavoriteIds}
            onFavorite={onFavorite ? (listingId, isFavorited) => onFavorite(listingId, isFavorited, section.sectionTripId, section.center, section.locationString) : undefined}
            onSignInPrompt={onSignInPrompt}
            onExploreClick={hasExploreTarget(section) ? () => handleExploreClick(section, index) : undefined}
            isExploreLoading={loadingIndex === index}
            authUserState={authUserState}
            sectionTripId={section.sectionTripId}
            isSignedIn={isSignedIn}
          />
          ))
        ) : (
          renderEmptyState()
        )}
      </section>
    </MarketingContainer>
  );
}
