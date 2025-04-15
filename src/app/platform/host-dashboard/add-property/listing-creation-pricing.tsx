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
      return Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1} Month${i !== 0 ? 's' : ''}`,
        price: 0,
      }));
    }

    const shortRent = parseFloat(shortTermRent);
    const longRent = parseFloat(longTermRent);
    
    if (isNaN(shortRent) || isNaN(longRent)) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1} Month${i !== 0 ? 's' : ''}`,
        price: 0,
      }));
    }

    const data = [];
    const stepValue = (longRent - shortRent) / (longestStay - shortestStay);
    
    for (let i = 1; i <= 12; i++) {
      if (i < shortestStay) {
        // Stays shorter than minimum
        data.push({
          month: `${i} Month${i !== 1 ? 's' : ''}`,
          price: null, // Will not display on chart
        });
      } else if (i > longestStay) {
        // Stays longer than maximum
        data.push({
          month: `${i} Month${i !== 1 ? 's' : ''}`,
          price: null, // Will not display on chart
        });
      } else {
        // Interpolate the price for stays between min and max length
        const value = shortRent + stepValue * (i - shortestStay);
        const roundedValue = roundToNearestFive(value);
        data.push({
          month: `${i} Month${i !== 1 ? 's' : ''}`,
          price: parseFloat(roundedValue.toFixed(2)),
          isHighlighted: i === 6, // Highlight 6-month stay
        });
      }
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
        <div className="flex items-center mb-8">
          <div>
            <h2 className="font-medium text-2xl text-black [font-family:'Poppins',Helvetica]">
              Term Tailored Pricing
            </h2>
            <p className="font-light text-xl text-[#222222] [font-family:'Poppins',Helvetica]">
              Recommended
            </p>
          </div>
          <div className="ml-auto flex items-center">
            <Switch 
              id="term-pricing" 
              checked={tailoredPricing}
              onCheckedChange={onTailoredPricingChange}
            />
            <span className="ml-2 font-medium text-[15px] text-[#2d2f2e99] [font-family:'Poppins',Helvetica]">
              {tailoredPricing ? "On" : "Off"}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <p className="font-medium text-2xl text-[#222222] [font-family:'Poppins',Helvetica] mb-8">
          Choose your shortest and longest allowable stay lengths.
        </p>

        {/* Stay Length Settings */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
              Shortest stay length
            </h3>
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
              <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica] whitespace-nowrap">
                {shortestStay} month{shortestStay !== 1 && "s"}
              </span>
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

          <div className="flex items-center justify-between">
            <h3 className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
              Longest stay length
            </h3>
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
              <span className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica] whitespace-nowrap">
                {longestStay} month{longestStay !== 1 && "s"}
              </span>
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
        </div>

        {/* Pricing Inputs */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h3 className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
              Rent price for stay of {shortestStay} month{shortestStay !== 1 && "s"}
            </h3>
            <div className="relative w-[234px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
              <Input 
                className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-7" 
                value={shortTermRent}
                onChange={(e) => {
                  // Only allow numbers and decimal points
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  onShortTermRentChange(value);
                }}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-normal text-2xl text-[#222222] [font-family:'Poppins',Helvetica]">
                Rent price for stay of {longestStay} month{longestStay !== 1 && "s"}
              </h3>
              <div className="relative w-[234px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <Input 
                  className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-7" 
                  value={longTermRent}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onLongTermRentChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
            <p className="font-light text-xl text-[#222222] [font-family:'Poppins',Helvetica]">
              Hosts often discount rates for extended stays
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-12">
          <h3 className="font-medium text-2xl text-[#222222] [font-family:'Poppins',Helvetica] mb-2">
            Monthly rent price by total lease length
          </h3>
          <p className="font-light text-xl text-[#222222] [font-family:'Poppins',Helvetica] mb-6">
            This chart displays what guests pay per month, depending on the
            length of their stay
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

        {/* Deposit Section */}
        <div>
          <h3 className="font-medium text-2xl text-[#222222] [font-family:'Poppins',Helvetica] mb-6">
            Deposit &amp; Miscellaneous Costs
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-normal text-2xl text-black [font-family:'Poppins',Helvetica]">
                Deposit
              </label>
              <div className="relative w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <Input 
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7" 
                  value={deposit}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onDepositChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-normal text-2xl text-black [font-family:'Poppins',Helvetica]">
                Pet Deposit
              </label>
              <div className="relative w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <Input 
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7" 
                  value={petDeposit}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onPetDepositChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-normal text-2xl text-black [font-family:'Poppins',Helvetica]">
                Pet Rent
              </label>
              <div className="relative w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <Input 
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7" 
                  value={petRent}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onPetRentChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingCreationPricing;