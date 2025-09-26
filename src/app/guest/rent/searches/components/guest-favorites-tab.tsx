import React, { useState, useEffect, useRef } from 'react';
import { useGuestTripContext } from '@/contexts/guest-trip-context-provider';
import { ListingAndImages } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import GuestSearchFavoriteGrid from './guest-search-favorite-grid';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';

export default function GuestFavoritesTab() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { state, actions } = useGuestTripContext();
  const { likedListings, lookup } = state;
  const { showAuthPrompt } = actions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

  const handleTabChange = (action: 'push' | 'prefetch' = 'push') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'recommended');
    const url = `${pathname}?${params.toString()}`;
    router[action](url);
  };

  const handleApply = async (listing: ListingAndImages) => {
    // For guests, always show auth prompt when trying to apply
    showAuthPrompt('apply', listing.id);
  };

  const generateLikedCardActions = (listing: ListingAndImages) => {
    return [{
      label: 'Apply Now',
      action: () => handleApply(listing),
      className: 'bg-blueBrand text-white'
    }];
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  useEffect(() => {
    const setHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newStartY = containerRect.top;
        const newViewportHeight = window.innerHeight;
        const newCalculatedHeight = newViewportHeight - newStartY - 200;
        setStartY(newStartY);
        setViewportHeight(newViewportHeight);
        setCalculatedHeight(newCalculatedHeight);
        setCurrentComponentHeight(containerRef.current.offsetHeight);
        containerRef.current.style.minHeight = `${newCalculatedHeight}px`;
      }
    };

    setHeight();
    window.addEventListener('resize', setHeight);
    return () => {
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  if (likedListings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        {(() => {
          handleTabChange('prefetch');
          return null;
        })()}
        <img
          src="/search-flow/empty-states/empty-listings.png"
          alt="No listings available"
          className="w-32 h-32 mb-4 opacity-60"
        />
        <p className='font-montserrat-regular text-2xl mb-5'>You haven&apos;t liked any listings!</p>
        <p className='mt-3'>Let&apos;s get you a match!</p>
        <div className='flex justify-center gap-x-2 mt-2'>
          <BrandButton
            variant="default"
            onClick={() => handleTabChange()}
          >
            Show Recommended
          </BrandButton>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:max-h-[calc(100vh-150px)] md:flex-row justify-center mx-auto w-full"
    >
      <div className="w-full">
        <GuestSearchFavoriteGrid
          listings={likedListings}
          withCallToAction={true}
          cardActions={generateLikedCardActions}
          height={calculatedHeight}
        />
      </div>
    </div>
  );
}