import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from "@/components/ui/input";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingCreationVerifyPricingProps {
  shortestStay: number;
  longestStay: number;
  shortTermRent: string;
  longTermRent: string;
  tailoredPricing: boolean;
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onShortTermRentChange: (value: string) => void;
  onLongTermRentChange: (value: string) => void;
}

const ListingCreationVerifyPricing: React.FC<ListingCreationVerifyPricingProps> = ({
  shortestStay,
  longestStay,
  shortTermRent,
  longTermRent,
  tailoredPricing,
  onShortestStayChange,
  onLongestStayChange,
  onShortTermRentChange,
  onLongTermRentChange
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
        {/* Chart Section */}
        <div className="mb-8">
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

        {/* Interactive Controls - Single Row */}
        <div className="flex items-center justify-between w-full gap-4 flex-wrap">
          {/* Shortest Stay Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="font-medium text-base text-[#404040] [font-family:'Poppins',Helvetica] whitespace-nowrap">
              Shortest stay:
            </label>
            <span className="font-normal text-base text-[#222222] [font-family:'Poppins',Helvetica] min-w-[20px]">
              {shortestStay}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-6 w-6 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                onClick={decreaseShortestStay}
                disabled={shortestStay <= 1}
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-6 w-6 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                onClick={increaseShortestStay}
                disabled={shortestStay >= longestStay}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Longest Stay Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="font-medium text-base text-[#404040] [font-family:'Poppins',Helvetica] whitespace-nowrap">
              Longest stay:
            </label>
            <span className="font-normal text-base text-[#222222] [font-family:'Poppins',Helvetica] min-w-[20px]">
              {longestStay}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-6 w-6 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                onClick={decreaseLongestStay}
                disabled={longestStay <= shortestStay}
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-6 w-6 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
                onClick={increaseLongestStay}
                disabled={longestStay >= 12}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Pricing Inputs */}
          <div className="flex items-center gap-4 flex-grow justify-end">
            <div className="flex items-center gap-2">
              <label className="font-medium text-base text-[#404040] [font-family:'Poppins',Helvetica] whitespace-nowrap">
                {shortestStay}mo rent:
              </label>
              <div className="relative w-[120px]">
                <span className="absolute inset-y-0 left-2 flex items-center text-gray-500 text-base">$</span>
                <Input 
                  className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-6 text-base" 
                  value={shortTermRent}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onShortTermRentChange(value);
                  }}
                  placeholder="0"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-medium text-base text-[#404040] [font-family:'Poppins',Helvetica] whitespace-nowrap">
                {longestStay}mo rent:
              </label>
              <div className="relative w-[120px]">
                <span className="absolute inset-y-0 left-2 flex items-center text-gray-500 text-base">$</span>
                <Input 
                  className="w-full h-9 rounded-[5px] border-2 border-[#0000004c] pl-6 text-base" 
                  value={longTermRent}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onLongTermRentChange(value);
                  }}
                  placeholder="0"
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

export default ListingCreationVerifyPricing;