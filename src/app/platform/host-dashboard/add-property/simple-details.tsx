import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    squareFootage: false,
    title: false,
    description: false
  });

  const [bedTypes, setBedTypes] = useState<Array<string>>(Array(propertyDetails.roomCount).fill(''));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Listing, inputType: string) => {
    const value = event.target.value;
    setPropertyDetails(prev => ({ ...prev, [field]: inputType === 'number' ? Number(value) : value }));
    setErrors(prev => ({ ...prev, [field]: value === '' }));
  };

  const handleBedTypeChange = (index: number, value: string) => {
    const newBedTypes = [...bedTypes];
    newBedTypes[index] = value;
    setBedTypes(newBedTypes);
  };

  const handleNext = () => {
    const newErrors = {
      roomCount: propertyDetails.roomCount === null || propertyDetails.roomCount === undefined,
      bathroomCount: propertyDetails.bathroomCount === null || propertyDetails.bathroomCount === undefined,
      squareFootage: propertyDetails.squareFootage === null || propertyDetails.squareFootage === undefined,
      title: propertyDetails.title === '',
      description: propertyDetails.description === ''
    };
    setErrors(newErrors);
    const isValid = !Object.values(newErrors).includes(true); // Check if all errors are false
    if (isValid) {
      const bedrooms = bedTypes.map((bedType, index) => ({
        bedType,
        bedroomNumber: index + 1
      }));
      setPropertyDetails(prev => ({ ...prev, bedrooms }));
      goToNext();
    }
  };

  const numberFields = [
    { field: 'roomCount', label: 'Bedrooms', placeholder: 'Number of bedrooms', inputType: 'number' },
    { field: 'bathroomCount', label: 'Bathrooms', placeholder: 'Number of bathrooms', inputType: 'number' },
    { field: 'squareFootage', label: 'Square Footage', placeholder: 'Square footage', inputType: 'number' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 onClick={() => console.log(propertyDetails)} className="text-4xl font-bold text-center mb-8">Property Details</h1>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-center">
            <Label htmlFor="title">Listing Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter listing title"
              value={propertyDetails.title !== undefined ? propertyDetails.title : ''}
              onChange={e => handleChange(e, 'title', 'text')}
              className="w-full max-w-md"
            />
            {errors.title && <p className="text-red-500 mt-1">Please enter a valid listing title.</p>}
          </div>
          <div id='property-address-container' className='w-full col-span-2 flex items-center justify-center'>
            <div className='w-full max-w-lg flex flex-col justify-center p-4'>
              <Label htmlFor="property-address" className='text-center'>Property Address</Label>
              <AddressSuggest setPropertyDetails={setPropertyDetails} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={propertyDetails.description !== undefined ? propertyDetails.description : ''}
              onChange={e => handleChange(e, 'description', 'textarea')}
              className="w-full max-w-lg"
            />
            {errors.description && <p className="text-red-500 mt-1">Please enter a valid description.</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {numberFields.map((input) => (
            <div key={input.field} className="flex flex-col items-center">
              <Label htmlFor={input.field}>{input.label}</Label>
              <Input
                id={input.field}
                type={input.inputType}
                min={0}
                placeholder={input.placeholder}
                value={propertyDetails[input.field] !== undefined ? propertyDetails[input.field] : ''}
                onChange={e => handleChange(e, input.field as keyof Listing, input.inputType)}
                className="w-full max-w-xs"
              />
              {errors[input.field] && <p className="text-red-500 mt-1">Please enter a valid {input.placeholder.toLowerCase()}.</p>}
            </div>
          ))}
        </div>
        {propertyDetails.furnished && propertyDetails.roomCount > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-center border-b pb-2 mb-4">Bed Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: propertyDetails.roomCount }, (_, index) => (
                <BedTypeSelect
                  key={index}
                  bedroomIndex={index + 1}
                  selectedBedType={bedTypes[index]}
                  setSelectedBedType={(value) => handleBedTypeChange(index, value)}
                />
              ))}
            </div>
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
