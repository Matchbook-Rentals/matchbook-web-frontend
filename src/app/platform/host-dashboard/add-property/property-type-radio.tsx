import Image from 'next/image';
import React, { useState, Dispatch, SetStateAction } from 'react';

interface PropertyTypeRadioProps {
  goToNext: () => void;
  goToPrev: () => void;
  setPropertyDetails: Dispatch<SetStateAction<any>>; // Consider specifying the actual type instead of 'any'
}

const housingOptions = [
  { id: 'single_family', label: 'Single Family', src: '/img/listing-type/Single Family.png' },
  { id: 'multi_family', label: 'Multi Family', src: '/img/listing-type/Multi Family.png' },
  { id: 'townhouse', label: 'Townhouse', src: '/img/listing-type/Townhouse.png'},
  { id: 'apartment', label: 'Apartment', src: '/img/listing-type/Apartment.png'},
  { id: 'single_room', label: 'Single Room', src: '/img/listing-type/Single Room.png' },
];

const PropertyTypeRadio: React.FC<PropertyTypeRadioProps> = ({
  goToNext,
  goToPrev, // Note: Consider implementing or removing goToPrev as it's provided but not currently used.
  setPropertyDetails,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');

  const handleSelectionChange = (optionId: string) => {
    setSelectedType(optionId);
    // Now using setPropertyDetails to update the property's details
    setPropertyDetails(prevDetails => ({
      ...prevDetails,
      propertyType: optionId,
    }));
  };

  const handleNext = () => {
    // This could potentially be a place to validate selection before moving on
    goToNext();
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 className='text-2xl my-5 font-semibold'>What kind of place are you looking for?</h2>
      <div className="flex justify-between">
        {housingOptions.map((option) => (
          <div className='flex flex-col items-center justify-end cursor-pointer' key={option.id} onClick={() => handleSelectionChange(option.id)}>
            <Image alt={option.label} src={option.src} width={100} height={100} />
            <p className='text-xl font-semibold'>{option.label}</p>
            <input
              type="radio"
              className='sr-only'
              name="propertyType"
              value={option.id}
              checked={selectedType === option.id}
              onChange={() => handleSelectionChange(option.id)}
            />
            <div
              className={`w-6 h-6 rounded-full border-2 border-gray-400 ${selectedType === option.id ? 'bg-primaryBrand' : ''}`}
            ></div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-5">
        <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={handleNext}>NEXT</button>
      </div>
    </div>
  );
}

export default PropertyTypeRadio;
