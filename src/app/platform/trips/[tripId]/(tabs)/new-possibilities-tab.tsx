//Please set this component up with CarouselButtonControls included. It's a shadcn carousel which expects the onback and onprevious fxs to come from the api

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

interface NewPossibilitiesTabProps {
  listings: Listing[]; // Replace 'any' with the actual type of your listings
  setListings: React.Dispatch<React.SetStateAction<any[]>>; // Replace 'any' with the actual type of your listings
  trip?: Trip;
}


const NewPossibilitiesTab: React.FC<NewPossibilitiesTabProps> = ({ listings, setListings }) => {
  //State Items
  const [currListing, setCurrlisting] = React.useState(0);
  const { trip, createDbFavorite } = React.useContext(TripContext);

  //Functions
  const handleLike = () => {
    createDbFavorite(trip.id, listings[currListing].id);

    setListings(prevListings => {
      const updatedListings = [...prevListings];
      updatedListings.splice(currListing, 1);
      return updatedListings;
    });

    setCurrlisting(prev => prev + 1)
  };

  // Note: This assumes that 'listings' is managed by a state hook.
  // If it's not, you may need to adjust the logic accordingly.

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
  if (listings === undefined) {
    return null;
  }

  if (listings.length === 0) {
    return <div>No listings available.</div>;
  }

  if (currListing >= listings.length) {
    return <div>No more listings to display.</div>;
  }

  // Main component render
  return (
    <div className="w-full">
      <ImageCarousel listingImages={listings[currListing]?.listingImages || []} />
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
        title={listings[currListing]?.title}
        rating={3.5}
        numStays={0}
        numBath={listings[currListing]?.bathroomCount}
        numBeds={listings[currListing]?.roomCount}
        rentPerMonth={listings[currListing]?.shortestLeasePrice}
        distance={2.9}
      />
      <DescriptionAndAmenities
        description={listings[currListing]?.description}
        amenities={getListingAmenities(listings[currListing])}
      />
    </div>
  );
};

export default NewPossibilitiesTab;

