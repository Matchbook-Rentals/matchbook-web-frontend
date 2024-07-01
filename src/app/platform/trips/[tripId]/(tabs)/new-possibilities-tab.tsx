//Please set this component up with CarouselButtonControls included. It's a shadcn carousel which expects the onback and onprevious fxs to come from the api

import React from 'react';
import { Trip } from '@prisma/client';
import { Carousel, CarouselContent, CarouselItem, CarouselApi, CarouselPrevious, CarouselNext, } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import ImageCarousel from '../../(trips-components)/image-carousel';

interface NewPossibilitiesTabProps {
  listings: any[]; // Replace 'any' with the actual type of your listings
  setListings: React.Dispatch<React.SetStateAction<any[]>>; // Replace 'any' with the actual type of your listings
  trip: Trip;
}


const NewPossibilitiesTab: React.FC<NewPossibilitiesTabProps> = ({ listings, setListings, trip }) => {
  //State Items
  const [currListing, setCurrlisting] = React.useState(0);

  //Functions

  const handleLike = () => {
  };

  const handleReject = () => {
  };

  return (
    <div className="w-full">
      {trip?.latitude && (
        <p onClick={() => console.log(listings[currListing].listingImages)}>
          Latitude: {trip?.latitude}, Longitude: {trip?.longitude}
        </p>
      )}
      <ImageCarousel listingImages={listings[currListing]?.listingImages || []} />


    </div>
  );
};

export default NewPossibilitiesTab;
