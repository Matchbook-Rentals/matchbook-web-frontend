'use client';

import { ListingAndImages } from '@/types';
import HomepageListingCard from './homepage-listing-card';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createGuestSession } from '@/app/actions/guest-session-db';
import { GuestSessionService } from '@/utils/guest-session';
import { HomepageUserState } from '@/app/actions/homepage-user-state';

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
}

const SCROLL_AMOUNT = 608;

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

function ListingRow({ title, listings, showBadges = false, guestFavoriteIds, onFavorite, onSignInPrompt, onExploreClick, isExploreLoading, authUserState, sectionTripId }: ListingRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, listings]);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
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
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(() => {
            // Pre-compute state for each listing and sort by priority
            const listingsWithState = listings.map(listing => ({
              listing,
              state: getListingState(listing.id, authUserState, guestFavoriteIds, sectionTripId)
            }));

            // Sort: matched first, then liked, then others
            listingsWithState.sort((a, b) => {
              const priorityA = a.state.badge === 'matched' ? 0 : a.state.initialFavorited ? 1 : 2;
              const priorityB = b.state.badge === 'matched' ? 0 : b.state.initialFavorited ? 1 : 2;
              return priorityA - priorityB;
            });

            return listingsWithState.map(({ listing, state }) => (
              <HomepageListingCard
                key={listing.id}
                listing={listing}
                badge={state.badge}
                initialFavorited={state.initialFavorited}
                isApplied={state.isApplied}
                tripId={state.tripId}
                matchId={state.matchId}
                onFavorite={onFavorite}
                onSignInPrompt={onSignInPrompt}
              />
            ));
          })()}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No listings available</div>
      )}
    </div>
  );
}

const hasExploreTarget = (section: ListingSection): boolean =>
  section.center !== undefined;

export default function PopularListingsSection({ sections, guestFavoriteIds, onFavorite, onSignInPrompt, authUserState }: PopularListingsSectionProps) {
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
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </section>
    </MarketingContainer>
  );
}
