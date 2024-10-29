'use client'
import React, { use } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { BrandHeart, HeartIcon, PictureIcon, RejectIcon, ReturnIcon } from '@/components/svgs/svg-components';
import TitleAndStats from '../../trips/(trips-components)/title-and-stats';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../trips/(trips-components)/description-and-amenities';
//import { useSearchContext } from '@/contexts/search-context-provider';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import { deleteDbDislike, createDbDislike } from '@/app/actions/dislikes';
import { deleteDbFavorite, createDbFavorite } from '@/app/actions/favorites';
import { Button } from '@/components/ui/button';
import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { BiQuestionMark } from 'react-icons/bi';

const MatchViewTab: React.FC = () => {
  const { state, actions } = useTripContext();
  const { showListings, listings, viewedListings, lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { setViewedListings, setLookup } = actions;

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
    <div className="w-full ">
      <ListingImageCarousel listingImages={showListings[0]?.listingImages || []} />
      <div className="button-control-box flex justify-around p-3 md:p-5 w-full md:w-1/2 gap-2">

        <ButtonControl
          handleClick={() => handleReject(showListings[0])}
          Icon={<RejectIcon height="50%" width="50%" />}
          className="bg-pinkBrand/70 hover:bg-pinkBrand h-[20vw] w-[20vw] md:h-[150px] md:w-[150px] flex items-center justify-center p-4 rounded-full text-center text-white text-sm transition-all duration-200"
        />

        <ButtonControl
          handleClick={viewedListings.length === 0 ? () => console.log('No previous listing') : handleBack}
          Icon={<ReturnIcon height="60%" width="60%" />}
          className="bg-orangeBrand/70 hover:bg-orangeBrand h-[15vw] w-[15vw] md:h-[100px] md:w-[100px] self-center rounded-full text-center flex items-center justify-center text-white text-sm transition-all duration-200"
        />

        <ButtonControl
          handleClick={() => console.log('Help clicked')}
          Icon={<QuestionMarkIcon height="60%" width="60%" />}
          className="bg-yellowBrand/80 hover:bg-yellowBrand h-[15vw] w-[15vw] md:h-[100px] md:w-[100px] self-center rounded-full text-center flex items-center justify-center text-white text-sm transition-all duration-200"
        />

        <ButtonControl
          handleClick={() => handleLike(showListings[0])}
          Icon={<BrandHeart height="40%" width="40%" />}
          className="bg-primaryBrand/70 hover:bg-primaryBrand h-[20vw] w-[20vw] md:h-[150px] md:w-[150px] rounded-full text-center flex items-center justify-center text-white text-sm transition-all duration-200"
        />

      </div>
      <TitleAndStats
        title={showListings[0]?.title}
        rating={3.5}
        numStays={0}
        numBath={showListings[0]?.bathroomCount}
        numBeds={showListings[0]?.roomCount}
        rentPerMonth={showListings[0]?.calculatedPrice || 0}
        distance={showListings[0]?.distance ? parseFloat(showListings[0]?.distance.toFixed(1)) : undefined}
        deposit={showListings[0]?.depositSize}
        sqft={showListings[0]?.squareFootage}
        bedrooms={showListings[0]?.bedrooms}
        searchLocation={state.trip?.locationString}
      />

      <DescriptionAndAmenities
        description={showListings[0]?.description}
        amenities={getListingAmenities(showListings[0])}
        listingPin={{ lat: showListings[0]?.latitude, lng: showListings[0]?.longitude }}
        user={showListings[0]?.user}
        address={showListings[0]?.locationString}
        bathroomCount={showListings[0]?.bathroomCount}
        roomCount={showListings[0]?.roomCount}
        propertyType={showListings[0]?.category}
      />

    </div>
  );
};

export default MatchViewTab;
