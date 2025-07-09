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

  const inputClasses = `w-full px-3 py-0 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-background ${inputStyles || ''}`;

  const sectionClasses = `flex-1 flex flex-col sm:border-r border-gray-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 focus-visible:ring-inset py-1 px-1 rounded-sm ${hasAccess ? '' : 'cursor-not-allowed opacity-50'}`;

  // Add refs for each section div
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const moveInSectionRef = useRef<HTMLDivElement>(null);
  const moveOutSectionRef = useRef<HTMLDivElement>(null);
  const guestsSectionRef = useRef<HTMLDivElement>(null);

  // Update handleSectionClick to open the shared dialog
  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess) {
      onOpenDialog();
    }
  };

  // Handle keyboard events for accessibility
  const handleSectionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasAccess) {
        onOpenDialog();
      }
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
        className={cn('flex flex-row no-wrap px-3 py-2 items-center bg-background rounded-full shadow-md', containerStyles)}
      >
        <div 
          ref={locationSectionRef}
          className={sectionClasses}
          onClick={handleSectionClick}
          onKeyDown={handleSectionKeyDown}
          tabIndex={hasAccess ? 0 : -1}
          role="button"
          aria-label="Choose location for search"
        >
          <label className="text-xs font-medium pl-3 pt-0.5 text-gray-600 pointer-events-none">Where</label>
          <input
            type="text"
            placeholder="Choose Location"
            value=""
            className={inputClasses}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div 
          ref={moveInSectionRef}
          className={sectionClasses}
          onClick={handleSectionClick}
          onKeyDown={handleSectionKeyDown}
          tabIndex={hasAccess ? 0 : -1}
          role="button"
          aria-label="Select move-in date"
        >
          <label className="text-xs font-medium pl-3 pt-0.5 text-gray-600 pointer-events-none">Move In</label>
          <input
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div 
          ref={moveOutSectionRef}
          className={sectionClasses}
          onClick={handleSectionClick}
          onKeyDown={handleSectionKeyDown}
          tabIndex={hasAccess ? 0 : -1}
          role="button"
          aria-label="Select move-out date"
        >
          <label className="text-xs font-medium pl-3 pt-0.5 text-gray-600 pointer-events-none">Move Out</label>
          <input
            type="text"
            placeholder="Select dates"
            value=""
            className={inputClasses}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div 
          ref={guestsSectionRef}
          className={cn(sectionClasses, "border-r-0")}
          onClick={handleSectionClick}
          onKeyDown={handleSectionKeyDown}
          tabIndex={hasAccess ? 0 : -1}
          role="button"
          aria-label="Select number of renters"
        >
          <label className="text-xs font-medium pl-3 pt-0.5 text-gray-600 pointer-events-none">Who</label>
          <input
            type="text"
            placeholder="Add renters"
            value=""
            className={inputClasses}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div className="flex-shrink-0 self-end">
          <button
            disabled={!hasAccess}
            onClick={handleSectionClick}
            className={cn(
              'w-auto p-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2',
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
