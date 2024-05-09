'use client';
import Image from 'next/image';
import React, { useState, Dispatch, SetStateAction } from 'react';
import PropertyFurnishedCheckbox from './property-furnished-checkbox';

interface PropertyTypeRadioProps {
  goToNext: () => void;
  goToPrev: () => void;
  setPropertyDetails: Dispatch<SetStateAction<any>>; // Consider specifying the actual type instead of 'any'
  propertyDetails: any;
}

const housingOptions = [
  { id: 'single_family', label: 'Single Family', src: '/img/listing-type/Single Family.png' },
  { id: 'multi_family', label: 'Multi Family', src: '/img/listing-type/Multi Family.png' },
  { id: 'townhouse', label: 'Townhouse', src: '/img/listing-type/Townhouse.png' },
  { id: 'apartment', label: 'Apartment', src: '/img/listing-type/Apartment.png' },
  { id: 'single_room', label: 'Single Room', src: '/img/listing-type/Single Room.png' },
];

const PropertyTypeRadio: React.FC<PropertyTypeRadioProps> = ({
  goToNext,
  setPropertyDetails,
  propertyDetails,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [validationError, setValidationError] = useState<boolean>(false);
  const [furnishedValidationError, setFurnishedValidationError] = useState<boolean>(false);

  const handleSelectionChange = (optionId: string) => {
    setSelectedType(optionId);
    setValidationError(false); // Reset validation error state on selection
    setPropertyDetails(prevDetails => ({
      ...prevDetails,
      category: optionId, // Ensure this matches the expected key in your property details object
    }));
  };

  const handleNext = () => {
    if (!selectedType) {
      // If no type is selected, trigger validation error and do not proceed
      setValidationError(true);
      return;
    }
    if (propertyDetails.furnished === undefined) {
      setFurnishedValidationError(true);
      return;
    }
    console.log('From radio', propertyDetails)
    goToNext();
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 className='text-2xl my-5 font-semibold'>What type of home is this?</h2>
      <div className="flex justify-between">
        {housingOptions.map((option) => (
          <div className='flex flex-col items-center justify-end cursor-pointer' key={option.id} onClick={() => handleSelectionChange(option.id)}>
            <Image alt={option.label} src={option.src} width={100} height={100} />
            <p className='text-xl font-semibold'>{option.label}</p>
            {/* Removed redundant input element to simplify the UI */}
            <div
              className={`w-6 h-6 rounded-full border-2 border-gray-400 ${selectedType === option.id ? 'bg-primaryBrand' : ''}`}
            ></div>
          </div>
        ))}
      </div>
      {validationError && <p className="text-red-500 mt-2">Please select a property type to continue.</p>}
      <PropertyFurnishedCheckbox setPropertyDetails={setPropertyDetails} setFurnishedValidationError={setFurnishedValidationError} />
      {furnishedValidationError && <p className="text-red-500 mt-2">Please select furnished/unfurnished to continue.</p>}
      <div className="flex justify-center mt-5">
        <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={handleNext}>NEXT</button>
      </div>
    </div>
  );
}

export default PropertyTypeRadio;
