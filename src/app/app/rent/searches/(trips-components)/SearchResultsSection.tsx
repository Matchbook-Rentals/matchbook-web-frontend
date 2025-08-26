import React from "react";
import { BrandButton } from "@/components/ui/brandButton";

export const SearchResultsSection = (): JSX.Element => {
  return (
    <div className="flex items-end gap-4 relative w-full">
      <div className="flex items-end gap-6 relative flex-1">
        <div className="flex flex-col items-start gap-2 relative flex-1">
          <div className="relative font-medium text-gray-900 text-2xl leading-tight">
            Your Searches
          </div>
          <div className="relative font-normal text-gray-500 text-base leading-6">
            Hello John, here&apos;s what happen with your store
          </div>
        </div>
      </div>

      <div className="inline-flex items-start gap-3">
        <div className="flex items-center justify-end gap-3">
          <BrandButton variant="outline" className="min-w-0 px-4 py-2">
            New Search
          </BrandButton>
        </div>
      </div>
    </div>
  );
};