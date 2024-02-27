'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel"
import ListingTypeRadio from './listing-type-radio';


export default function PreferenceCarousel() {
  const questions = [
    'What kind of place are you looking for?',
    'How many bedrooms and bathrooms?',
    'Are you looking for a furnished stay?',
    'What are your preferred amenities?'
  ];

  // Define an array of components for demonstration purposes.
  // Normally, you might have more complex components here.
  const components = [
    <button key="0">Select Type</button>,
    <button key="1">Select Bedrooms/Bathrooms</button>,
    <button key="2">Choose Furnishing</button>,
    <button key="3">Choose Amenities</button>,
  ];

  // State to keep track of the current index
  const [currIndex, setCurrIndex] = useState(0);

  // Function to go to the next question/component
  const goToNext = () => {
    setCurrIndex((prevIndex) => (prevIndex + 1) % questions.length); // Loop back to the first question after the last
  };

  // Function to go to the previous question/component
  const goToPrevious = () => {
    setCurrIndex((prevIndex) => (prevIndex - 1 + questions.length) % questions.length); // Go to the last question if at the first
  };

  return (
    <Carousel className='w-1/2 h-1/2 m-auto' opts={{watchDrag: false}}>
      <CarouselContent>
        <CarouselItem>
          <ListingTypeRadio />
        </CarouselItem>
        <CarouselItem>
          <ListingTypeRadio />
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>

  );
}
