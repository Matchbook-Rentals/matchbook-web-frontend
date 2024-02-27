'use client';

import Image from 'next/image';
import React, { useState } from 'react';

const housingOptions = [
  { id: 'single_family', label: 'Single Family' },
  { id: 'multi_family', label: 'Multi Family' },
  { id: 'townhouse', label: 'Townhouse' },
  { id: 'apartment', label: 'Apartment' },
];

export default function ListingTypeRadio() {
  const [selectedType, setSelectedType] = useState('');

  const handleSelectionChange = (event) => {
    setSelectedType(event.target.value);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 className='text-2xl mb-10'>What kind of place are you looking for?</h2>
      <div className="flex justify-between">
        {housingOptions.map((option) => (
          <div className='flex flex-col items-center' key={option.id} onClick={() => setSelectedType(option.id)}>
            <Image alt='placeholder' src={`https://source.unsplash.com/random/1`} width={100} height={100} />
            <p className='text-xl font-semibold'>{option.label}</p>
            <input type="radio" className='sr-only' name="housingType" value={option.id} checked={selectedType === option.id} />
            <div
              className={`w-6 h-6 rounded-full border-2 border-gray-400 ${selectedType === option.id ? 'bg-primaryBrand' : ''}`}
            >
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
