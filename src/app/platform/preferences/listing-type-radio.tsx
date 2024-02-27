import Image from 'next/image';
import React, { useState, Dispatch, SetStateAction } from 'react';

interface ListingTypeRadioProps {
  goToNext: () => void;
  goToPrev: () => void;
  setUserPreferences: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual preference type you expect
}

const housingOptions = [
  { id: 'single_family', label: 'Single Family' },
  { id: 'multi_family', label: 'Multi Family' },
  { id: 'townhouse', label: 'Townhouse' },
  { id: 'apartment', label: 'Apartment' },
];

const ListingTypeRadio: React.FC<ListingTypeRadioProps> = ({
  goToNext,
  goToPrev,
  setUserPreferences,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');

  const handleSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedType(event.target.value);
    setUserPreferences(event.target.value); // Assuming the preference is just the selectedType value
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 className='text-2xl mb-10'>What kind of place are you looking for?</h2>
      <div className="flex justify-between">
        {housingOptions.map((option) => (
          <div className='flex flex-col items-center' key={option.id} onClick={() => setSelectedType(option.id)}>
            <Image alt='placeholder' src={`https://source.unsplash.com/random/1`} width={100} height={100} />
            <p className='text-xl font-semibold'>{option.label}</p>
            <input
              type="radio"
              className='sr-only'
              name="housingType"
              value={option.id}
              checked={selectedType === option.id}
              onChange={handleSelectionChange}
            />
            <div
              className={`w-6 h-6 rounded-full border-2 border-gray-400 ${selectedType === option.id ? 'bg-primaryBrand' : ''}`}
            ></div>
          </div>
        ))}
        {/* Buttons to navigate to the next or previous questions */}
      </div>
      <div className="flex justify-center mt-5 ">
        <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={goToNext}>NEXT</button>
      </div>
    </div>
  );
}

export default ListingTypeRadio;
