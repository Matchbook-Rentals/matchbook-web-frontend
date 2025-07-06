/**
 * @deprecated This component was deprecated on July 6, 2025.
 * Use DesktopSearchTrigger and MobileSearchTrigger components directly instead.
 */
import React from "react";
import SearchInputsDesktop from "./search-inputs-desktop";
import SearchInputsMobile from "./search-inputs-mobile";
import { cn } from "@/lib/utils";
import MobileSearchTrigger from "./MobileSearchTrigger";

interface SearchContainerProps {
  hasAccess: boolean; // Add hasAccess prop
  className?: string;
  containerStyles?: string;
  inputStyles?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  popoverMaxWidth?: string;
  headerText?: string;
  headerClassName?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
  className,
  containerStyles,
  inputStyles,
  searchButtonClassNames,
  searchIconColor,
  popoverMaxWidth,
  headerText,
  headerClassName,
  hasAccess // Destructure hasAccess prop
}) => {
  return (
    <>
      <div className={cn("mx-auto hidden sm:block", className)}>
        <div className="relative">
          <SearchInputsDesktop 
            hasAccess={hasAccess} 
            inputClassName={inputStyles} 
            className={containerStyles} 
            searchButtonClassNames={searchButtonClassNames}
            searchIconColor={searchIconColor}
            popoverMaxWidth={popoverMaxWidth}
            headerText={headerText}
            headerClassName={headerClassName}
          />
        </div>
      </div>
      <div className={cn("mx-auto block test sm:hidden", className)}>
        <div className={cn("relative", containerStyles)}>
          <MobileSearchTrigger hasAccess />
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
