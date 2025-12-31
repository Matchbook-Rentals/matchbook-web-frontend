'use client';

import { ListingAndImages } from '@/types';
import HomepageListingCard from './homepage-listing-card';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useRef } from 'react';

interface PopularListingsSectionProps {
  listings: ListingAndImages[];
}

type BadgeType = 'matched' | 'liked';

interface ListingRowProps {
  title: string;
  listings: ListingAndImages[];
  showBadges?: boolean;
}

const SCROLL_AMOUNT = 440;

const SAMPLE_CITIES = [
  'Nashville, TN',
  'Las Vegas, NV',
  'Austin, TX',
  'Denver, CO',
];

const getBadgeForIndex = (index: number): BadgeType | undefined => {
  if (index === 0) return 'matched';
  if (index === 1) return 'liked';
  return undefined;
};

function ListingRow({ title, listings, showBadges = false }: ListingRowProps) {
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
          <div className="p-1 rounded-full bg-primaryBrand/10">
            <ArrowRight className="w-4 h-4 text-primaryBrand" />
          </div>
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
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No listings available</div>
      )}
    </div>
  );
}

export default function PopularListingsSection({ listings }: PopularListingsSectionProps) {
  const hasListings = listings.length > 0;

  const splitListingsIntoRows = () => {
    if (!hasListings) return [];
    const rowSize = Math.ceil(listings.length / 4);
    return [
      listings.slice(0, rowSize),
      listings.slice(rowSize, rowSize * 2),
      listings.slice(rowSize * 2, rowSize * 3),
      listings.slice(rowSize * 3),
    ];
  };

  const rows = splitListingsIntoRows();

  const renderEmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      No listings available at this time.
    </div>
  );

  return (
    <MarketingContainer>
      <section className="py-8">
        {hasListings ? (
          <>
            <ListingRow
              title="Your search in Palo Alto"
              listings={rows[0] || []}
              showBadges={true}
            />
            <ListingRow
              title="Monthly rentals near me"
              listings={rows[1] || []}
            />
            {SAMPLE_CITIES.slice(0, 2).map((city, index) => (
              <ListingRow
                key={city}
                title={`Explore monthly rentals in ${city}`}
                listings={rows[index + 2] || rows[0] || []}
              />
            ))}
          </>
        ) : (
          renderEmptyState()
        )}
      </section>
    </MarketingContainer>
  );
}
