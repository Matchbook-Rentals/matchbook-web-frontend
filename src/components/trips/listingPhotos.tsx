'use client'

import React, { useState } from 'react';
import Image from 'next/image';

export default function ListingPhotos() {
  const [isFocused, setIsFocused] = useState(0);
  const [listingPhotos, setListingPhotos] = useState([
    'https://source.unsplash.com/random/1',
    'https://source.unsplash.com/random/2',
    'https://source.unsplash.com/random/3',
    'https://source.unsplash.com/random/4',
    'https://source.unsplash.com/random/5',
  ]);

  // Function to reorder the array
  const reorderPhotos = (index: number) => {
    setIsFocused(index);
    let newPhotos = [listingPhotos[index]];
    listingPhotos.forEach((photo, i) => {
      if (i !== index) newPhotos.push(photo);
    });
    setListingPhotos(newPhotos); // Update the state to trigger a re-render
  };

  return (
    <div className="grid grid-cols-4 gap-4 transition-all duration-500 h-[70vh] p-3">
      {listingPhotos.map((photoUrl, index) => (
        <div
          key={index} // Changed key to index for uniqueness and consistency after reordering
          className={`relative overflow-hidden ${index === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'} transition-all duration-500`}
          onClick={() => reorderPhotos(index)}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <Image
            src={photoUrl}
            alt={`Listing ${index + 1}`}
            className="transition-transform duration-500 cursor-pointer"
            fill
            style={{
              objectFit: 'cover',
              position: 'absolute',
            }}
          />
        </div>
      ))}
    </div>
  );
}
