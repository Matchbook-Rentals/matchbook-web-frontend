'use client'
//IMports
import React, { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import ListingImageCarousel from '../../searches/(trips-components)/image-carousel';
import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { X, Heart } from 'lucide-react';
import { amenities } from '@/lib/amenities-list';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import ListingDescription from '../../searches/(trips-components)/listing-info';
import HostInformation from '../../searches/(trips-components)/host-information';
import ListingDetailsBox from '../(components)/search-listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';


// Add prop interface
interface MatchViewTabProps {
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

// Update component definition to receive props
const MatchViewTab: React.FC<MatchViewTabProps> = ({ setIsFilterOpen }) => {
  const { state, actions } = useTripContext();
  const { showListings, listings, viewedListings, lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { setViewedListings, setLookup, optimisticLike, optimisticRemoveLike, optimisticDislike, optimisticRemoveDislike } = actions;
  const MAX_HISTORY = 50;
  const [isProcessing, setIsProcessing] = useState(false);

  // Remove unused height states and refs
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

  let isFlexible = state.trip.flexibleStart || state.trip.flexibleEnd;

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

        // Calculate when the location section is about to overlap with the details box
        if (locationSectionRect.top < window.innerHeight) {
          // When location section is in view, stop following
          setStickyOffset(null);
        } else {
          // Calculate the offset to keep the box centered
          const offset = Math.max(0, window.scrollY - detailsBoxRect.top);
          setStickyOffset(offset);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showListings && showListings[0]) {
      setMapCenter([showListings[0].longitude, showListings[0].latitude]);
    } else {
      // Set a default map center if showListings is empty or undefined
      setMapCenter([-118.2437, 34.0522]); // Example: Los Angeles coordinates
    }
  }, [showListings]);

  useEffect(() => {
    // Ensure container exists and map instance doesn't already exist
    if (!mapContainerRef.current || mapRef.current) return;

    // Validate mapCenter coordinates
    if (
      !mapCenter ||
      !Array.isArray(mapCenter) ||
      mapCenter.length !== 2 ||
      !Number.isFinite(mapCenter[0]) ||
      !Number.isFinite(mapCenter[1])
    ) {
      console.error("Invalid mapCenter coordinates:", mapCenter);
      return; // Do not proceed if coordinates are invalid
    }

    let map: maplibregl.Map | null = null; // Define map variable

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current, // Should be a valid HTMLElement
        style: 'https://tiles.openfreemap.org/styles/bright', // Ensure this style URL is correct and accessible
        center: mapCenter, // Validated coordinates
        zoom: 14,
        scrollZoom: false,
        dragPan: false
      });

      mapRef.current = map; // Assign to ref only after successful creation

      // Add marker only if map creation was successful
      new maplibregl.Marker()
        .setLngLat(mapCenter)
        .addTo(map);

    } catch (error) {
      console.error("Failed to initialize map:", error);
      // Optionally cleanup map instance if creation failed partially
      if (map) {
        map.remove();
      }
      mapRef.current = null; // Ensure ref is null if initialization failed
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Dependency array includes mapCenter to re-run effect if center changes
    // Note: This effect structure assumes map should be recreated if center changes.
    // If you only want to update the center of an existing map, the logic inside
    // the effect and the dependency array would need adjustment.
  }, [mapCenter]);

  // Add this helper function near other function declarations
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticLike(listing.id, true);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'favorite' as 'favorite' | 'dislike', actionId: '' }];
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleReject = async (listing: ListingAndImages) => {
    scrollToTop();
    // Remove popup logic
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
      // Remove popup logic

      const lastAction = viewedListings[viewedListings.length - 1];

      if (lastAction.action === 'favorite') {
        await optimisticRemoveLike(lastAction.listing.id);
      } else if (lastAction.action === 'dislike') {
        await optimisticRemoveDislike(lastAction.listing.id);
      }

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
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'favorites');
    const url = `${pathname}?${params.toString()}`;
    router.push(url);
  };

  // Calculate the number of liked/maybed and filtered out listings
  const numFavorites = state.likedListings.length;
  const numFilteredOut = listings.length - (state.filteredCount || listings.length);

  // Early returns for edge cases
  if (state.isLoading) {
    return <LoadingSpinner />;
  }
  if (showListings === undefined) {
    return null;
  }
  if (listings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        <img 
          src="/search-flow/empty-states/empty-listings.png"
          alt="No listings available" 
          className="w-32 h-32 mb-4 opacity-60"
        />
        <p className="text-gray-600 text-center">
          Sorry, we couldn&apos;t find any listings in this area right now.
          <br />
          Please check again later or try different dates.
        </p>
      </div>
    );
  }
  if (showListings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center pb-6 h-[50vh]'>
        <img 
          src="/search-flow/empty-states/empty-listings.png"
          alt="No listings available" 
          className="w-32 h-32 mb-4 opacity-60"
        />
        <p className=' text-2xl mb-5'>You&apos;re out of listings!</p>
        <p className='mb-3'>You can
          {numFavorites > 0 ? ' look at your favorites' : ''}
          {numFavorites > 0 && numFilteredOut > 0 ? ' or ' : ''}
          {numFilteredOut > 0 ? ' alter your filters' : ''} to see more.</p>
        {(numFavorites > 0 || numFilteredOut > 0) && (
          <p>
            {numFavorites > 0 && `You have ${numFavorites} listings in your favorites`}
            {numFavorites > 0 && numFilteredOut > 0 && ' & '}
            {numFilteredOut > 0 && `${numFilteredOut} listings filtered out`}
            .
          </p>
        )}

        <div className='flex justify-center gap-x-2 mt-2'>
          {numFilteredOut > 0 && (
            <BrandButton
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
            >
              Adjust Filters
            </BrandButton>
          )}
          {numFavorites > 0 && (
            <BrandButton
              variant="default"
              onClick={() => handleTabChange()}
            >
              View Favorites
            </BrandButton>
          )}
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <ScrollArea ref={containerRef} className='pr-3.5 w-[103%] max-w-[1280px] mx-auto md:pr-4 w-[102%] lg:pr-4 lg:w-[101%]' style={{height: calculatedHeight || '1000px'}}>
      {/* Below paddings are to accomdate control buttons */}
      {/* first for buttons with mobile navigation selector */}
      {/* second is for 'tablet' view with larger button controls */}
      <div className={`w-full mx-auto pb-[80px] md:pb-[100px]`}>
        <ListingImageCarousel
          listingImages={showListings[0]?.listingImages || []}
          nextListingImages={showListings[1]?.listingImages || []}
        />
        <div className='flex justify-between gap-x-8 lg:gap-x-16 relative'>
          <div className='w-full lg:w-full'>
            <ListingDescription listing={showListings[0]} isFlexible={!!isFlexible} trip={state.trip}/>
            <HostInformation listing={showListings[0]} />

            <Card className="border-none shadow-none rounded-xl mt-5">
              <CardContent className="flex flex-col items-start gap-[18px] p-5">
                <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">Location</h3>

                <div className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                  {showListings[0].distance >= 10
                    ? <p>{showListings[0].distance?.toFixed(0)} miles from {state.trip.locationString} </p>
                    : <p>{showListings[0].distance?.toFixed(1)} miles from {state.trip.locationString} </p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="w-1/2 mt-6 h-fit lg:w-full rounded-[12px]  shadow-md pr-0 min-w-[375px] max-w-[400px] sticky top-[10%] hidden lg:block"
          >
            <ListingDetailsBox
              listing={showListings[0]}
              onReject={() => handleReject(showListings[0])}
              onReturn={() => handleBack()}
              onLike={() => handleLike(showListings[0])}
              setIsDetailsVisible={setIsDetailsVisible}
            />
          </div>
        </div>

        {/* Location section */}
        <div className="pb-20 md:pb-0 mt-0" ref={locationSectionRef}>

          <div className="w-full h-[526px] mt-4 relative rounded-[12px]" ref={mapContainerRef} >
            {/* Map container */}
            <div className="absolute top-2 right-2 z-10 flex flex-col">
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomIn();
                  }
                }}
                className="bg-white p-2 rounded-md shadow mb-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomOut();
                  }
                }}
                className="bg-white p-2 rounded-md shadow"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 12H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:hidden fixed sm:bottom-[15px] bottom-[50px] left-0 right-0 z-50">
          {/* Action Buttons Section - Reject, Like */}
          <div className="flex justify-center items-center gap-3 my-4">
            <Button
              variant="outline"
              className="rounded-lg w-[100px] h-[56px] flex items-center justify-center border-none"
              style={{ backgroundColor: '#F65C6D' }}
              onClick={() => handleReject(showListings[0])}
            >
              <X className="h-5 w-5 text-white" />
            </Button>

            <BrandButton
              variant="default"
              className="rounded-lg w-[100px] h-[56px] min-w-0 flex items-center justify-center"
              onClick={() => handleLike(showListings[0])}
            >
              <Heart className="h-5 w-5 text-white" />
            </BrandButton>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default MatchViewTab;
