import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingCreationCounter } from "./listing-creation-counter";
import { createNumberChangeHandler, formatNumberWithCommas } from "@/lib/number-validation";

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
  // Track focus to defer comma formatting until blur
  // (reformatting mid-keystroke causes cursor jumps on older Safari)
  const [isFocused, setIsFocused] = React.useState(false);

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
            placeholder="1,234 sq ft"
            value={isFocused ? squareFeet : formatNumberWithCommas(squareFeet)}
            onChange={createNumberChangeHandler(onSquareFeetChange, false, 10000000, true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
          />
        </div>
      </CardContent>
    </Card>
  );
};
