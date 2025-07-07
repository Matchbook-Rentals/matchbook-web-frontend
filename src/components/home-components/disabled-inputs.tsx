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

const baseInputClasses = `w-full px-4 pt-[6%] text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed  bg-transparent`;

export const DisabledDesktopInputs: React.FC<DisabledInputsProps> = ({
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-charcoalBrand', // Default to white like the active component
  headerText,
}) => {
  // Base input classes matching SearchInputsDesktop, adding disabled styles
  const inputClasses = cn(
    'w-full px-4 py-0 text-gray-700 placeholder-gray-400 focus:outline-none cursor-not-allowed bg-background text-[12px]',
    inputClassName
  );

  return (
    <div className="relative">
      {/* Optional header text */}
      {headerText && <h3 className="hidden text-xl font-semibold mb-3 text-green-800 text-center sm:block">{headerText}</h3>}
      {/* Container matching SearchInputsDesktop, adding disabled styles */}
      <div
        className={cn('flex flex-row no-wrap px-3 py-1 items-center bg-background rounded-full shadow-md overflow-hidden cursor-not-allowed ', className)}
      >
        {/* Location Input */}
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Where</label>
          <input
            type="text"
            placeholder="Choose Location"
            value=""
            className={inputClasses}
            readOnly
            disabled
          />
        </div>

        {/* Move In Input */}
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move In</label>
          <input
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            disabled
          />
        </div>

        {/* Move Out Input */}
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move Out</label>
          <input
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            disabled
          />
        </div>

        {/* Guests Input */}
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Who</label>
          <input
            type="text"
            placeholder="Add renters"
            value=""
            className={inputClasses} // No border-r needed here as per active component
            readOnly
            disabled
          />
        </div>

        {/* Search Button */}
        <div className="flex-shrink-0 self-end">
          <button
            disabled
            className={cn(
              'w-auto p-3 cursor-not-allowed rounded-full',
              searchButtonClassNames || 'bg-background' // Match default background
            )}
          >
            <FaSearch className={cn(searchIconColor, "mx-auto")} />
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
