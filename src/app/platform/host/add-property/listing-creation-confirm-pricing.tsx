import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceDot } from 'recharts';
import { MonthlyPricing } from "./listing-creation-pricing";
import { Star } from "lucide-react";

interface ListingCreationConfirmPricingProps {
  shortestStay: number;
  longestStay: number;
  monthlyPricing: MonthlyPricing[];
  includeUtilities: boolean;
  utilitiesUpToMonths: number;
}

const ListingCreationConfirmPricing: React.FC<ListingCreationConfirmPricingProps> = ({
  shortestStay,
  longestStay,
  monthlyPricing,
  includeUtilities,
  utilitiesUpToMonths,
}) => {
  
  // Helper functions for chart data
  const roundToNearestFive = (value: number) => {
    return Math.round(value / 5) * 5;
  };

  const generateChartData = () => {
    return monthlyPricing.map(pricing => {
      const price = pricing.price ? parseFloat(pricing.price) : 0;
      const monthLabel = pricing.months === 1 ? `${pricing.months} Month` : `${pricing.months} Months`;
      const isUtilitiesIncluded = pricing.utilitiesIncluded;
      
      return {
        month: monthLabel,
        price: price,
        utilitiesIncluded: isUtilitiesIncluded,
        color: isUtilitiesIncluded ? '#0B6E6E' : '#5DA5A5', // Full secondaryBrand for utilities, lighter for no utilities
      };
    });
  };

  const chartData = generateChartData();
  
  const roundUpToNearestHundred = (value: number) => {
    return Math.ceil(value / 100) * 100;
  };

  const getMaxChartValue = () => {
    const prices = monthlyPricing.map(p => p.price ? parseFloat(p.price) : 0).filter(p => p > 0);
    if (prices.length === 0) return 2000; // Default if no values set
    const maxPrice = Math.max(...prices);
    return roundUpToNearestHundred(maxPrice * 1.2); // 20% higher than the highest value
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

  return (
    <div className="relative w-full md:max-w-[886px]">
      <div className="w-full">
        {/* Chart Section */}
        <div className="mb-8">
          <h3 className="font-medium text-2xl text-[#222222] [font-family:'Poppins',Helvetica] mb-4">
            Your pricing structure
          </h3>

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
                  formatter={(value, name, props) => {
                    const entry = props.payload;
                    return [`$${value}${entry.utilitiesIncluded ? ' (utilities included)' : ''}`, 'Monthly Rent'];
                  }}
                  labelFormatter={(label) => `Stay Length: ${label}`}
                />
                <Legend 
                  content={() => (
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0B6E6E' }}></div>
                        <span className="text-sm font-medium text-[#222222]">Utilities Included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#5DA5A5' }}></div>
                        <span className="text-sm font-medium text-[#222222]">Not included</span>
                      </div>
                    </div>
                  )}
                />
                <Bar 
                  dataKey="price" 
                  name="Monthly Rent" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-lg text-[#222222] [font-family:'Poppins',Helvetica] mb-3">
            Pricing Summary
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-base text-[#404040]">Lease lengths:</span>
              <span className="ml-2 text-base text-[#222222]">
                {shortestStay} to {longestStay} months
              </span>
            </div>
            <div>
              <span className="font-medium text-base text-[#404040]">Price range:</span>
              <span className="ml-2 text-base text-[#222222]">
                ${Math.min(...monthlyPricing.map(p => parseFloat(p.price) || 0).filter(p => p > 0))} - 
                ${Math.max(...monthlyPricing.map(p => parseFloat(p.price) || 0))} per month
              </span>
            </div>
            <div>
              <span className="font-medium text-base text-[#404040]">Utilities included:</span>
              <span className="ml-2 text-base text-[#222222]">
                {monthlyPricing.some(p => p.utilitiesIncluded) 
                  ? `Yes, for ${monthlyPricing.filter(p => p.utilitiesIncluded).length} lease length(s)`
                  : 'No'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCreationConfirmPricing;
