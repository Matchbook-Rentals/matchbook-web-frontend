import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface DisabledInputsProps {
  className?: string;
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
  searchIconColor = 'text-black',
}) => {
  const inputClasses = cn('w-full px-4 py-0 text-gray-700 placeholder-gray-400 cursor-not-allowed opacity-50 focus:outline-none bg-background', inputClassName);
  
  return (
    <div className="relative">
      <div
        className={cn('flex flex-row no-wrap px-3 py-2 items-center bg-background rounded-[15px] shadow-md overflow-hidden', className)}
      >
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Where</label>
          <input
            type="text"
            placeholder="Choose Location"
            value={""}
            className={inputClasses}
            readOnly
          />
        </div>
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move In</label>
          <input
            type="text"
            placeholder="Select dates"
            value={""}
            className={inputClasses}
            readOnly
          />
        </div>
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move Out</label>
          <input
            type="text"
            placeholder="Select dates"
            value={""}
            className={inputClasses}
            readOnly
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Who</label>
          <input
            type="text"
            placeholder="Add renters"
            value={""}
            className={inputClasses}
            readOnly
          />
        </div>
        <div className="flex-shrink-0 self-end">
          <button
            disabled
            className={cn('w-auto p-3 cursor-not-allowed opacity-50 rounded-[15px]', searchButtonClassNames || 'bg-background')}
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
  searchIconColor = 'text-black',
}) => {
  const inputClasses = cn('w-full px-4 py-3 text-gray-700 placeholder-gray-400 cursor-not-allowed opacity-50 focus:outline-none bg-transparent', inputClassName);
  
  return (
    <div className={cn("flex flex-col p-3 items-center bg-background rounded-[15px] shadow-md overflow-hidden w-[60vw]", className)}>
      <div className={`${inputClasses} flex items-center`}>
        Where to
      </div>
      <div className={inputClasses}>
        Dates
      </div>
      <div className={`${inputClasses} sm:border-r-0`}>
        Renters
      </div>
      <button
        disabled
        className={cn('w-full mt-3 p-3 cursor-not-allowed opacity-50 rounded-[15px]', searchButtonClassNames || 'bg-background border border-black')}
      >
        <FaSearch className={cn(searchIconColor, "mx-auto")} size={20} />
      </button>
    </div>
  );
};
