import React from "react";
import { Button } from "../../../../components/ui/button";

export const SearchResultsSection = (): JSX.Element => {
  return (
    <div className="flex items-end gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex items-end gap-6 relative flex-1 grow">
        <div className="flex flex-col items-start gap-2 relative flex-1 grow">
          <div className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-blackblack-500 text-2xl tracking-[0] leading-[28.8px]">
            Your Searches
          </div>

          <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-greygrey-500 text-base tracking-[0] leading-6">
            Hello John, here&apos;s what happen with your store
          </div>
        </div>
      </div>

      <div className="inline-flex items-start gap-3 relative flex-[0_0_auto]">
        <div className="flex items-center justify-end gap-3 relative">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 h-auto [font-family:'Poppins',Helvetica] font-medium text-sm">
            New Search
          </Button>
        </div>
      </div>
    </div>
  );
};
