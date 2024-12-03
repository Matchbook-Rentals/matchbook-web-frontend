'use client'
//IMports
import React, { useEffect, useState, useRef } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { BrandHeart, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../trips/(trips-components)/description-and-amenities';
//import { useSearchContext } from '@/contexts/search-context-provider';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/spinner';
import { deleteDbDislike, createDbDislike } from '@/app/actions/dislikes';
import { deleteDbFavorite, createDbFavorite } from '@/app/actions/favorites';
import { Montserrat } from 'next/font/google';
import SearchMap from '../(components)/search-map';
import ListingDetails from '../(components)/listing-details';
import { QuestionMarkIcon } from '@radix-ui/react-icons';


const montserrat = Montserrat({ subsets: ["latin"] });

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 500);
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

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    await optimisticLike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'favorite', actionId: '' }];
      console.log('Viewed listings after like:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleReject = async (listing: ListingAndImages) => {
    await optimisticDislike(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'dislike', actionId: '' }];
      console.log('Viewed listings after dislike:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleMaybe = async (listing: ListingAndImages) => {
    await optimisticMaybe(listing.id);
    setViewedListings(prev => {
      const newState = [...prev, { listing, action: 'maybe', actionId: '' }];
      console.log('Viewed listings after maybe:', newState);
      return newState.slice(-MAX_HISTORY);
    });
  };

  const handleBack = async () => {
    if (viewedListings.length === 0 || isProcessing) return;

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
    <div className={`w-full`}>
      <ListingImageCarousel
        listingImages={showListings[0]?.listingImages || []}
      />

      {/* Sticky container for all three flex sections */}
      <div className="sticky top-[60px] z-10">
        {/* First flex container - Controls and Title */}
        <div className="flex flex-col md:flex-row w-full space-x-4">
          {/* Left side - Button Controls */}
          <div className="w-full md:w-1/2">
            <div className={`button-control-box bg-background ${isScrolledDeep ? 'md:bg-background' : 'md:bg-transparent'}
                     sticky top-[0px] md:top-[60px] z-10 flex justify-evenly
                     lg:justify-center lg:gap-x-8 pb-2 pt-3 md:px-5 md:pt-4 w-full
                     ${!isScrolled ? 'md:-translate-y-1/2' : ''} gap-2 transition-transform duration-500`}
              ref={controlBoxRef}>
              <ButtonControl
                handleClick={() => handleReject(showListings[0])}
                Icon={<RejectIcon className='h-[60%] w-[60%] md:h-[50%] md:w-[50%] rounded-full' />}
                className={`bg-pinkBrand/70 hover:bg-pinkBrand w-[20vw] aspect-square md:w-[150px]
                flex items-center justify-center p-4 rounded-full text-center text-white
                text-sm transition-all duration-200`}
              />

              <ButtonControl
                handleClick={
                  viewedListings.length === 0
                    ? () => console.log('No previous listing')
                    : handleBack
                }
                Icon={<ReturnIcon className='h-[60%] w-[60%] rounded-full' />}
                className={`
                bg-orangeBrand/70 hover:bg-orangeBrand w-[13vw] aspect-square
                md:w-[100px] self-center rounded-full text-center flex items-center
                justify-center text-white text-sm transition-all duration-200
              `}
              />

              <ButtonControl
                handleClick={() => handleMaybe(showListings[0])}
                Icon={<QuestionMarkIcon className='h-[60%] w-[60%] rounded-full' />}
                className={`
                bg-yellowBrand/80 hover:bg-yellowBrand w-[13vw] aspect-square
                md:w-[100px] self-center rounded-full text-center flex items-center
                justify-center text-white text-sm transition-all duration-200
              `}
              />

              <ButtonControl
                handleClick={() => handleLike(showListings[0])}
                Icon={
                  <BrandHeart
                    className='h-[70%] w-[70%] aspect-square md:w-[50%] rounded-2xl'
                  />
                }
                className={`
                bg-primaryBrand/75 hover:bg-primaryBrand/95 w-[20vw] aspect-square
                md:w-[150px] flex items-center justify-center p-4 rounded-full text-center
                text-white text-sm transition-all duration-200
              `}
              />
            </div>
          </div>

          {/* Right side - Listing Title */}
          <div className="w-full md:w-1/2 bg-background pb-1">
            <h2 className={`md:text-3xl lg:text-[36px] text-black font-medium mt-8 `}>
              {showListings[0].title}
            </h2>
          </div>
        </div>

        {/* Second flex container - Labels and Property Stats */}
        <div className="flex flex-col md:flex-row w-full space-x-4">
          {/* Left side - Info Labels */}
          <div className={`w-full md:w-1/2 transition-transform duration-500
              ${!isScrolled ? 'md:-translate-y-[calc(var(--control-box-height)/2)]' : ''}`}
               style={{ '--control-box-height': `${controlBoxHeight}px` } as React.CSSProperties}>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm xxs:text-lg md:text-md lg:text-lg xl:text-xl text-charcoalBrand font-medium">Address</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm xxs:text-lg md:text-md lg:text-lg xl:text-xl text-charcoalBrand font-medium">Distance</span>
              </div>
            </div>
          </div>

          {/* Right side - Bedroom/Bathroom Count and Price */}
          <div className="w-full md:w-1/2 bg-background transition-transform duration-500 md:-translate-y-[calc(var(--control-box-height)/2)]"
               style={{ '--control-box-height': `${controlBoxHeight}px` } as React.CSSProperties}>
            <div className="flex justify-between items-center ">
              <div>
                <h2 className="text-2xl md:text-[32px] mb-2 font-medium">3 BR | 2 BA</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl md:text-[32px] mb-2 font-medium">${controlBoxHeight} / Mo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Third flex container - Address Info and Sqft/Deposit */}
        <div className="flex flex-col md:flex-row w-full space-x-4">
          {/* Left side - Address Info Values */}
          <div className={`w-full md:w-1/2 transition-transform duration-500
              ${!isScrolled ? 'md:-translate-y-[calc(var(--control-box-height)/2)]' : ''}`}
               style={{ '--control-box-height': `${controlBoxHeight}px` } as React.CSSProperties}>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-lg xxs:text-xl md:text-xl lg:text-xl xl:text-2xl truncate font-medium max-w-[300px]">
                  {showListings[0].locationString}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-lg xxs:text-xl md:text-xl lg:text-xl xl:text-3xl font-medium">
                  {showListings[0].distance?.toFixed(0)} miles
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Sqft and Deposit */}
          <div className="w-full md:w-1/2 bg-background transition-transform duration-500 md:-translate-y-[calc(var(--control-box-height)/2)]"
               style={{ '--control-box-height': `${controlBoxHeight}px` } as React.CSSProperties}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg md:text-2xl text-gray-600">1,500 Sqft</p>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl ">$1500 Dep.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second flex container - Map/Address and Listing Details */}
      <div className="flex flex-col md:flex-row w-full space-x-4">
        {/* Left side - Map and Address */}
        <div className="w-full md:w-1/2">
          <div className={`md:block sticky z-10 top-[230px] ${!isScrolled ? '' : 'md:translate-y-[00px]'} transition-transform duration-500`}>
            <SearchMap
              markers={[{
                lat: showListings[0]?.latitude,
                lng: showListings[0]?.longitude
              }]}
              center={{
                lat: showListings[0]?.latitude,
                lng: showListings[0]?.longitude
              }}
              zoom={12}
            />
          </div>
        </div>

        {/* Right side - Listing Details */}
        <div className="w-full md:w-1/2">
          <ListingDetails listing={showListings[0]} />
        </div>
      </div>
    </div>
  );
};

export default MatchViewTab;
