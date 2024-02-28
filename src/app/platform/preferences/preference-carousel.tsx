'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import ListingTypeRadio from './listing-type-radio';
import RoomsCounter from './rooms-counter';
import FurnishedSelect from './furnished-select';
import AmenitiesSelect from './amenties-select';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';


export default function PreferenceCarousel() {
  const { isSignedIn, user } = useUser();

  // State to keep track of the current index
  const [api, setApi] = useState<CarouselApi>();
  const [userPreferences, setUserPreferences] = useState({});
  const router = useRouter();

  // Function to go to the next question/component
  const goToNext = () => {
    console.log(userPreferences);
    api?.scrollNext();

  };

  // Function to go to the previous question/component
  const goToPrevious = () => {
    api?.scrollPrev()
  };

  // const updateUserPrefernces = async () => {
  //   'use server';
  // }

  const handleFinish = (amenities) => {
    const tempPreferences = {...userPreferences, amenities}
    if (!isSignedIn) {
      let stringifiedPreferences = JSON.stringify(tempPreferences);
      localStorage.setItem('matchbookUserPreferences', stringifiedPreferences);
      let queryString = localStorage.getItem('tripQueryString');
     router.push(`/guest/trips/${queryString}`) 
     return null;
    }

    





  }

  return (
    <Carousel className='w-1/2 h-1/2 m-auto' opts={{ watchDrag: false }} setApi={setApi}>
      <CarouselContent>
        <CarouselItem>
          <ListingTypeRadio goToNext={goToNext} setUserPreferences={setUserPreferences} />
        </CarouselItem>
        <CarouselItem>
          <RoomsCounter goToNext={goToNext} goToPrev={goToPrevious} setUserPreferences={setUserPreferences} />
        </CarouselItem>
        <CarouselItem>
          <FurnishedSelect goToNext={goToNext} goToPrev={goToPrevious} setUserPreferences={setUserPreferences} />
        </CarouselItem>
        <CarouselItem>
          <AmenitiesSelect goToPrev={goToPrevious} setUserPreferences={setUserPreferences} handleFinish={handleFinish} />
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>

  );
}
