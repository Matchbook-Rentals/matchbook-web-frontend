'use client'

import React, { useEffect, useState, useRef, Dispatch, SetStateAction, useMemo } from 'react';
import ListingImageCarousel from '@/app/app/rent/searches/(trips-components)/image-carousel';
import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { X, Heart } from 'lucide-react';
import { amenities } from '@/lib/amenities-list';
import { useGuestTripContext } from '@/contexts/guest-trip-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import ListingDescription from '@/app/app/rent/searches/(trips-components)/listing-info';
import HostInformation from '@/app/app/rent/searches/(trips-components)/host-information';
import GuestListingDetailsBoxWithState from './guest-listing-details-box-with-state';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface GuestMatchViewTabProps {
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

const GuestSearchMatchTab: React.FC<GuestMatchViewTabProps> = ({ setIsFilterOpen }) => {
  const { state, actions } = useGuestTripContext();
  const { session, swipeShowListings, listings, viewedListings, lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { setViewedListings, setLookup, showAuthPrompt, optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;
  const MAX_HISTORY = 50;
  const [isProcessing, setIsProcessing] = useState(false);

  const locationSectionRef = useRef<HTMLDivElement>(null);
  const detailsBoxRef = useRef<HTMLDivElement>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stickyOffset, setStickyOffset] = useState<number | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

  let isFlexible = (session?.searchParams.flexibleStart && session.searchParams.flexibleStart > 0) || (session?.searchParams.flexibleEnd && session.searchParams.flexibleEnd > 0);

  // Create mock trip object from guest session for price calculation
  const mockTrip = useMemo(() => session ? {
    id: 'guest',
    startDate: session.searchParams.startDate,
    endDate: session.searchParams.endDate,
    latitude: session.searchParams.lat,
    longitude: session.searchParams.lng,
    searchRadius: 100,
    flexibleStart: 0,
    flexibleEnd: 0,
  } : null, [session]);

  useEffect(() => {
    const setHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newStartY = containerRect.top;
        const newViewportHeight = window.innerHeight;
        const newCalculatedHeight = newViewportHeight - newStartY;
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

  useEffect(() => {
    const handleScroll = () => {
      if (detailsBoxRef.current && locationSectionRef.current) {
        const detailsBoxRect = detailsBoxRef.current.getBoundingClientRect();
        const locationSectionRect = locationSectionRef.current.getBoundingClientRect();

        if (locationSectionRect.top < window.innerHeight) {
          setStickyOffset(null);
        } else {
          const offset = Math.max(0, window.scrollY - detailsBoxRect.top);
          setStickyOffset(offset);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (swipeShowListings && swipeShowListings[0]) {
      setMapCenter([swipeShowListings[0].longitude, swipeShowListings[0].latitude]);
    } else {
      setMapCenter([-118.2437, 34.0522]); // Default: Los Angeles coordinates
    }
  }, [swipeShowListings]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (
      !mapCenter ||
      !Array.isArray(mapCenter) ||
      mapCenter.length !== 2 ||
      !Number.isFinite(mapCenter[0]) ||
      !Number.isFinite(mapCenter[1])
    ) {
      console.error("Invalid mapCenter coordinates:", mapCenter);
      return;
    }

    let map: maplibregl.Map | null = null;

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: mapCenter,
        zoom: 14,
        scrollZoom: false,
        dragPan: false
      });

      mapRef.current = map;

      new maplibregl.Marker()
        .setLngLat(mapCenter)
        .addTo(map);

    } catch (error) {
      console.error("Failed to initialize map:", error);
      if (map) {
        map.remove();
      }
      mapRef.current = null;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCenter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Use real database actions for like/dislike
  const handleLike = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticLike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'favorite' as 'favorite' | 'dislike', actionId: '' }];
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleReject = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticDislike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'dislike' as 'favorite' | 'dislike', actionId: '' }];
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleBack = async () => {
    if (viewedListings.length === 0 || isProcessing) return;

    scrollToTop();
    try {
      setIsProcessing(true);

      // Undo the last action by checking what it was and reversing it
      const lastViewed = viewedListings[viewedListings.length - 1];
      if (lastViewed) {
        if (lastViewed.action === 'favorite') {
          await optimisticRemoveLike(lastViewed.listing.id);
        } else if (lastViewed.action === 'dislike') {
          await optimisticRemoveDislike(lastViewed.listing.id);
        }
      }

      // Remove from viewed history
      setViewedListings(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('Error during back operation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getListingAmenities = (listing: any) => {
    const listingAmenities = [];
    for (let amenity of amenities) {
      if (listing[amenity.code]) {
        listingAmenities.push(amenity.label);
      }
    }
    return listingAmenities;
  };

  const handleTabChange = () => {
    showAuthPrompt('like'); // Prompt to sign in to view favorites
  };

  // Calculate the number of liked/maybed and filtered out listings
  const numFavorites = 0; // Guests don't have favorites yet
  const numFilteredOut = listings.length - (state.filteredCount || listings.length);

  // Use filtered swipe listings (excludes liked/disliked AND applies filters)
  const displayListings = swipeShowListings;

  // Early returns for edge cases
  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        <p className="text-gray-600 text-center">Loading guest session...</p>
      </div>
    );
  }

  if (!displayListings || displayListings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        <img
          src="/search-flow/empty-states/empty-listings.png"
          alt="No listings available"
          className="w-32 h-32 mb-4 opacity-60"
        />
        <p className="text-gray-600 text-center">
          Sorry, we couldn&apos;t find any listings in {session?.searchParams.location || 'this area'} right now.
          <br />
          Please try different dates or a different location.
        </p>
        <div className="flex gap-3 mt-4">
          <BrandButton href="/sign-in">
            Sign In for More Options
          </BrandButton>
          <BrandButton variant="outline" href="/sign-up">
            Create Account
          </BrandButton>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <ScrollArea ref={containerRef} className='pr-3.5 w-[103%] md:pr-4 w-[102%] lg:pr-4 lg:w-[101%]' style={{height: calculatedHeight || '1000px'}}>
      <div className={`w-full mx-auto pb-[80px] md:pb-[100px]`}>
        <ListingImageCarousel
          listingImages={displayListings[0]?.listingImages || []}
          nextListingImages={displayListings[1]?.listingImages || []}
        />
        <div className='flex justify-between gap-x-8 lg:gap-x-16 relative'>
          <div className='w-full lg:w-full'>
            <ListingDescription listing={displayListings[0]} isFlexible={!!isFlexible} trip={mockTrip}/>
            <HostInformation listing={displayListings[0]} />

            <Card className="border-none shadow-none rounded-xl mt-5">
              <CardContent className="flex flex-col items-start gap-[18px] p-5">
                <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">Location</h3>

                <div className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                  {displayListings[0].distance >= 10
                    ? <p>{displayListings[0].distance?.toFixed(0)} miles from {session.searchParams.location} </p>
                    : <p>{displayListings[0].distance?.toFixed(1)} miles from {session.searchParams.location} </p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="w-1/2 mt-6  h-fit lg:w-full rounded-[12px]  shadow-md pr-0 min-w-[375px] max-w-[400px] sticky top-[10%] hidden lg:block"
          >
            <GuestListingDetailsBoxWithState
              listing={displayListings[0]}
              onReject={() => handleReject(displayListings[0])}
              onReturn={() => handleBack()}
              onLike={() => handleLike(displayListings[0])}
              setIsDetailsVisible={setIsDetailsVisible}
              trip={mockTrip}
            />
          </div>
        </div>

        {/* Location section */}
        <div className="pb-20 md:pb-0 mt-0" ref={locationSectionRef}>
          <div className="w-full h-[526px] mt-4 relative rounded-[12px]" ref={mapContainerRef} >
            {/* Map container */}
          </div>
        </div>

        <div className="lg:hidden fixed sm:bottom-[15px] bottom-[50px] left-0 right-0 z-50">
          {/* Action Buttons Section - Reject, Like */}
          <div className="flex justify-center items-center gap-3 my-4">
            <Button
              variant="outline"
              className="rounded-lg w-[100px] h-[56px] flex items-center justify-center border-none"
              style={{ backgroundColor: '#F65C6D' }}
              onClick={() => handleReject(displayListings[0])}
            >
              <X className="h-5 w-5 text-white" />
            </Button>

            <BrandButton
              variant="default"
              className="rounded-lg w-[100px] h-[56px] min-w-0 flex items-center justify-center"
              onClick={() => handleLike(displayListings[0])}
            >
              <Heart className="h-5 w-5 text-white" />
            </BrandButton>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default GuestSearchMatchTab;