"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ListingImage } from "@prisma/client";
import { motion } from 'framer-motion';

interface ImageGroupingProps {
  listingImages: ListingImage[];
  onDragStart: (id: string) => void;
  groupingCategory?: string;
  handleDrop: (category: string) => void;
  over: string;
  setOver: (id: string) => void;
  dragging: string;
}

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const ImageGrouping: React.FC<ImageGroupingProps> = ({ listingImages, onDragStart, groupingCategory = null, handleDrop, over, setOver, dragging }) => {
  const [dragCounter, setDragCounter] = useState(0);

  // Filter images based on the groupingCategory and sort them by rank
  const filteredAndSortedImages = listingImages
    .filter(img => groupingCategory ? img.category === groupingCategory : img.category === null)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Ensure undefined ranks are treated as 0

  // Handle drag enter event
  const handleDragEnter = useCallback(debounce((id: string) => {
    setDragCounter(prev => prev + 1);
    setOver(id);
  }, 200), [setOver]);

  // Handle drag leave event
  const handleDragLeave = useCallback(() => {
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setOver(null);
    }
  }, [dragCounter, setOver]);

  return (
    <div onDragLeave={handleDragLeave} className=''>
      {groupingCategory && <h3>{groupingCategory}</h3>}
      <div onDrop={() => handleDrop(groupingCategory)} onDragOver={e => e.preventDefault()} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5 border-2 border-gray-500 min-h-32">
        {filteredAndSortedImages.map((img) => (
          <>
            {img.id === over && over !== dragging &&
              <div className='relative w-full pb-50% border-2 border-black'></div>}
            <motion.div
              layout
              layoutId={img.id}
              key={img.id}
              draggable="true"
              onDragStart={() => onDragStart(img.id)} // Pass img.id to ensure it's correctly used in the drag start event
              className="relative w-full pb-[50%] cursor-grab active:cursor-grabbing border-2 border-black"
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(img.id)}
              onClick={() => alert('click not drag')}
              onDragEnd={() => setOver('')}
            >
              <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" />
            </motion.div>
          </>
        ))}
      </div>
    </div>
  );
};

export default ImageGrouping;
