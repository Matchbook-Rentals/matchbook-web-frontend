'use client';
import React, { useState } from 'react'
import ProgressBar from './progress-bar'
import PropertyCard from '../property-card';
import PropertyCarousel from './property-carousel';

export default function AddPropertyClient() {
  const steps = ['Property Type', 'Details', 'Photos', 'Lease Terms', 'Amenities']
  const [currStep, setCurrstep] = useState(1);
  const [propertyDetails, setPropertyDetails] = useState({});

  return (
    <div>

      <ProgressBar steps={steps} currStep={currStep} size={8} />
      <PropertyCarousel />
    </div>
  )
}
