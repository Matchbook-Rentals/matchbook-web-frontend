'use client'
import React, { use } from 'react';
import ListingImageCarousel from '../../trips/(trips-components)/image-carousel';
import ButtonControl from '../../trips/(trips-components)/button-controls';
import { HeartIcon } from '@/components/svgs/svg-components';
import { CrossIcon, RewindIcon } from 'lucide-react';
import TitleAndStats from '../../trips/(trips-components)/title-and-stats';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../trips/(trips-components)/description-and-amenities';
import { useSearchContext } from '@/contexts/search-context-provider';
import { ListingAndImages } from '@/types';
import LoadingSpinner from '@/components/ui/spinner';
import { deleteDbDislike, createDbDislike } from '@/app/actions/dislikes';
import { deleteDbFavorite, createDbFavorite } from '@/app/actions/favorites';

const MatchViewTab: React.FC = () => {
  const { state, actions } = useSearchContext();
  const { showListings, listings, viewedListings, lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { setViewedListings, setLookup } = actions;

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    const actionId = await createDbFavorite(state.currentSearch?.id, listing.id);
    setViewedListings(prev => [...prev, { listing, action: 'favorite', actionId }]);
    setLookup(prev => ({
      ...prev,
      favIds: new Set([...prev.favIds, listing.id])
    }));
  };

  const handleReject = async (listing: ListingAndImages) => {
    const actionId = await createDbDislike(state.currentSearch?.id, listing.id);
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
              <CrossIcon height={40} width={40} />
            </div>
          }
          className="bg-red-800/80 w-1/5 py-2 rounded-lg text-center flex justify-center text-white text-sm hover:bg-red-800 transition-all duration-200"
        />
        <ButtonControl
          handleClick={viewedListings.length === 0 ? () => console.log('No previous listing') : handleBack}
          Icon={<RewindIcon height={40} width={40} />}
          className={`${viewedListings.length === 0
            ? 'bg-black/10 cursor-default transition-all duration-500'
            : 'bg-black/50 hover:bg-black/70 cursor-pointer transition-all duration-300'
            } w-[10%] py-2 rounded-lg text-center flex justify-center text-white text-sm`}
        />
        <ButtonControl
          handleClick={() => handleLike(showListings[0])}
          Icon={<HeartIcon height={40} width={40} />}
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
        distance={showListings[0]?.distance ? parseFloat(showListings[0]?.distance.toFixed(1)) : undefined}
      />
      <DescriptionAndAmenities
        description={showListings[0]?.description}
        amenities={getListingAmenities(showListings[0])}
      />
    </div>
  );
};

export default MatchViewTab;