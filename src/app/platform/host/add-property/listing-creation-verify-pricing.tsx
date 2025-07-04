import React from "react";
import { Input } from "@/components/ui/input";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandCheckbox } from "@/app/brandCheckbox";
import { MonthlyPricing } from "./listing-creation-pricing";
import { styles } from "./styles";

interface ListingCreationVerifyPricingProps {
  shortestStay: number;
  longestStay: number;
  monthlyPricing: MonthlyPricing[];
  includeUtilities: boolean;
  utilitiesUpToMonths: number;
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onMonthlyPricingChange: (pricing: MonthlyPricing[]) => void;
}

const ListingCreationVerifyPricing: React.FC<ListingCreationVerifyPricingProps> = ({
  shortestStay,
  longestStay,
  monthlyPricing,
  includeUtilities,
  utilitiesUpToMonths,
  onShortestStayChange,
  onLongestStayChange,
  onMonthlyPricingChange
}) => {

  // Handlers for increasing/decreasing stay lengths
  const increaseShortestStay = () => {
    if (shortestStay < longestStay) {
      const newShortestStay = shortestStay + 1;
      onShortestStayChange(newShortestStay);
      updatePricingRange(newShortestStay, longestStay);
    }
  };

  const decreaseShortestStay = () => {
    if (shortestStay > 1) {
      const newShortestStay = shortestStay - 1;
      onShortestStayChange(newShortestStay);
      updatePricingRange(newShortestStay, longestStay);
    }
  };

  const increaseLongestStay = () => {
    if (longestStay < 12) {
      const newLongestStay = longestStay + 1;
      onLongestStayChange(newLongestStay);
      updatePricingRange(shortestStay, newLongestStay);
    }
  };

  const decreaseLongestStay = () => {
    if (longestStay > shortestStay) {
      const newLongestStay = longestStay - 1;
      onLongestStayChange(newLongestStay);
      updatePricingRange(shortestStay, newLongestStay);
    }
  };

  // Update pricing array when stay lengths change
  const updatePricingRange = (newShortestStay: number, newLongestStay: number) => {
    const newPricing: MonthlyPricing[] = [];
    for (let i = newShortestStay; i <= newLongestStay; i++) {
      // Try to find existing pricing for this month
      const existing = monthlyPricing.find(p => p.months === i);
      if (existing) {
        newPricing.push(existing);
      } else {
        // Create new entry with default values
        newPricing.push({
          months: i,
          price: '',
          utilitiesIncluded: false
        });
      }
    }
    onMonthlyPricingChange(newPricing);
  };

  // Update a specific month's pricing
  const updateMonthPricing = (months: number, price: string) => {
    const updated = monthlyPricing.map(p => 
      p.months === months ? { ...p, price } : p
    );
    onMonthlyPricingChange(updated);
  };

  // Update a specific month's utilities included status
  const updateMonthUtilities = (months: number, utilitiesIncluded: boolean) => {
    const updated = monthlyPricing.map(p => 
      p.months === months ? { ...p, utilitiesIncluded } : p
    );
    onMonthlyPricingChange(updated);
  };

  return (
    <div className="relative w-full max-w-[886px]">
      <div className="w-full">

        {/* Interactive Controls - Allow editing stay lengths */}
        <div className="flex items-center justify-center w-full gap-8 mb-6">
          {/* Shortest Stay Controls */}
          <div className="flex items-center gap-3">
            <label className={`${styles.labelTextSmall} whitespace-nowrap`}>
              Shortest stay:
            </label>
            <span className={`${styles.counterTextSmall} min-w-[20px]`}>
              {shortestStay}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className={styles.counterButtonSmall}
                onClick={decreaseShortestStay}
                disabled={shortestStay <= 1}
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={styles.counterButtonSmall}
                onClick={increaseShortestStay}
                disabled={shortestStay >= longestStay}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Longest Stay Controls */}
          <div className="flex items-center gap-3">
            <label className={`${styles.labelTextSmall} whitespace-nowrap`}>
              Longest stay:
            </label>
            <span className={`${styles.counterTextSmall} min-w-[20px]`}>
              {longestStay}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className={styles.counterButtonSmall}
                onClick={decreaseLongestStay}
                disabled={longestStay <= shortestStay}
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={styles.counterButtonSmall}
                onClick={increaseLongestStay}
                disabled={longestStay >= 12}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="mb-8">
          
          {/* Large screens: Two column layout */}
          <div className="hidden lg:block">
            <div className="border rounded-lg overflow-hidden">
              {/* Single Table Header */}
              <div className="bg-gray-50 border-b grid grid-cols-2 gap-6 py-3 px-4 font-medium text-sm text-[#404040]">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">Lease Length</div>
                  <div className="col-span-5">Monthly Rent</div>
                  <div className="col-span-3">Utilities</div>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">Lease Length</div>
                  <div className="col-span-5">Monthly Rent</div>
                  <div className="col-span-3">Utilities</div>
                </div>
              </div>
              
              {/* Table Rows - Two columns - Column first ordering */}
              {Array.from({ length: Math.ceil(monthlyPricing.length / 2) }, (_, rowIndex) => {
                const halfLength = Math.ceil(monthlyPricing.length / 2);
                const leftPricing = monthlyPricing[rowIndex];
                const rightPricing = monthlyPricing[rowIndex + halfLength];
                
                return (
                  <div 
                    key={rowIndex}
                    className={`grid grid-cols-2 gap-6 py-3 px-4 border-b last:border-b-0 ${
                      rowIndex % 2 === 0 ? 'bg-background' : 'bg-background'
                    }`}
                  >
                    {/* Left Column */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <span className="font-medium text-base text-[#222222]">
                          {leftPricing.months} month{leftPricing.months !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="col-span-5">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-base">$</span>
                          <Input 
                            className="w-full h-10 rounded-[5px] border-2 border-[#0000004c] pl-7 text-base" 
                            value={leftPricing.price}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              updateMonthPricing(leftPricing.months, value);
                            }}
                            placeholder="0.00"
                            type="text"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center justify-center">
                          <BrandCheckbox
                            name={`utilities-${leftPricing.months}`}
                            checked={leftPricing.utilitiesIncluded}
                            onChange={(e) => {
                              updateMonthUtilities(leftPricing.months, e.target.checked);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    {rightPricing ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <span className="font-medium text-base text-[#222222]">
                            {rightPricing.months} month{rightPricing.months !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="col-span-5">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-base">$</span>
                            <Input 
                              className="w-full h-10 rounded-[5px] border-2 border-[#0000004c] pl-7 text-base" 
                              value={rightPricing.price}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                updateMonthPricing(rightPricing.months, value);
                              }}
                              placeholder="0.00"
                              type="text"
                              inputMode="decimal"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="flex items-center justify-center">
                            <BrandCheckbox
                              name={`utilities-${rightPricing.months}`}
                              checked={rightPricing.utilitiesIncluded}
                              onChange={(e) => {
                                updateMonthUtilities(rightPricing.months, e.target.checked);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Empty space when odd number of entries */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Small/Medium screens: Single column layout */}
          <div className="lg:hidden">
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b flex items-center py-3 px-4 font-medium text-sm text-[#404040]">
                <div className="w-1/3">Lease Length</div>
                <div className="w-1/3">Monthly Rent</div>
                <div className="w-1/3">Utilities Included</div>
              </div>
              
              {/* Table Rows */}
              {monthlyPricing.map((pricing, index) => (
                <div 
                  key={pricing.months} 
                  className={`flex items-center py-4 px-4 border-b last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <div className="w-1/3">
                    <span className="font-medium text-base text-[#222222]">
                      {pricing.months} month{pricing.months !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-1/3">
                    <div className="relative w-[180px]">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-base">$</span>
                      <Input 
                        className="w-full h-10 rounded-[5px] border-2 border-[#0000004c] pl-7 text-base" 
                        value={pricing.price}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          updateMonthPricing(pricing.months, value);
                        }}
                        placeholder="0.00"
                        type="text"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <div className="w-1/3">
                    <div className="flex items-center gap-2">
                      <BrandCheckbox
                        name={`utilities-${pricing.months}-mobile`}
                        checked={pricing.utilitiesIncluded}
                        onChange={(e) => {
                          updateMonthUtilities(pricing.months, e.target.checked);
                        }}
                        label="Utilities included"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ListingCreationVerifyPricing;
