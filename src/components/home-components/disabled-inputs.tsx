import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { MapPin, Calendar, Users } from "lucide-react"; // Import icons used in active component
import { cn } from '@/lib/utils';

interface DisabledInputsProps {
  className?: string;
  headerText?: string; // Add headerText prop
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  popoverMaxWidth?: string;
}

const baseInputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent`;

export const DisabledDesktopInputs: React.FC<DisabledInputsProps> = ({
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white', // Default to white like the active component
}) => {
  // Match the active component's input classes structure
  const inputClasses = cn(
    'w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent',
    inputClassName
  );

  return (
    <div className="relative">
      {/* Match the active component's container style */}
      <div
        className={cn('flex flex-row no-wrap p-3 items-center bg-gray-100 rounded-full shadow-md overflow-hidden', className)}
      >
        <input
          type="text"
          placeholder="Where to?"
          value=""
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Move in"
          value=""
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Move on out:"
          value=""
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Who?"
          value=""
          className={cn(inputClasses, 'sm:border-r-0')} // Remove border on the last input
          readOnly
        />
        <div className="flex-shrink-0">
          {/* Match the active component's button style */}
          <button
            disabled
            className={cn(
              'w-auto p-3 cursor-not-allowed opacity-50 bg-primaryBrand rounded-full',
              searchButtonClassNames
            )}
          >
            <FaSearch className={cn(searchIconColor, "mx-auto")} size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DisabledMobileInputs: React.FC<DisabledInputsProps> = ({
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white', // Default to white like the active component
  headerText, // Destructure headerText
}) => {
  // Match the active component's input classes structure
  const inputClasses = cn(
    'w-full px-4 py-3 font-normal text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none border border-gray-200 rounded-full bg-white mb-3 transition-all duration-300 hover:shadow-sm cursor-not-allowed opacity-50',
    inputClassName
  );

  return (
    // Match the active component's container style and width
    <div className={cn("flex flex-col p-4 z-50 items-center bg-background rounded-3xl shadow-md overflow-hidden w-[60vw]", className)}>
      {/* Add optional header text */}
      {headerText && <h3 className="text-xl font-semibold mb-3 text-green-800 block sm:hidden">{headerText}</h3>}
      {/* Match the active component's input fields with icons */}
      <div className={`${inputClasses} flex items-center`}>
        <MapPin size={24} className="text-gray-500 mr-3" />
        Where to
      </div>
      <div className={`${inputClasses} flex items-center`}>
        <Calendar size={24} className="text-gray-500 mr-3" />
        Dates
      </div>
      <div className={`${inputClasses} flex items-center sm:border-r-0`}>
        <Users size={24} className="text-gray-500 mr-3" />
        Renters
      </div>
      {/* Match the active component's button style */}
      <button
        disabled
        className={cn(
          'w-full py-2 px-6 cursor-not-allowed opacity-30 text-white rounded-2xl text-lg font-medium transition-all duration-300 shadow-sm',
          searchButtonClassNames || 'bg-green-800' // Match default background
        )}
      >
        Search {/* Match button text */}
      </button>
    </div>
  );
};
