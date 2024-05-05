"use client";

import React from 'react';
import Image from 'next/image';
import { ListingImage } from "@prisma/client";

interface ImageGroupingProps {
  listingImages: ListingImage[];
  onDragStart: (id: string) => void;
  groupingCategory?: string;
  handleDrop: (category: string) => void;
}

const ImageGrouping: React.FC<ImageGroupingProps> = ({ listingImages, onDragStart, groupingCategory = null, handleDrop }) => {
  // Filter images based on the groupingCategory and sort them by rank
  const filteredAndSortedImages = listingImages
    .filter(img => groupingCategory ? img.category === groupingCategory : img.category === null)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Ensure undefined ranks are treated as 0

  return (
    <div>
      {groupingCategory && <h3>{groupingCategory}</h3>}
      <div onDrop={() => handleDrop(groupingCategory)} onDragOver={e => e.preventDefault()} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5 border-2 border-gray-500 min-h-32">
        {filteredAndSortedImages.map((img) => (
          <div
            key={img.id}
            draggable="true"
            onDragStart={() => onDragStart(img.id)} // Pass img.id to ensure it's correctly used in the drag start event
            className="relative w-full pb-[50%] cursor-grab active:cursor-grabbing border-2 border-black"
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
