'use client'
//IMports
import React, { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { amenities } from '@/lib/amenities-list';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import ListingDetails from '../(components)/listing-details';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ListingDescription from '../../trips/(trips-components)/listing-info';
import ListingDetailsBox from '../(components)/ListingDetailsBox';


const PLATFORM_NAVBAR_HEIGHT = 0; // Add this constant for the navbar height

// Add prop interface
interface MatchViewTabProps {
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

// Update component definition to receive props
const MatchViewTab: React.FC<MatchViewTabProps> = ({ setIsFilterOpen }) => {
  const { state, actions } = useTripContext();
  const { showListings, listings, viewedListings, lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { setViewedListings, setLookup, optimisticLike, optimisticRemoveLike, optimisticDislike, optimisticRemoveDislike, optimisticMaybe, optimisticRemoveMaybe } = actions;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolledDeep, setIsScrolledDeep] = useState(false);
  const MAX_HISTORY = 50; // Maximum number of actions to remember
  const [isProcessing, setIsProcessing] = useState(false);
  const [controlBoxHeight, setControlBoxHeight] = useState<number>(0);
  const controlBoxRef = useRef<HTMLDivElement>(null);
  const [titleBoxHeight, setTitleBoxHeight] = useState<number>(0);
  const titleBoxRef = useRef<HTMLDivElement>(null);
  const [totalBoxHeight, setTotalBoxHeight] = useState<number>(0);
  const controlBoxParentRef = useRef<HTMLDivElement>(null);
  const [controlBoxParentHeight, setControlBoxParentHeight] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Add new state for sticky behavior
  const [stickyOffset, setStickyOffset] = useState<number | null>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const detailsBoxRef = useRef<HTMLDivElement>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);

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
    const updateHeight = () => {
      if (controlBoxRef.current) {
        setControlBoxHeight(controlBoxRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeight();

    // Add resize listener
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    const updateTitleHeight = () => {
      if (titleBoxRef.current) {
        setTitleBoxHeight(titleBoxRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateTitleHeight();

    // Add resize listener
    window.addEventListener('resize', updateTitleHeight);
    return () => window.removeEventListener('resize', updateTitleHeight);
  }, []);

  // Update the useEffect to calculate the total height
  useEffect(() => {
    const updateTotalBoxHeight = () => {
      const bedroomPriceBox = document.querySelector('.bedroom-price-box');
      const sqftDepositBox = document.querySelector('.sqft-deposit-box');

      if (bedroomPriceBox && sqftDepositBox) {
        const bedroomPriceHeight = bedroomPriceBox.getBoundingClientRect().height;
        const sqftDepositHeight = sqftDepositBox.getBoundingClientRect().height;
        setTotalBoxHeight(bedroomPriceHeight + sqftDepositHeight);
      }
    };

    updateTotalBoxHeight();
    window.addEventListener('resize', updateTotalBoxHeight);
    window.addEventListener('scroll', updateTotalBoxHeight);

    return () => {
      window.removeEventListener('resize', updateTotalBoxHeight);
      window.removeEventListener('scroll', updateTotalBoxHeight);
    };
  }, [showListings]);

  useEffect(() => {
    const updateParentHeight = () => {
      if (controlBoxParentRef.current) {
        // Force a reflow to ensure all children are rendered
        requestAnimationFrame(() => {
          const height = controlBoxParentRef.current?.getBoundingClientRect().height || 0;
          setControlBoxParentHeight(height);
        });
      }
    };

    // Initial measurement after a short delay to ensure rendering
    const initialTimer = setTimeout(updateParentHeight, 100);

    // Add resize observer for more reliable height updates
    const resizeObserver = new ResizeObserver(updateParentHeight);
    if (controlBoxParentRef.current) {
      resizeObserver.observe(controlBoxParentRef.current);
    }

    return () => {
      clearTimeout(initialTimer);
      resizeObserver.disconnect();
    };
  }, [showListings]); // Add showListings as dependency to recalculate when content changes

  // Add this helper function near other function declarations
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticLike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'favorite' as 'favorite' | 'dislike', actionId: '' }];
      console.log('Viewed listings after like:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleReject = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticDislike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'dislike' as 'favorite' | 'dislike', actionId: '' }];
      console.log('Viewed listings after dislike:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleMaybe = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticMaybe(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'maybe' as 'favorite' | 'dislike', actionId: '' }];
      console.log('Viewed listings after maybe:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleBack = async () => {
    if (viewedListings.length === 0 || isProcessing) return;

    scrollToTop();
    try {
      setIsProcessing(true);
      const lastAction = viewedListings[viewedListings.length - 1];

      if (lastAction.action === 'favorite') {
        await optimisticRemoveLike(lastAction.listing.id);
      } else if (lastAction.action === 'dislike') {
        await optimisticRemoveDislike(lastAction.listing.id);
      } else if (lastAction.action === 'maybe') {
        await optimisticRemoveMaybe(lastAction.listing.id);
      }

      setViewedListings(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('Error during back operation:', error);
      // Optionally add error handling UI here
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
  const numFavorites = state.likedListings.length + state.maybedListings.length;
  const numFilteredOut = listings.length - state.likedListings.length - state.maybedListings.length;

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
        <p className=' text-2xl mb-5'>You&apos;re out of listings!</p>
        <p className='mb-3'>You can
          {numFavorites > 0 ? 'look at your favorites' : ''}
          {numFavorites > 0 && numFilteredOut > 0 ? ' or ' : ''}
          {numFilteredOut > 0 ? 'alter your filters' : ''} to see more.</p>
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
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-3 py-1 bg-background text-[#404040] rounded-md hover:bg-gray-100 border-2"
            >
              Adjust Filters
            </button>
          )}
          {numFavorites > 0 && (
            <button
              onClick={() => handleTabChange()}
              className="px-4 py-1 bg-[#4F4F4F] text-background rounded-md hover:bg-[#404040]"
            >
              View Favorites
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <>
      {/* Conditionally rendered top control box */}
      {!isDetailsVisible && showListings[0] && (
        <div className="hidden lg:block sticky top-0 bg-background z-50 p-4 border-b-2 border-gray-200">
          <div className='flex justify-between items-center'>
            <div className='flex flex-col'>
              <p className='text-lg font-medium'>{showListings[0].title}</p>
              <p className='text-sm'>Hosted by {showListings[0].user?.firstName}</p>
            </div>
            <div className='flex items-center gap-x-4'>
              <p className='text-lg font-medium'>${showListings[0].price?.toLocaleString()}/month</p>
              <div className="flex items-center gap-x-3">
                <button
                  onClick={() => handleReject(showListings[0])}
                  className={`w-[50px] drop-shadow aspect-square
               flex items-center justify-center rounded-full
            hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]`}
                >
                  <RejectIcon className={`w-[60%] h-[60%] text-white`} />
                </button>

                <button
                  onClick={() => handleBack()}
                  className={`w-[40px] drop-shadow aspect-square
               flex items-center justify-center rounded-full
               hover:opacity-90 transition-opacity
               bg-gradient-to-br from-[#6CC3FF] to-[#5B96BE]`}
                >
                  <ReturnIcon className={`w-[60%] h-[60%] text-white`} />
                </button>

                <button
                  onClick={() => handleLike(showListings[0])}
                  className={`w-[50px] drop-shadow aspect-square flex
            items-center justify-center rounded-full
            hover:opacity-90 transition-opacity
            bg-gradient-to-br from-[#A3B899] to-[#5F6F58]`}
                >
                  <BrandHeart className={`w-[60%] h-[60%]`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Below paddings are to accomdate control buttons */}
      {/* first for buttons with mobile navigation selector */}
      {/* second is for 'tablet' view with larger button controls */}
      <div className={`w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6`}>
        <ListingImageCarousel
          listingImages={showListings[0]?.listingImages || []}
        />
        <div className='flex justify-between gap-x-8 relative'>
          <ListingDescription listing={showListings[0]} />
          <div
            className="w-1/2 h-fit lg:w-3/5 sticky top-[10%] hidden lg:block"
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
        <div className="pb-3 mt-3" ref={locationSectionRef}>
          <h3 className="text-[24px] text-[#404040] font-medium mb-4">Location</h3>

          <div className="flex justify-between pb-3 text-[#404040] text-[20px] font-normal">
            <p> {showListings[0].locationString} </p>
            <p> {showListings[0].distance?.toFixed(1)} miles </p>
          </div>
          <img
            src={`/api/map/static?latitude=${showListings[0].latitude}&longitude=${showListings[0].longitude}`}
            alt="Property location map"
            className="w-full h-[526px] mt-4"
          />
        </div>

        <div className="lg:hidden fixed sm:bottom-[20px] bottom-[80px] left-0 right-0 z-50">
          {/* Action Buttons Section - Reject, Return, Like */}
          <div className="flex justify-center items-center gap-y-4 gap-x-6 my-4">
            <button
              onClick={() => handleReject(showListings[0])}
              className={`w-[80px] drop-shadow aspect-square
                 flex items-center justify-center rounded-full
              hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]`}
            >
              <RejectIcon className={`w-[40%] h-[40%] text-white`} />
            </button>

            <button
              onClick={() => handleBack()}
              className={`w-[54px] drop-shadow aspect-square
                 flex items-center justify-center rounded-full
                 hover:opacity-90 transition-opacity
                 bg-gradient-to-br from-[#6CC3FF] to-[#5B96BE]`}
            >
              <ReturnIcon className={`w-[55%] h-[55%] text-white`} />
            </button>

            <button
              onClick={() => handleLike(showListings[0])}
              className={`w-[80px] drop-shadow aspect-square flex
              items-center justify-center rounded-full
              hover:opacity-90 transition-opacity
              bg-gradient-to-br from-[#A3B899] to-[#5F6F58]`}
            >
              <BrandHeart className={`w-[40%] h-[40%]`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchViewTab;
