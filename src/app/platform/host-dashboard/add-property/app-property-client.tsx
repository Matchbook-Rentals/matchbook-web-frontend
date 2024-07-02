'use client';
import React, { useState } from 'react'
import ProgressBar from './progress-bar'
import PropertyCard from '../property-card';
import PropertyCarousel from './property-carousel';
import generateRandomListings from '@/app/utils/seed';

interface AddPropertyClientProps {
  handleListingCreation: () => void;
}

export default function AddPropertyClient({ handleListingCreation }: AddPropertyClientProps) {
  const steps = ['Property Type', 'Details', 'Photos', 'Lease Terms', 'Amenities', 'Summary']
  const [currStep, setCurrstep] = useState(1);

  const createListings = async () => {
    console.log('starting');
    let listings = generateRandomListings();
    for (let listing of listings) {
      let result = await handleListingCreation(listing);
      console.log(result);
      setTimeout(() => console.log('starting next'), 2000);
    }

  }
  //The following button is for seeding, should be removed once seed data looks good

  return (
    <div>
      <button onClick={createListings}> CLICK ME </button>
      <ProgressBar steps={steps} currStep={currStep} size={8} />
      <PropertyCarousel handleListingCreation={handleListingCreation} setCurrStep={setCurrstep} />
    </div>
  )
}
