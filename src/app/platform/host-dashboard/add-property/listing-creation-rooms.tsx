import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
    <Card className="w-full max-w-[891px] border-none">
      <CardContent className="p-0">
        <div className="space-y-6">
          <h2 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
            Select beds and baths
          </h2>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="font-normal text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
                Bedrooms
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-11 h-11 rounded-full bbg-background border border-black text-black flex items-center justify-center"
                  onClick={decrementBedrooms}
                >
                  <span className="font-medium text-2xl text-black">
                    -
                  </span>
                </Button>
                <span className="w-9 font-medium text-2xl text-[#3f3f3f] text-center font-['Poppins',Helvetica]">
                  {bedrooms}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-11 h-11 rounded-full bbg-background border border-black text-black flex items-center justify-center"
                  onClick={incrementBedrooms}
                >
                  <span className="font-medium text-2xl text-black">
                    +
                  </span>
                </Button>
              </div>
            </div>

            <Separator className="h-[3px] bg-[url(/line-68.svg)]" />

            <div className="flex items-center justify-between">
              <div className="font-normal text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
                Bathrooms
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-11 h-11 rounded-full bbg-background border border-black text-black flex items-center justify-center"
                  onClick={decrementBathrooms}
                >
                  <span className="font-medium text-2xl text-black">
                    -
                  </span>
                </Button>
                <span className="w-9 font-medium text-2xl text-[#3f3f3f] text-center font-['Poppins',Helvetica]">
                  {bathrooms}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-11 h-11 rounded-full bbg-background border border-black text-black flex items-center justify-center"
                  onClick={incrementBathrooms}
                >
                  <span className="font-medium text-2xl text-black">
                    +
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
              How big is the living space?
            </h2>
            <div className="flex items-center justify-between">
              <div className="font-normal text-2xl text-[#3f3f3f] font-['Poppins',Helvetica]">
                Square Feet
              </div>
              <Input
                className="w-[167px] h-12 rounded-[10px] border-2 border-[#0000004c]"
                type="text"
                value={squareFeet}
                onChange={e => onSquareFeetChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
