'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MobileSearchTriggerProps {
  hasAccess: boolean;
  onTrigger: () => void;
  onOpenDialog: () => void;
}


const MobileSearchTrigger: React.FC<MobileSearchTriggerProps> = ({ 
  hasAccess, 
  onTrigger,
  onOpenDialog 
}) => {
  const handleClick = () => {
    if (hasAccess) {
      onOpenDialog();
    }
  };


  return (
    <div className="block sm:hidden pt-6 w-full z-10 flex justify-center">
      <div className="relative">
        <Card className="w-[397px] rounded-xl overflow-hidden cursor-pointer" onClick={handleClick}>
          <CardContent className="p-3 flex flex-col gap-2">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex flex-col gap-4 w-full">
                {/* Where field */}
                <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                  <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal cursor-pointer">
                    Where
                  </label>
                  <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                    Choose Location
                  </span>
                </div>

                {/* Move in/out date fields */}
                <div className="flex items-center gap-5 w-full">
                  {/* Move in field */}
                  <div className="flex flex-col flex-1 pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                      Move in
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                      Select Dates
                    </span>
                  </div>

                  {/* Move out field */}
                  <div className="flex flex-col flex-1 pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                      Move out
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                      Select Dates
                    </span>
                  </div>
                </div>

                {/* Who field */}
                <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                  <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                    Who
                  </label>
                  <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                    Add Renters
                  </span>
                </div>
              </div>

              {/* Button */}
              <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white cursor-pointer" onClick={handleClick}>
                Start Search
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Gray overlay when no access */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-gray-200/80 rounded-xl cursor-not-allowed"></div>
        )}
      </div>
    </div>
  );
};

export default MobileSearchTrigger;
