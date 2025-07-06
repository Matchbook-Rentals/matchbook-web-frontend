'use client';

import React, { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { DisabledDesktopInputs } from "./disabled-inputs";
import { cn } from "@/lib/utils";

interface DesktopSearchTriggerProps {
  hasAccess: boolean;
  className?: string;
  containerStyles?: string;
  inputStyles?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  headerText?: string;
  headerClassName?: string;
  onOpenDialog: () => void;
}


const DesktopSearchTrigger: React.FC<DesktopSearchTriggerProps> = ({
  hasAccess,
  className,
  containerStyles,
  inputStyles,
  searchButtonClassNames,
  searchIconColor = 'text-white',
  headerText,
  headerClassName,
  onOpenDialog
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const inputClasses = `w-full px-4 py-0 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-background ${inputStyles || ''}`;

  // Add refs for each input
  const locationInputRef = useRef<HTMLInputElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);

  // Update handleInputClick to open the shared dialog
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess) {
      onOpenDialog();
    }
  };

  // Render different versions based on hasAccess
  if (!hasAccess) {
    return (
      <div className={className}>
        <DisabledDesktopInputs />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {headerText && <h3 className={cn("text-xl font-semibold mb-3 text-green-800 text-center", headerClassName)}>{headerText}</h3>}
      <div
        className={cn('flex flex-row no-wrap px-3 py-2 items-center bg-background rounded-full shadow-md overflow-hidden', containerStyles)}
      >
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={handleInputClick}>Where</label>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="Choose Location"
            value=""
            className={inputClasses}
            readOnly
            onClick={handleInputClick}
          />
        </div>

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={handleInputClick}>Move In</label>
          <input
            ref={moveInInputRef}
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            onClick={handleInputClick}
          />
        </div>

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={handleInputClick}>Move Out</label>
          <input
            ref={moveOutInputRef}
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            onClick={handleInputClick}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={handleInputClick}>Who</label>
          <input
            ref={guestsInputRef}
            type="text"
            placeholder="Add renters"
            value=""
            className={`${inputClasses}`}
            readOnly
            onClick={handleInputClick}
          />
        </div>

        <div className="flex-shrink-0 self-end">
          <button
            disabled={!hasAccess}
            onClick={handleInputClick}
            className={cn(
              'w-auto p-3 rounded-full',
              searchButtonClassNames || 'bg-primaryBrand',
              !hasAccess
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            )}
          >
            <FaSearch className={searchIconColor} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopSearchTrigger;