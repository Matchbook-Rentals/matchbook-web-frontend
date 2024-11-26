'use client'
//IMports
import React, { useEffect, useState } from 'react';
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
  const { setViewedListings, setLookup } = actions;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolledDeep, setIsScrolledDeep] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setIsScrolledDeep(window.scrollY > 900);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    const actionId = await createDbFavorite(state.trip?.id, listing.id);
    setViewedListings(prev => [...prev, { listing, action: 'favorite', actionId }]);
    setLookup(prev => ({
      ...prev,
      favIds: new Set([...prev.favIds, listing.id])
    }));
  };

  const handleReject = async (listing: ListingAndImages) => {
    const actionId = await createDbDislike(state.trip?.id, listing.id);
    setViewedListings(prev => [...prev, { listing, action: 'dislike', actionId }]);
    setLookup(prev => ({
      ...prev,
      dislikedIds: new Set([...prev.dislikedIds, listing.id])
    }));
  };

  const handleBack = async () => {
    let lastAction = viewedListings[viewedListings.length - 1];
    setViewedListings(prev => prev.slice(0, -1));

    if (lastAction.action === 'favorite') {
      await deleteDbFavorite(lastAction.actionId)
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds].filter(id => id !== lastAction.listing.id))
      }));
    } else if (lastAction.action === 'dislike') {
      await deleteDbDislike(lastAction.actionId)
      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== lastAction.listing.id))
      }));
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
    <div className={`w-full `}>
      <ListingImageCarousel
        listingImages={showListings[0]?.listingImages || []}
      />

      <div className="flex flex-col md:flex-row gap-x-4">
        {/* Left Column */}
        <div className="w-full md:w-1/2 sticky top-[50px] md:top-0">
          {/* Button Controls */}
          <div className={`button-control-box ${isScrolledDeep ? 'bg-background' : 'bg-transparent'}
                   sticky top-[0px] md:top-[60px] z-10 flex justify-evenly
                   lg:justify-center lg:gap-x-8 pb-2 pt-3 md:px-5 w-full
                   ${!isScrolled ? 'md:-translate-y-1/2' : ''} gap-2 transition-transform duration-500`}>
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
              handleClick={() => console.log('Help clicked')}
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
                  className='h-[70%] w-[70%] md:h-[50%] md:w-[50%] rounded-2xl'
                />
              }
              className={`
              bg-primaryBrand/75 hover:bg-primaryBrand/95 w-[20vw] aspect-square
              md:w-[150px] flex items-center justify-center p-4 rounded-full text-center
              text-white text-sm transition-all duration-200
            `}
            />
          </div>

          {/* Map and Address Section */}
          <div className={`hidden md:block sticky top-[230px] ${!isScrolled ? 'md:-translate-y-[65px]' : ''} transition-transform duration-500`}>
            {/* Address and distance information */}
            <div className="w-full space-y-2 sm:space-y-0 flex flex-col sm:flex-row md:flex-col xl:flex-row justify-between items-start sm:items-center md:items-start xl:items-center mb-4">
              {/* Address display */}
              <div className="flex flex-col w-full sm:w-auto">
                <span className="text-sm xxs:text-lg md:text-md lg:text-lg xl:text-xl text-gray-500">Address</span>
                <span className="text-lg xxs:text-xl md:text-xl lg:text-xl xl:text-2xl truncate  font-medium max-w-[300px]">
                  {showListings[0].locationString}
                </span>
              </div>
              {/* Distance display */}
              <div className="flex flex-col sm:text-right md:text-left xl:text-right w-full sm:w-auto">
                <span className="text-sm xxs:text-lg md:text-md lg:text-lg xl:text-xl text-gray-500">Distance</span>
                <span className="text-lg xxs:text-xl md:text-xl lg:text-xl xl:text-3xl font-medium">
                  {showListings[0].distance?.toFixed(0)} miles
                </span>
              </div>
            </div>

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

        {/* Right Column */}
        <ListingDetails listing={showListings[0]} />
      </div>
    </div>
  );
};

export default MatchViewTab;
