import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RentBarChartProps {
  minValue: number;
  maxValue: number;
  minLength: number;
  maxLength: number;
}

const generateData = (minValue: number, maxValue: number, minLength: number, maxLength: number) => {
  const data = [];
  const stepValue = (maxValue - minValue) / (maxLength - minLength);
  let currMonth = 1;

  for (let i = minLength; i <= maxLength; i++) {
    const value = minValue + stepValue * (i - minLength);
    data.push({
      month: `Month ${currMonth}`,
      price: parseFloat(value.toFixed(2)), // Changed this to return a number instead of a string
    });
    currMonth++;
  }

  return data;
};

const roundUpToNearestHundred = (value: number) => {
  return Math.ceil(value / 100) * 100;
};

const RentBarChart: React.FC<RentBarChartProps> = ({ minValue, maxValue, minLength, maxLength }) => {

  const data = generateData(minValue, maxValue, minLength, maxLength);
  const roundedMaxValue = roundUpToNearestHundred(maxValue * 1.2);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" interval={maxLength - minLength > 6 ? 1 : 0} />
          <YAxis domain={[0, roundedMaxValue]} /> {/* Add 10% buffer above maxValue and round to the nearest hundred */}
          <Tooltip />
          <Legend />
          <Bar dataKey="price" fill="#a3b899" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RentBarChart;
