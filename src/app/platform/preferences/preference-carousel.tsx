'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import ListingTypeRadio from './listing-type-radio';


export default function PreferenceCarousel() {

  // State to keep track of the current index
  const [api, setApi] = useState<CarouselApi>();
  const [userPreferences, setUserPreferences] = useState({});

  // Function to go to the next question/component
  const goToNext = () => {
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
          <ListingTypeRadio goToNext={goToNext} />
        </CarouselItem>
        <CarouselItem>
          <button onClick={goToPrevious}>HELLO</button>
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>

  );
}
