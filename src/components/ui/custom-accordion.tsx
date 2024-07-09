'use client'

import React, { SetStateAction, useState, Dispatch } from 'react';
import { motion } from 'framer-motion';
import { FaPencilAlt } from 'react-icons/fa';
import { cn } from '@/lib/utils'; // Assuming you have a utility function for classnames

interface CustomAccordionProps {
  title: string;
  isOpen: boolean;
  toggleOpen: Dispatch<SetStateAction<boolean>>;
  onChangeCategory?: (newCategory: string) => void;
  children: React.ReactNode;
  labelClassName?: string;
  contentClassName?: string;
}

const CustomAccordion: React.FC<CustomAccordionProps> = ({
  title,
  isOpen,
  toggleOpen,
  onChangeCategory,
  children,
  labelClassName,
  contentClassName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState(title);

  const handlePencilClick = () => {
    setIsEditing(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(e.target.value);
  };

  const handleCategoryBlur = () => {
    setIsEditing(false);
    if (onChangeCategory) {
      onChangeCategory(newCategoryName);
    }
  };

  return (
    <div className='my-5'>
      <div className={cn("flex rounded-lg text-xl p-1 items-center justify-between cursor-pointer", labelClassName)}>
        <div className='flex gap-2'>
          {isEditing && onChangeCategory ? (
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
              {title[0].toUpperCase() + title.slice(1)}
              {onChangeCategory && (
                <FaPencilAlt className='text-sm ml-2' onClick={handlePencilClick} />
              )}
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
        className={cn(contentClassName)}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default CustomAccordion;

