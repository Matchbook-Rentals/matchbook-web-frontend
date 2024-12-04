import React from "react";
import SearchInputsDesktop from "./SearchInputsDesktop";
import SearchInputsMobile from "./SearchInputsMobile";

interface SearchContainerProps {
  className?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ className }) => {
  return (
    <>
      <div className={`mx-auto hidden sm:block p-2 ${className || ""}`}>
        <div className="relative">
          <SearchInputsDesktop />
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className="relative">
          <SearchInputsMobile hasAccess={false} />
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
