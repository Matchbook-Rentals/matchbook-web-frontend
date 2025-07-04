import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BiPlus, BiMinus } from "react-icons/bi";

interface RoomsProps {
  bedrooms: number;
  bathrooms: number;
  squareFeet: string;
  onBedroomsChange: (value: number) => void;
  onBathroomsChange: (value: number) => void;
  onSquareFeetChange: (value: string) => void;
}

export const Rooms: React.FC<RoomsProps> = ({
  bedrooms,
  bathrooms,
  squareFeet,
  onBedroomsChange,
  onBathroomsChange,
  onSquareFeetChange,
}) => {
  const incrementBedrooms = () => onBedroomsChange(bedrooms + 1);
  const decrementBedrooms = () => onBedroomsChange(bedrooms > 0 ? bedrooms - 1 : 0);

  const incrementBathrooms = () => onBathroomsChange(bathrooms + 1);
  const decrementBathrooms = () => onBathroomsChange(bathrooms > 0 ? bathrooms - 1 : 0);

  return (
    <Card className="w-full border-none shadow-none">
      <CardContent className="p-0">
        {/* Bedrooms */}
        <div className="flex items-center justify-between p-4 border-b border-[#e6e6e6]">
          <div className="font-text-label-small-medium text-[#484a54] text-[14px]">
            How many bedrooms are there?
          </div>

          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={decrementBedrooms}
              className="p-1 h-8 w-8 rounded-full border border-black"
            >
              <BiMinus className="h-6 w-6 text-black" />
            </Button>

            <span className="font-text-label-large-medium text-[#5d606d] text-[18px]">
              {bedrooms}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={incrementBedrooms}
              className="p-1 h-8 w-8 rounded-full border border-black"
            >
              <BiPlus className="h-6 w-6 text-black" />
            </Button>
          </div>
        </div>

        {/* Bathrooms */}
        <div className="flex items-center justify-between p-4 border-b border-[#e6e6e6]">
          <div className="font-text-label-small-medium text-[#484a54] text-[14px]">
            How many bathrooms are there?
          </div>

          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={decrementBathrooms}
              className="p-1 h-8 w-8 rounded-full border border-black"
            >
              <BiMinus className="h-6 w-6 text-black" />
            </Button>

            <span className="font-text-label-large-medium text-[#5d606d] text-[18px]">
              {bathrooms}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={incrementBathrooms}
              className="p-1 h-8 w-8 rounded-full border border-black"
            >
              <BiPlus className="h-6 w-6 text-black" />
            </Button>
          </div>
        </div>

        {/* Square Feet */}
        <div className="flex items-center justify-between p-4">
          <div className="font-text-label-small-medium text-[#484a54] text-[14px]">
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
