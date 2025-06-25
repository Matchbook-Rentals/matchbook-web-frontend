"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ListingImage } from "@prisma/client";
import { motion } from 'framer-motion';
import { FaPencilAlt } from 'react-icons/fa';

interface ImageGroupingProps {
  listingImages: ListingImage[];
  onDragStart: (id: string) => void;
  groupingCategory?: string;
  handleDrop: (category: string) => void;
  over: { id: string, activeHalf: string };
  setOver: (over: { img: ListingImage, activeHalf: string } | null) => void;
  dragging: ListingImage;
  setDragging: (dragging: ListingImage | null) => void;
  handleChangeCategory: (newCategory: string) => void;
}

const ImageGrouping: React.FC<ImageGroupingProps> = ({ listingImages, onDragStart, groupingCategory = 'unassigned', handleDrop, over, setOver, dragging, setDragging, handleChangeCategory }) => {
  const [dragCounter, setDragCounter] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState(groupingCategory);
  const [dropPosition, setDropPosition] = useState<{ img: ListingImage, half: string } | null>(null);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const filteredAndSortedImages = listingImages
    .filter(img => groupingCategory ? img.category === groupingCategory : img.category === 'unassigned')
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const handleDragEnter = useCallback((img: ListingImage) => {
    setDragCounter(prev => prev + 1);
    setOver({ img, activeHalf: 'left' });
  }, [setOver]);

  const handleDragLeave = useCallback(() => {
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setOver({ img: '', activeHalf: '' });
    }
  }, [dragCounter, setOver]);

  const handleDragOver = useCallback((e, img: ListingImage) => {
    const { offsetX, target } = e.nativeEvent;
    const half = offsetX < (target as HTMLElement).offsetWidth / 2 ? 'left' : 'right';
    setOver({ img, activeHalf: half });
    if (dragging?.id === img.id) {
      setDropPosition(null);
    } else {
      setDropPosition({ img, half });
    }
  }, [setOver]);

  const handleDragEnd = useCallback(() => {
    setOver({ img: '', activeHalf: '' });
    setDragging(null);
    setDropPosition(null);
  }, [setOver, setDragging]);

  const handleDragLeaveImage = useCallback(() => {
    const lastImage = filteredAndSortedImages[filteredAndSortedImages.length - 1];
    setOver({ img: lastImage, activeHalf: 'right' });
    setDropPosition({ img: lastImage, half: 'right' });
  }, [filteredAndSortedImages, setOver]);

  const handlePencilClick = () => {
    setIsEditing(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(e.target.value);
  };

  const handleCategoryBlur = () => {
    setIsEditing(false);
    handleChangeCategory(newCategoryName); // Assuming idx is the first image in the list
  };

  return (
    <div onDragLeave={handleDragLeave} className='my-5'>
      <div className="flex rounded-lg  text-xl border-2 border-gray-300 p-1 items-center justify-between cursor-pointer" >
        <div className='flex gap-2'>
          {isEditing ? (
            <input
              type="text"
              value={newCategoryName}
              onChange={handleCategoryChange}
              onBlur={handleCategoryBlur}
              className="border-b-2 border-gray-400 outline-none"
              autoFocus
            />
          ) : (
            <div className='flex justify-between'>
              {groupingCategory[0].toUpperCase() + groupingCategory.slice(1)}
              <FaPencilAlt className='text-sm ml-2' onClick={handlePencilClick} />
            </div>
          )}
        </div>
        <button onClick={toggleOpen} className='hover:bg-slate-300 px-3 transition transition-duration-400 font-bold text-2xl'>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ^
          </motion.div>
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
      >
        <div
          onDrop={() => handleDrop(groupingCategory)}
          onDragOver={(e) => e.preventDefault()}
          className="grid grid-cols-2 rounded-lg lg:grid-cols-3 gap-4 mb-5 border-2 border-gray-300 min-h-32"
        >
          {filteredAndSortedImages.map((img) => (
            <div key={img.id} className="relative w-full items-center flex">
              <motion.div
                layout
                layoutId={img.id}
                draggable
                onDragStart={() => onDragStart(img)}
                className={`relative w-full h-0 pb-[50%] cursor-grab active:cursor-grabbing border border-black ${dragging?.id === img?.id && 'opacity-50'}`}
                onDragOver={(e) => handleDragOver(e, img)}
                onDragEnter={() => handleDragEnter(img)}
                onClick={() => alert('click not drag')}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeaveImage}
                transition={{ duration: 0.3 }}
              >
                <Image src={img.url} alt={`Uploaded image ${img.id}`} layout="fill" objectFit="cover" className={`transition transition-duration-400 ${dropPosition?.img?.id === img.id && dropPosition?.half === 'left' ? 'border-l-4 border-blue-500' : ''} ${dropPosition?.img?.id === img.id && dropPosition?.half === 'right' ? 'border-r-4 border-blue-500' : ''}`} />
                {dropPosition?.img?.id === img?.id && (
                  <div className={`drop-indicator ${dropPosition?.half}`} style={{ borderColor: 'purple', borderWidth: '2px', [dropPosition?.half]: 0 }}>
                    <div className="drop-indicator-line" />
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ImageGrouping;
