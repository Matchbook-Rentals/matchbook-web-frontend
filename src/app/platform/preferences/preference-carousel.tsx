'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import ListingTypeRadio from './listing-type-radio';
import RoomsCounter from './rooms-counter';
import FurnishedSelect from './furnished-select';


export default function PreferenceCarousel() {

  // State to keep track of the current index
  const [api, setApi] = useState<CarouselApi>();
  const [userPreferences, setUserPreferences] = useState({});

  // Function to go to the next question/component
  const goToNext = () => {
    console.log(userPreferences);
    api?.scrollNext();

  };

  // Function to go to the previous question/component
  const goToPrevious = () => {
    api?.scrollPrev()
  };

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
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>

  );
}