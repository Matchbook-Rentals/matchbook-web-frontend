'use client';
import React, { useState } from 'react'
import ProgressBar from './progress-bar'
import PropertyCard from '../property-card';
import PropertyCarousel from './property-carousel';

export default function AddPropertyClient({handleListingCreation}) {
  const steps = ['Property Type', 'Details', 'Photos', 'Lease Terms', 'Amenities', 'Summary']
  const [currStep, setCurrstep] = useState(1);

  // const handleListingCreation = () => {
  //   alert('Finish this function in add-property-client')
  //   // Probably this function should be a server action passed from page.tsx
  // }

  return (
    <div>

      <ProgressBar steps={steps} currStep={currStep} size={8} />
      <PropertyCarousel handleListingCreation={handleListingCreation} setCurrStep={setCurrstep} />
    </div>
  )
}
