import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingCreationCounter } from "./listing-creation-counter";
import { createNumberChangeHandler } from "@/lib/number-validation";

interface RoomsProps {
  bedrooms: number;
  bathrooms: number;
  squareFeet: string;
  questionTextStyles: string;
  onBedroomsChange: (value: number) => void;
  onBathroomsChange: (value: number) => void;
  onSquareFeetChange: (value: string) => void;
}

export const Rooms: React.FC<RoomsProps> = ({
  bedrooms,
  bathrooms,
  squareFeet,
  questionTextStyles,
  onBedroomsChange,
  onBathroomsChange,
  onSquareFeetChange,
}) => {
  return (
    <Card className="w-full border-none shadow-none">
      <CardContent className="p-0">
        {/* Bedrooms */}
        <div className="flex items-center justify-between p-4 border-b border-[#e6e6e6]">
          <div className={questionTextStyles}>
            How many bedrooms are there?
          </div>

          <ListingCreationCounter
            value={bedrooms}
            onChange={onBedroomsChange}
            monthSuffixClassName="hidden"
            textClassName="text-black text-lg"
          />
        </div>

        {/* Bathrooms */}
        <div className="flex items-center justify-between p-4 border-b border-[#e6e6e6]">
          <div className={questionTextStyles}>
            How many bathrooms are there?
          </div>

          <ListingCreationCounter
            value={bathrooms}
            onChange={onBathroomsChange}
            incrementSize={0.5}
            monthSuffixClassName="hidden"
            textClassName="text-black text-lg"
          />
        </div>

        {/* Square Feet */}
        <div className="flex items-center justify-between p-4">
          <div className={questionTextStyles}>
            How big is the living space (in square feet)?
          </div>

          <Input
            className="w-full max-w-[135px] h-8 rounded-lg border border-[#8a8a8a] text-base"
            placeholder="123 sq feet"
            value={squareFeet}
            onChange={createNumberChangeHandler(onSquareFeetChange, false)}
            type="number"
            min="0"
            max="10000000"
          />
        </div>
      </CardContent>
    </Card>
  );
};
