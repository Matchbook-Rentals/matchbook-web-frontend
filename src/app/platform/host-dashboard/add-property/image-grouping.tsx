"use client";

import React, { useState, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

const ImageGrouping: React.FC<ImageGroupingProps> = ({ listingImages, onDragStart, groupingCategory = 'unassigned', handleDrop, over, setOver, dragging }) => {
  const [dragCounter, setDragCounter] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  // Toggle the collapsible section
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Filter images based on the groupingCategory and sort them by rank
  const filteredAndSortedImages = listingImages
    .filter(img => groupingCategory ? img.category === groupingCategory : img.category === 'unassigned')
    .sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Ensure undefined ranks are treated as 0

  // Handle drag enter event
  const handleDragEnter = useCallback((id: string) => {
    setDragCounter(prev => prev + 1);
    setOver(id);
  }, [setOver]);

  // Handle drag leave event
  const handleDragLeave = useCallback(() => {
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setOver(null);
    }
  }, [dragCounter, setOver]);

  return (
    <div onDragLeave={handleDragLeave} className=''>
      {groupingCategory && (
        <h3 className="flex items-center justify-between cursor-pointer" onClick={toggleOpen}>
          {groupingCategory}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4 }}
          >
            ^
          </motion.div>

        </h3>
      )}
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            onDrop={() => handleDrop(groupingCategory)}
            onDragOver={e => e.preventDefault()}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5 border-2 border-gray-500 min-h-32"
          >
            {filteredAndSortedImages.map((img) => (
              <div key={img.id}>
                {img.id === over && over !== dragging && (
                  <div className='relative w-full pb-50% border-2 border-black'></div>
                )}
                <motion.div
                  layout
                  layoutId={img.id}
                  draggable="true"
                  onDragStart={() => onDragStart(img.id)}
                  className="relative w-full pb-[50%] cursor-grab active:cursor-grabbing border-2 border-black"
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => handleDragEnter(img.id)}
                  onClick={() => alert('click not drag')}
                  onDragEnd={() => setOver('')}
                  transition={{ duration: 0.3 }}
                >
                  <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" />
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageGrouping;
