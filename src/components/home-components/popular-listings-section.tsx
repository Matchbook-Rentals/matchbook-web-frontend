'use client';

import { ListingAndImages } from '@/types';
import HomepageListingCard from './homepage-listing-card';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import Link from 'next/link';

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
}

type BadgeType = 'matched' | 'liked';

interface ListingRowProps {
  title: string;
  listings: ListingAndImages[];
  showBadges?: boolean;
  guestFavoriteIds?: Set<string>;
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
  searchUrl?: string;
}

const SCROLL_AMOUNT = 440;

const getBadgeForIndex = (index: number): BadgeType | undefined => {
  if (index === 0) return 'matched';
  if (index === 1) return 'liked';
  return undefined;
};

function ListingRow({ title, listings, showBadges = false, guestFavoriteIds, onFavorite, searchUrl }: ListingRowProps) {
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
          {searchUrl ? (
            <Link href={searchUrl} className="p-1 rounded-full bg-primaryBrand/10 hover:bg-primaryBrand/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-primaryBrand" />
            </Link>
          ) : (
            <div className="p-1 rounded-full bg-primaryBrand/10">
              <ArrowRight className="w-4 h-4 text-primaryBrand" />
            </div>
          )}
        </div>
        <button
          onClick={scrollRight}
          className="p-2 rounded-full bg-primaryBrand/10 hover:bg-primaryBrand/20 transition-colors"
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
          {listings.map((listing, index) => (
            <HomepageListingCard
              key={listing.id}
              listing={listing}
              badge={showBadges ? getBadgeForIndex(index) : undefined}
              initialFavorited={guestFavoriteIds?.has(listing.id)}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No listings available</div>
      )}
    </div>
  );
}

const buildSearchUrl = (section: ListingSection): string | undefined => {
  if (!section.center) return undefined;
  const params = new URLSearchParams();
  params.set('lat', String(section.center.lat));
  params.set('lng', String(section.center.lng));
  if (section.city) params.set('city', section.city);
  if (section.state) params.set('state', section.state);
  return `/search?${params.toString()}`;
};

export default function PopularListingsSection({ sections, guestFavoriteIds, onFavorite }: PopularListingsSectionProps) {
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
              searchUrl={buildSearchUrl(section)}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </section>
    </MarketingContainer>
  );
}
