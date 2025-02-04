import React from "react";
import EditSearchInputsDesktop from "@/app/platform/trips/[tripId]/components/edit-search-inputs-desktop";
import EditSearchInputsMobile from "@/app/platform/trips/[tripId]/components/edit-search-inputs-mobile";

interface SearchEditBarProps {
  className?: string;
}

const SearchEditBar: React.FC<SearchEditBarProps> = ({ className }) => {
  return (
    <>
      <div className={`mx-auto w-[95%] lg:w-[80%] hidden sm:block p-2 ${className || ""}`}>
        <div className="relative mt-6">
          <EditSearchInputsDesktop />
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className="relative">
          <EditSearchInputsMobile />
        </div>
      </div>
    </>
  );
};

export default SearchEditBar;
