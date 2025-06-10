import { MinusIcon, PlusIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Helper functions for chart data
  const roundToNearestFive = (value: number) => {
    return Math.round(value / 5) * 5;
  };

  const generateChartData = () => {
    if (!shortTermRent || !longTermRent) {
      // Return placeholder data if prices aren't set
      return Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const monthLabel = num === 1 ? `${num} Month` : `${num} Months`;
        return {
          month: monthLabel,
          price: 0,
        };
      });
    }

    const shortRent = parseFloat(shortTermRent);
    const longRent = parseFloat(longTermRent);
    
    if (isNaN(shortRent) || isNaN(longRent)) {
      return Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const monthLabel = num === 1 ? `${num} Month` : `${num} Months`;
        return {
          month: monthLabel,
          price: 0,
        };
      });
    }

    const data = [];
    
    // If tailored pricing is off, use the same price for all months
    if (!tailoredPricing) {
      for (let i = 1; i <= 12; i++) {
        // Consistent padding for single and double digit month labels
        const monthLabel = i === 1 ? `${i} Month` : `${i} Months`;
        
        data.push({
          month: monthLabel,
          price: shortRent,
          isHighlighted: i === 6, // Highlight 6-month stay
        });
      }
      return data;
    }
    
    // For tailored pricing, calculate the interpolated values
    const stepValue = (longRent - shortRent) / (longestStay - shortestStay);
    
    // Only include months within the selected range
    for (let i = shortestStay; i <= longestStay; i++) {
      // Interpolate the price for stays between min and max length
      const value = shortRent + stepValue * (i - shortestStay);
      const roundedValue = roundToNearestFive(value);
      
      // Consistent padding for single and double digit month labels
      const monthLabel = i === 1 ? `${i} Month` : `${i} Months`;
      
      data.push({
        month: monthLabel,
        price: parseFloat(roundedValue.toFixed(2)),
        isHighlighted: i === 6, // Highlight 6-month stay
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  
  const roundUpToNearestHundred = (value: number) => {
    return Math.ceil(value / 100) * 100;
  };

  const getMaxChartValue = () => {
    const shortRent = parseFloat(shortTermRent);
    if (!shortTermRent || isNaN(shortRent)) return 2000; // Default if no values set
    return roundUpToNearestHundred(shortRent * 1.2); // 20% higher than the highest value
  };

  const generateYAxisTicks = (maxValue: number) => {
    const ticks = [];
    const step = maxValue <= 1000 ? 200 : 500;
    for (let i = 0; i <= maxValue; i += step) {
      ticks.push(i);
    }
    return ticks;
  };

  const maxChartValue = getMaxChartValue();
  const yAxisTicks = generateYAxisTicks(maxChartValue);

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
          <h2 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
            What's the shortest stay you will accommodate?
          </h2>
          <div className="flex items-center justify-between">
            <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
              {shortestStay} month{shortestStay !== 1 && "s"}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={decreaseShortestStay}
                disabled={shortestStay <= 1}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={increaseShortestStay}
                disabled={shortestStay >= longestStay}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <h2 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica] mt-8">
            What's the longest stay you will accommodate?
          </h2>
          <div className="flex items-center justify-between">
            <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
              {longestStay} month{longestStay !== 1 && "s"}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={decreaseLongestStay}
                disabled={longestStay <= shortestStay}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={increaseLongestStay}
                disabled={longestStay >= 12}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
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
                <h3 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
                  How much is rent per month for a {shortestStay} month{shortestStay !== 1 && "s"} stay?
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-xl text-[#222222] [font-family:'Poppins',Helvetica]">
                    Monthly rent amount
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
                <h3 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
                  How much is rent per month for a {longestStay} month{longestStay !== 1 && "s"} stay?
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-xl text-[#222222] [font-family:'Poppins',Helvetica]">
                    Monthly rent amount
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
              <h3 className="font-medium text-2xl text-[#404040] [font-family:'Poppins',Helvetica]">
                How much is rent per month?
              </h3>
              <div className="flex items-center justify-between">
                <span className="font-normal text-xl text-[#222222] [font-family:'Poppins',Helvetica]">
                  Monthly rent amount
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

        {/* Chart Section - only show if tailored pricing is enabled and both prices are set */}
        {tailoredPricing && shortTermRent && longTermRent && (
          <div className="mb-12">
            <h3 className="font-medium text-2xl text-[#222222] [font-family:'Poppins',Helvetica] mb-2">
              Monthly rent price by total lease length
            </h3>
            <p className="font-light text-xl text-[#222222] [font-family:'Poppins',Helvetica] mb-6">
              This chart displays what guests pay per month, depending on the length of their stay
            </p>

            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    domain={[0, maxChartValue]} 
                    ticks={yAxisTicks}
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Monthly Rent']}
                    labelFormatter={(label) => `Stay Length: ${label}`}
                  />
                  <Bar 
                    dataKey="price" 
                    name="Monthly Rent" 
                    fill="#a3b899"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ListingCreationPricing;