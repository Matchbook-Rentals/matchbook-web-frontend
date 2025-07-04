import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingCreationCounter } from "./listing-creation-counter";

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
          />
        </div>

        {/* Square Feet */}
        <div className="flex items-center justify-between p-4">
          <div className={questionTextStyles}>
            How big is the living space (in square feet)?
          </div>

          <Input
            className="w-[135px] h-8 rounded-lg border border-[#8a8a8a]"
            placeholder="123 sq feet"
            value={squareFeet}
            onChange={e => onSquareFeetChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
