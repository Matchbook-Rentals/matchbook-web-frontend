'use client';

import { ListingAndImages } from '@/types';
import HomepageListingCard from './homepage-listing-card';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';
import { ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGuestSession } from '@/app/actions/guest-session-db';
import { GuestSessionService } from '@/utils/guest-session';

export interface ListingSection {
  title: string;
  listings: ListingAndImages[];
  showBadges?: boolean;
  center?: { lat: number; lng: number };
  locationString?: string;
  city?: string;
  state?: string;
}

interface PopularListingsSectionProps {
  sections: ListingSection[];
  guestFavoriteIds?: Set<string>;
  onFavorite?: (listingId: string, isFavorited: boolean, center?: { lat: number; lng: number }, locationString?: string) => void;
  onSignInPrompt?: () => void;
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
}

const SCROLL_AMOUNT = 440;

const getBadgeForIndex = (index: number): BadgeType | undefined => {
  if (index === 0) return 'matched';
  if (index === 1) return 'liked';
  return undefined;
};

function ListingRow({ title, listings, showBadges = false, guestFavoriteIds, onFavorite, onSignInPrompt, onExploreClick, isExploreLoading }: ListingRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        <button
          onClick={scrollRight}
          className="hidden md:flex p-2 rounded-full bg-primaryBrand/10 hover:bg-primaryBrand/20 transition-colors items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-primaryBrand" />
        </button>
      </div>

      {hasListings ? (
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {listings.map((listing, index) => {
            const isFavorited = guestFavoriteIds?.has(listing.id);
            const badge = isFavorited ? 'liked' as const : (showBadges ? getBadgeForIndex(index) : undefined);
            return (
              <HomepageListingCard
                key={listing.id}
                listing={listing}
                badge={badge}
                initialFavorited={isFavorited}
                onFavorite={onFavorite}
                onSignInPrompt={onSignInPrompt}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No listings available</div>
      )}
    </div>
  );
}

const hasExploreTarget = (section: ListingSection): boolean =>
  section.center !== undefined;

export default function PopularListingsSection({ sections, guestFavoriteIds, onFavorite, onSignInPrompt }: PopularListingsSectionProps) {
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
              onFavorite={onFavorite ? (listingId, isFavorited) => onFavorite(listingId, isFavorited, section.center, section.locationString) : undefined}
              onSignInPrompt={onSignInPrompt}
              onExploreClick={hasExploreTarget(section) ? () => handleExploreClick(section, index) : undefined}
              isExploreLoading={loadingIndex === index}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </section>
    </MarketingContainer>
  );
}
