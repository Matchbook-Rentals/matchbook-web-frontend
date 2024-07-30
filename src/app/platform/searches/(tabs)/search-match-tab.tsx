'use client'
import React, { use } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { HeartIcon } from '@/components/svgs/svg-components';
import { CrossIcon, RewindIcon } from 'lucide-react';
import TitleAndStats from '../../trips/(trips-components)/title-and-stats';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../trips/(trips-components)/description-and-amenities';
import { useSearchContext } from '@/contexts/search-context-proivder';
import { ListingAndImages } from '@/types';

const MatchViewTab: React.FC = () => {
  const { state, actions, lookup } = useSearchContext();
  const { showListings, likedListings, dislikedListings, listings, viewedListings } = state;

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    // Implement like functionality using SearchContext
  };

  const handleReject = async (listing: ListingAndImages) => {
    // Implement reject functionality using SearchContext
  };

  const handleBack = async () => {
    // Implement back functionality using SearchContext
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
  if (showListings === undefined) {
    return null;
  }
  if (showListings.length === 0) {
    return <div>No listings available. {listings.length} {state.currentSearch?.id}</div>;
  }

  // Main component render
  return (
    <div className="w-full">
      <ListingImageCarousel listingImages={showListings[0]?.listingImages || []} />
      <div className="button-control-box flex justify-around p-5">
        <ButtonControl
          handleClick={() => handleReject(showListings[0])}
          Icon={
            <div className="transform rotate-45">
              <CrossIcon height={50} width={50} />
            </div>
          }
          className="bg-red-800/80 w-1/5 py-2 rounded-lg text-center flex justify-center text-white text-sm hover:bg-red-800 transition-all duration-200"
        />
        <ButtonControl
          handleClick={viewedListings.length === 0 ? () => console.log('No previous listing') : handleBack}
          Icon={<RewindIcon height={50} width={50} />}
          className={`${viewedListings.length === 0
            ? 'bg-black/10 cursor-default transition-all duration-500'
            : 'bg-black/50 hover:bg-black/70 cursor-pointer transition-all duration-300'
            } w-[10%] py-2 rounded-lg text-center flex justify-center text-white text-sm`}
        />
        <ButtonControl
          handleClick={() => handleLike(showListings[0])}
          Icon={<HeartIcon height={50} width={50} />}
          className="bg-primaryBrand/80 hover:bg-primaryBrand w-1/5 py-2 rounded-lg text-center flex justify-center text-white text-sm transition-all duration-200"
        />
      </div>
      <TitleAndStats
        title={showListings[0]?.title}
        rating={3.5}
        numStays={0}
        numBath={showListings[0]?.bathroomCount}
        numBeds={showListings[0]?.roomCount}
        rentPerMonth={showListings[0]?.shortestLeasePrice}
        distance={showListings[0]?.distance ? parseFloat(showListings[0]?.distance.toFixed(2)) : undefined}
      />
      <DescriptionAndAmenities
        description={showListings[0]?.description}
        amenities={getListingAmenities(showListings[0])}
      />
    </div>
  );
};

export default MatchViewTab;