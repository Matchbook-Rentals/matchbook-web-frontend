import React from 'react';
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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Listing) => {
    setPropertyDetails(prev => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Property Details</h1>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col items-center">
          <Label className="mb-2" htmlFor="property-address">
            Property Address
          </Label>
          <div id='property-address' className='w-full max-w-lg border'>
            <AddressSuggest setPropertyDetails={setPropertyDetails} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Label className="mb-2" htmlFor="bedrooms">
              Bedrooms?
            </Label>
            <Input
              className="w-full max-w-xs"
              id="bedrooms"
              type='number'
              placeholder="Number of bedrooms"
              value={propertyDetails.roomCount || ''}
              onChange={(e) => handleChange(e, 'roomCount')}
            />
          </div>
          <div className="flex flex-col items-center">
            <Label className="mb-2" htmlFor="bathrooms">
              Bathrooms?
            </Label>
            <Input
              className="w-full max-w-xs"
              id="bathrooms"
              type='number'
              placeholder="Number of bathrooms"
              value={propertyDetails.bathroomCount || ''}
              onChange={(e) => handleChange(e, 'bathroomCount')}
            />
          </div>
          <div className="flex flex-col items-center">
            <Label className="mb-2" htmlFor="square-footage">
              Square Footage
            </Label>
            <Input
              className="w-full max-w-xs"
              id="square-footage"
              type='number'
              placeholder="Total square footage"
              value={propertyDetails.squareFootage || ''}
              onChange={(e) => handleChange(e, 'squareFootage')}
            />
          </div>
        </div>
        {propertyDetails.roomCount > 0 && (
          <div className="mt-4">
            {/* Generate a BedTypeSelect component for each bedroom */}
            {Array.from({ length: propertyDetails.roomCount }, (_, index) => (
              <div key={index} className="mb-2">
                <BedTypeSelect bedroomIndex={index + 1} />
              </div>
            ))}
          </div>
        )}

      </div>

      <div className="flex gap-2 justify-center mt-5 p-1">
        <button
          className="bg-primaryBrand px-5 py-2 text-2xl shadow-md shadow-slate-500 hover:shadow-none text-white rounded-lg"
          onClick={goToPrevious}
        >
          BACK
        </button>
        <button
          className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg shadow-sm hover:shadow-none shadow-black "
          onClick={goToNext}
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
