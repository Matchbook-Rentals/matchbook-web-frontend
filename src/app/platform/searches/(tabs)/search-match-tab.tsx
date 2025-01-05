'use client'
//IMports
import React, { useEffect, useState, useRef } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { amenities } from '@/lib/amenities-list';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import { Montserrat } from 'next/font/google';
import SearchMap from '../(components)/search-map';
import ListingDetails from '../(components)/listing-details';
import { QuestionMarkIcon } from '@radix-ui/react-icons';


const montserrat = Montserrat({ subsets: ["latin"] });
const PLATFORM_NAVBAR_HEIGHT = 50; // Add this constant for the navbar height

const MatchViewTab: React.FC = () => {
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / window.innerHeight) * 100;
      setIsScrolled(scrollPercentage > 40);
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
      const newState = [...prev, { listing, action: 'favorite', actionId: '' }];
      console.log('Viewed listings after like:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleReject = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticDislike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'dislike', actionId: '' }];
      console.log('Viewed listings after dislike:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleMaybe = async (listing: ListingAndImages) => {
    scrollToTop();
    await optimisticMaybe(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'maybe', actionId: '' }];
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
  // Early returns for edge cases
  if (state.isLoading) {
    return <LoadingSpinner />;
  }
  if (showListings === undefined) {
    return null;
  }
  if (showListings.length === 0) {
    return (
      <div onClick={() => console.log(state.listings)}>
        No listings available. {listings.length} {state.trip?.id}
      </div>
    )
  }

  // Main component render
  return (
    <div className={`w-full mx-auto pb-0`}>
      <ListingImageCarousel
        listingImages={showListings[0]?.listingImages || []}
      />

      {/* Sticky container for all three flex sections */}
      <div ref={controlBoxParentRef} className={`sticky top-[40px] md:top-[${PLATFORM_NAVBAR_HEIGHT + 5}px] z-5 bg-background`}>
        {/* First flex container - Controls and Title */}
        <div className="flex flex-col md:flex-row w-full" >
          {/* Left side - Button Controls */}
          <div className="w-full md:w-1/2 ">
            <div className={` button-control-box bg-background ${isScrolledDeep ? 'md:bg-background' : 'md:bg-transparent'}
                     sticky top-[0px] md:top-[60px] z-10 flex justify-evenly
                     lg:justify-center lg:gap-x-8 pb-0 pt-3 md:px-5 md:pt-4 w-full
                     ${!isScrolled ? 'md:-translate-y-1/2 md:scale-110 xl:scale-125' : ''} gap-2 transition-transform duration-500`}
              ref={controlBoxRef}>
              <ButtonControl
                handleClick={() => handleReject(showListings[0])}
                Icon={<RejectIcon className='h-[70%] w-[70%] md:w-[50%] md:h-[50%] rounded-full aspect-[1/1]' />}
                className={`bg-pinkBrand/70 hover:bg-pinkBrand w-[20vw] md:w-[9vw] md:h-[9vw] max-w-[100px] max-h-[100px] aspect-[1/1]
                  flex items-center justify-center rounded-full text-center text-white
                  text-sm transition-all duration-200 relative`}
              />

              <ButtonControl
                handleClick={handleBack}
                Icon={<ReturnIcon className='h-[60%] w-[60%] rounded-full aspect-[1/1]' />}
                className={`bg-orangeBrand/70 hover:bg-orangeBrand w-[13vw] aspect-[1/1] max-w-[66px] max-h-[66px]
                  md:w-[6vw] md:h-[6vw] self-center rounded-full text-center flex items-center
                  justify-center text-white text-sm transition-all duration-200 relative `}
              />

              <ButtonControl
                handleClick={() => handleMaybe(showListings[0])}
                Icon={<QuestionMarkIcon className='h-[60%] w-[60%] rounded-full aspect-[1/1]' />}
                className={`
                bg-yellowBrand/80 hover:bg-yellowBrand w-[13vw] aspect-[1/1] max-w-[66px] max-h-[66px]
                md:w-[6vw] md:h-[6vw] self-center rounded-full text-center flex items-center
                justify-center text-white text-sm transition-all duration-200 `}
              />
              <ButtonControl
                handleClick={() => handleLike(showListings[0])}
                Icon={<BrandHeart className='h-[70%] w-[70%] md:w-[50%] md:h-[50%] rounded-xl aspect-[1/1]' />}
                className={`
                bg-primaryBrand/75 hover:bg-primaryBrand/95 w-[20vw] max-w-[100px] max-h-[100px] aspect-[1/1]
                md:w-[9vw] md:h-[9vw] flex items-center justify-center rounded-full text-center
                text-white text-sm transition-all duration-200
              `}
              />
            </div>
          </div>

          {/* Right side - Listing Title */}
          <div className="w-full md:w-1/2 bg-background md:pl-4 md:pb-0">
            <h2
              ref={titleBoxRef}
              className={`text-[32px] pb-2 md:pb-2 lg:pb-2  md:mt-8`}
              onClick={() => console.log(showListings[0])}
            >
              {showListings[0].title}
            </h2>
            <div className='flex justify-between pb-0 md:pb-1'>
              <h3 className='text-[24px]'> {showListings[0].roomCount} Beds | {showListings[0].bathroomCount} Baths </h3>
              <h3 className='text-[24px]'> ${showListings[0].calculatedPrice} / Mo </h3>
            </div>
          </div>
        </div>

        {/* Second flex container - Labels and Property Stats */}

        {/* Third flex container - Address Info and Sqft/Deposit */}
        {/* Use ref to track y position of bottom border of this container */}
        <div
          className="flex flex-col border-b md:border-none border-black mt-2 md:mt-0 md:flex-row w-full"
        >
          {/* Left side - Address Info Values */}
          <div className={`w-full md:w-1/2 pr-4 transition-transform duration-500
              ${!isScrolled ? '' : ''}`}
          >
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Mobile-only labels */}
              {/* Values */}
              <div className="w-full flex justify-between">
                <span className="text-[24px] text-[#404040] font-montserrat-regular w-2/3 truncate">
                  {showListings[0].locationString}
                </span>
                <span onClick={() => console.log(state.trip)} className="text-[24px] text-[#404040] font-montserrat-regular">
                  {showListings[0].distance?.toFixed(0)} miles
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Sqft and Deposit (Desktop only) */}
          <div className={`hidden md:block w-full sqft-deposit-box md:w-1/2 pl-4 bg-background transition-transform duration-500
              `}
            style={{ '--control-box-height': `${controlBoxHeight - titleBoxHeight}px` } as React.CSSProperties}>
            <div className="flex flex-col border-b pb-3 border-black">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[24px] text-[#404040] font-montserrat-regular ">{showListings[0].squareFootage} Sqft</p>
                </div>
                <div className="text-right">
                  <p className="text-[24px] text-[#404040] font-montserrat-regular">${showListings[0].depositSize} Dep.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second flex container - Map/Address and Listing Details */}
      <div className="flex flex-col-reverse md:flex-row w-full">
        {/* Left side - Map and Address */}
        <div className="w-full md:w-1/2 pr-4">
          <div
            className={`md:block sticky pt-0 md:p-0  ${!isScrolled ? '' : ''} transition-transform duration-500`}
            style={{
              top: `${controlBoxParentHeight + PLATFORM_NAVBAR_HEIGHT - 10}px`,
              height: `calc(100vh - ${controlBoxParentHeight + PLATFORM_NAVBAR_HEIGHT + 5}px)`
            }}
          >
            <SearchMap
              markers={[{
                lat: showListings[0]?.latitude,
                lng: showListings[0]?.longitude
              }]}
              center={{
                lat: showListings[0]?.latitude,
                lng: showListings[0]?.longitude
              }}
              zoom={13}
            />
          </div>
        </div>

        {/* Right side - Listing Details */}
        <div className={`w-full md:w-1/2 pl-4 transition-transform duration-500 `}
        >
          <ListingDetails listing={showListings[0]} />
        </div>
      </div>
    </div>
  );
};

export default MatchViewTab;
