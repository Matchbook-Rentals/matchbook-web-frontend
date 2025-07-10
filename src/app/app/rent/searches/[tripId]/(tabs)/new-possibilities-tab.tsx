import React from 'react';
import ImageCarousel from '../../(trips-components)/image-carousel';
import ButtonControl from '../../(trips-components)/button-controls';
import { HeartIcon } from '@/components/svgs/svg-components';
import { CrossIcon, RewindIcon } from 'lucide-react';
import TitleAndStats from '../../(trips-components)/title-and-stats';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../(trips-components)/description-and-amenities';
import { TripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import { lastDayOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';


const NewPossibilitiesTab: React.FC = () => {
  const tripContext = React.useContext(TripContext);
  if (!tripContext) {
    throw new Error('TripContext must be used within a TripContextProvider');
  }
  // State Items
  const {
    trip,
    actions,
    lookup,
    setLookup,
    showListings,
    setShowListings,
    viewedListings,
    setViewedListings
  } = tripContext;

  // Functions
  const handleLike = async (listing: ListingAndImages) => {
    setShowListings(prev => prev.slice(1));

    setLookup(prev => {
      const newFavs = new Map(prev.favMap)
      newFavs.set(listing.id, prev.favMap.size + 1)
      return { ...prev, favMap: newFavs }
    })

    let favId = await actions.createDbFavorite(trip.id, listing.id);
    setViewedListings(prev => [...prev, { listing: listing, action: 'favorite', actionId: favId }]);

  };

  const handleReject = async (listing: ListingAndImages) => {
    setShowListings(prev => prev.slice(1));

    setLookup(prev => {
      const newDislikes = new Set(prev.dislikedIds)
      newDislikes.add(listing.id)
      return { ...prev, dislikedIds: newDislikes }
    })

    let dislikeId = await actions.createDbDislike(trip.id, listing.id);
    setViewedListings(prev => [...prev, { listing: listing, action: 'dislike', actionId: dislikeId }]);
  };

  const handleBack = async () => {
    let lastAction = viewedListings[viewedListings.length - 1];
    setViewedListings(prev => prev.slice(0, -1));

    setShowListings(prev => [lastAction.listing, ...prev])
    if (lastAction.action === 'favorite') {
      await actions.deleteDbFavorite(lastAction.actionId)
      setLookup(prev => {
        let newFavs = new Map(prev.favMap);
        newFavs.delete(lastAction.listing.id)
        return { ...prev, favMap: newFavs }
      })
    }
    if (lastAction.action === 'dislike') {
      await actions.deleteDbDislike(lastAction.actionId)
      setLookup(prev => {
        let newDislikes = new Set(prev.dislikedIds);
        newDislikes.delete(lastAction.listing.id)
        return { ...prev, dislikedIds: newDislikes }
      })
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
  if (showListings === undefined) {
    return null;
  }
  if (showListings.length === 0) {
    return <div>No listings available.</div>;
  }

  // Main component render
  return (
    <div className="w-full">
      <ImageCarousel listingImages={showListings[0]?.listingImages || []} />
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
        distance={2.9}
      />
      <DescriptionAndAmenities
        description={showListings[0]?.description}
        amenities={getListingAmenities(showListings[0])}
      />
    </div>
  );
};

export default NewPossibilitiesTab;
