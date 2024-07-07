import React from 'react';
import { Trip, Listing } from '@prisma/client';
import ImageCarousel from '../../(trips-components)/image-carousel';
import ButtonControl from '../../(trips-components)/button-controls';
import { HeartIcon } from '@/components/svgs/svg-components';
import { CrossIcon, RewindIcon } from 'lucide-react';
import TitleAndStats from '../../(trips-components)/title-and-stats';
import { amenities } from '@/lib/amenities-list';
import { DescriptionAndAmenities } from '../../(trips-components)/description-and-amenities';
import { TripContext } from '@/contexts/trip-context-provider';

const NewPossibilitiesTab: React.FC = () => {
  const tripContext = React.useContext(TripContext);
  if (!tripContext) {
    throw new Error('TripContext must be used within a TripContextProvider');
  }
  // State Items
  const [currListing, setCurrlisting] = React.useState(0);
  const { trip, setTrip, showListings, setListings, createDbFavorite } = tripContext;

  // Functions
  const handleLike = () => {
    createDbFavorite(trip.id, showListings[currListing].id);
    setTrip(prev => {
      const updatedTrip = { ...prev };
      updatedTrip.favorites.push({ tripId: trip.id, listingId: showListings[currListing].id, rank: prev.favorites.length + 1 })
      return updatedTrip;
    })
    setListings(prevListings => {
      const updatedListings = prevListings.filter(listing => listing.id !== showListings[currListing].id);
      return updatedListings;
    });
    setCurrlisting(prev => prev + 1)
  };

  const handleReject = () => {
    setCurrlisting(prev => prev + 1)
  };

  const handleBack = () => {
    setCurrlisting(prev => prev - 1);
  }

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
  if (currListing >= showListings.length) {
    return <div>No more listings to display.</div>;
  }

  // Main component render
  return (
    <div className="w-full">
      <ImageCarousel listingImages={showListings[currListing]?.listingImages || []} />
      <div className="button-control-box flex justify-around p-5">
        <ButtonControl
          handleClick={handleReject}
          Icon={
            <div className="transform rotate-45">
              <CrossIcon height={50} width={50} />
            </div>
          }
          className="bg-red-800/80 w-1/5 py-2 rounded-lg text-center flex justify-center text-white text-sm hover:bg-red-800 transition-all duration-200"
        />
        <ButtonControl
          handleClick={currListing === 0 ? () => console.log('No previous listing') : handleBack}
          Icon={<RewindIcon height={50} width={50} />}
          className={`${currListing === 0
            ? 'bg-black/10 cursor-default transition-all duration-500'
            : 'bg-black/50 hover:bg-black/70 cursor-pointer transition-all duration-300'
            } w-[10%] py-2 rounded-lg text-center flex justify-center text-white text-sm`}
        />
        <ButtonControl
          handleClick={handleLike}
          Icon={<HeartIcon height={50} width={50} />}
          className="bg-primaryBrand/80 hover:bg-primaryBrand w-1/5 py-2 rounded-lg text-center flex justify-center text-white text-sm transition-all duration-200"
        />
      </div>
      <TitleAndStats
        title={showListings[currListing]?.title}
        rating={3.5}
        numStays={0}
        numBath={showListings[currListing]?.bathroomCount}
        numBeds={showListings[currListing]?.roomCount}
        rentPerMonth={showListings[currListing]?.shortestLeasePrice}
        distance={2.9}
      />
      <DescriptionAndAmenities
        description={showListings[currListing]?.description}
        amenities={getListingAmenities(showListings[currListing])}
      />
    </div>
  );
};

export default NewPossibilitiesTab;
