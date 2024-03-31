
'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
// import ListingTypeRadio from './listing-type-radio';
// import RoomsCounter from './rooms-counter';
// import FurnishedSelect from './furnished-select';
// import AmenitiesSelect from './amenties-select';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import prisma from '@/lib/prismadb'
import PropertyTypeRadio from './property-type-radio';
import { Button } from '@/components/ui/button';


export default function PropertyCarousel({ handleListingCreation, setCurrStep }) {
  const { isSignedIn, user } = useUser();

  // State to keep track of the current index
  const [api, setApi] = useState<CarouselApi>();
  const [propertyDetails, setPropertyDetails] = useState({ userId: user?.id });
  const router = useRouter();

  // Function to go to the next question/component
  const goToNext = () => {
    console.log(propertyDetails);
    setCurrStep(prev => prev + 1)
    api?.scrollNext();

  };

  // Function to go to the previous question/component
  const goToPrevious = () => {
    setCurrStep(prev => prev - 1)
    api?.scrollPrev()
  };


  const handleFinish = (amenities) => {
    const tempPreferences = { ...propertyDetails, amenities }
    handleListingCreation();
    router.push(`/platform/host-dashboard`)
  }

  return (
    <Carousel className='w-1/2 h-1/2 m-auto' opts={{ watchDrag: false }} setApi={setApi}>
      <CarouselContent>
        <CarouselItem>
          {/* <ListingTypeRadio goToNext={goToNext} setUserPreferences={setUserPreferences} /> */}
          <PropertyTypeRadio setPropertyDetails={setPropertyDetails} goToNext={goToNext} />
        </CarouselItem>
        <CarouselItem>
          {/* <RoomsCounter goToNext={goToNext} goToPrev={goToPrevious} setUserPreferences={setUserPreferences} /> */}
          <p>DETAILS</p>
          <Button onClick={goToPrevious}>GO BACK</Button>
          <Button>GO BACK</Button>
        </CarouselItem>
        <CarouselItem>
          {/* <FurnishedSelect goToNext={goToNext} goToPrev={goToPrevious} setUserPreferences={setUserPreferences} /> */}
        </CarouselItem>
        <CarouselItem>
          {/* <AmenitiesSelect goToPrev={goToPrevious} setUserPreferences={setUserPreferences} handleFinish={handleFinish} /> */}
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>

  );
}
