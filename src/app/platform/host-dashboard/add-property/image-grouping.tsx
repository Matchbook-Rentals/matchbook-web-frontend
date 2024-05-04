"use client";

import React from 'react';
import Image from 'next/image';
import { ListingImage } from "@prisma/client";
import { group } from 'console';

interface ImageGroupingProps {
  listingImages: ListingImage[];
  onDragStart: (id: string) => void;
  groupingCategory?: string;
}

const ImageGrouping: React.FC<ImageGroupingProps> = ({ listingImages, onDragStart, groupingCategory }) => {
  // Filter images based on the groupingCategory
  const filteredImages = listingImages.filter(img =>
    groupingCategory ? img.category === groupingCategory : img.category === null
  );

  return (
    <div>
      {groupingCategory && <h3>{groupingCategory}</h3>}
      <div onDrop={() => alert(groupingCategory)} onDragOver={e => e.preventDefault()} className="grid grid-cols-5 gap-4 mb-5 border-2 border-gray-500 min-h-16">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            draggable="true"
            onDragStart={() => onDragStart(img)}
            className="relative w-full pb-[100%] cursor-grab active:cursor-grabbing border-2 border-black"
            onDrop={() => console.log('AHHHHHH')}
            onDragOver={(e) => e.preventDefault()}

          >
            <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrouping;
