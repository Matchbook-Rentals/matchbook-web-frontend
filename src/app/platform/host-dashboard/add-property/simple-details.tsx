import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Listing } from '@prisma/client';
import AddressSuggest from './address-suggest';
import BedTypeSelect from './bed-type-select';

interface SimpleDetailsProps {
  propertyDetails: Listing;
  setPropertyDetails: React.Dispatch<React.SetStateAction<Listing>>;
  goToNext: () => void;
  goToPrevious: () => void;
}

export default function SimpleDetails({ propertyDetails, setPropertyDetails, goToNext, goToPrevious }: SimpleDetailsProps) {
  const [errors, setErrors] = useState({
    roomCount: false,
    bathroomCount: false,
    squareFootage: false
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Listing) => {
    const value = event.target.value;
    setPropertyDetails(prev => ({ ...prev, [field]: Number(value) }));
    setErrors(prev => ({ ...prev, [field]: value === '' }));
  };

  const handleNext = () => {
    const newErrors = {
      roomCount: propertyDetails.roomCount === null || propertyDetails.roomCount === undefined,
      bathroomCount: propertyDetails.bathroomCount === null || propertyDetails.bathroomCount === undefined,
      squareFootage: propertyDetails.squareFootage === null || propertyDetails.squareFootage === undefined
    };
    setErrors(newErrors);
    const isValid = !Object.values(newErrors).includes(true); // Check if all errors are false
    if (isValid) {
      goToNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Property Details</h1>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col items-center">
          <Label htmlFor="property-address" className='mb-1'>Property Address</Label>
          <div id='property-address' className='w-full max-w-lg border'>
            <AddressSuggest setPropertyDetails={setPropertyDetails} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {[
            { field: 'roomCount', label: 'Bedrooms', placeholder: 'Number of bedrooms' },
            { field: 'bathroomCount', label: 'Bathrooms', placeholder: 'Number of bathrooms' },
            { field: 'squareFootage', label: 'Square Footage', placeholder: 'Square footage' }
          ].map((input) => (
            <div key={input.field} className="flex flex-col items-center">
              <Label htmlFor={input.field}>{input.label}?</Label>
              <Input
                id={input.field}
                type='number'
                min={0}
                placeholder={input.placeholder}
                value={propertyDetails[input.field] !== undefined ? propertyDetails[input.field] : ''}
                onChange={e => handleChange(e, input.field as keyof Listing)}
                className="w-full max-w-xs"
              />
              {errors[input.field] && <p className="text-red-500 mt-1">Please enter a valid {input.placeholder.toLowerCase()}.</p>}
            </div>
          ))}
        </div>
        {propertyDetails.furnished && propertyDetails.roomCount > 0 && (
          <div className="mt-4">
            {Array.from({ length: propertyDetails.roomCount }, (_, index) => (
              <BedTypeSelect key={index} bedroomIndex={index + 1} />
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-center mt-5 p-1">
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToPrevious}>BACK</button>
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={handleNext}>NEXT</button>
      </div>
    </div>
  );
}
