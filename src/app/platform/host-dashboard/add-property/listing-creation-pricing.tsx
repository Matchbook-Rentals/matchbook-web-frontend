import { MinusIcon, PlusIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface ListingCreationPricingProps {
  shortestStay: number;
  longestStay: number;
  shortTermRent: string;
  longTermRent: string;
  deposit: string;
  petDeposit: string;
  petRent: string;
  tailoredPricing: boolean;
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onShortTermRentChange: (value: string) => void;
  onLongTermRentChange: (value: string) => void;
  onDepositChange: (value: string) => void;
  onPetDepositChange: (value: string) => void;
  onPetRentChange: (value: string) => void;
  onTailoredPricingChange: (value: boolean) => void;
  onContinue?: () => void;
  isLoading?: boolean;
}

const ListingCreationPricing: React.FC<ListingCreationPricingProps> = ({ 
  shortestStay,
  longestStay,
  shortTermRent,
  longTermRent,
  deposit,
  petDeposit,
  petRent,
  tailoredPricing,
  onShortestStayChange,
  onLongestStayChange,
  onShortTermRentChange,
  onLongTermRentChange,
  onDepositChange,
  onPetDepositChange,
  onPetRentChange,
  onTailoredPricingChange,
  onContinue,
  isLoading
}) => {


  // Handlers for increasing/decreasing stay lengths
  const increaseShortestStay = () => {
    if (shortestStay < longestStay) {
      onShortestStayChange(shortestStay + 1);
    }
  };

  const decreaseShortestStay = () => {
    if (shortestStay > 1) {
      onShortestStayChange(shortestStay - 1);
    }
  };

  const increaseLongestStay = () => {
    if (longestStay < 12) {
      onLongestStayChange(longestStay + 1);
    }
  };

  const decreaseLongestStay = () => {
    if (longestStay > shortestStay) {
      onLongestStayChange(longestStay - 1);
    }
  };

  return (
    <div className="relative w-full max-w-[886px]">
      <div className="w-full">
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
              What's the shortest stay you will accommodate?
            </h2>
            <div className="flex items-center space-x-4">
              <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
                {shortestStay} month{shortestStay !== 1 && "s"}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                  onClick={decreaseShortestStay}
                  disabled={shortestStay <= 1}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                  onClick={increaseShortestStay}
                  disabled={shortestStay >= longestStay}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-8">
            <h2 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
              What's the longest stay you will accommodate?
            </h2>
            <div className="flex items-center space-x-4">
              <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
                {longestStay} month{longestStay !== 1 && "s"}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                  onClick={decreaseLongestStay}
                  disabled={longestStay <= shortestStay}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                  onClick={increaseLongestStay}
                  disabled={longestStay >= 12}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica] mb-4">
              Do you want to automatically adjust rents based on length of stay?
            </h2>
            <div className="flex items-center gap-4">
              <Switch 
                id="term-pricing" 
                checked={tailoredPricing}
                onCheckedChange={onTailoredPricingChange}
              />
              <span className="font-medium text-lg text-[#222222] [font-family:'Poppins',Helvetica]">
                {tailoredPricing ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>


        {/* Pricing Inputs */}
        <div className="space-y-6 mb-12">
          {tailoredPricing ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xl text-[#404040] [font-family:'Poppins',Helvetica]">
                    How much is rent per month for a {shortestStay} month{shortestStay !== 1 && "s"} stay?
                  </span>
                  <div className="relative w-[234px]">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                    <Input 
                      className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-7 text-lg" 
                      value={shortTermRent}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        onShortTermRentChange(value);
                      }}
                      placeholder="0.00"
                      type="text"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xl text-[#404040] [font-family:'Poppins',Helvetica]">
                    How much is rent per month for a {longestStay} month{longestStay !== 1 && "s"} stay?
                  </span>
                  <div className="relative w-[234px]">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                    <Input 
                      className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-7 text-lg" 
                      value={longTermRent}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        onLongTermRentChange(value);
                      }}
                      placeholder="0.00"
                      type="text"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <p className="font-light text-lg text-[#666666] [font-family:'Poppins',Helvetica]">
                  Hosts often discount rates for extended stays
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xl text-[#404040] [font-family:'Poppins',Helvetica]">
                  How much is rent per month?
                </span>
                <div className="relative w-[234px]">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                  <Input 
                    className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-7 text-lg" 
                    value={shortTermRent}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      onShortTermRentChange(value);
                      onLongTermRentChange(value);
                    }}
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ListingCreationPricing;