import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RentBarChartProps {
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
}

const generateData = (minValue: number, maxValue: number, minLength: number, maxLength: number) => {
  const data = [];
  const stepValue = (maxValue - minValue) / (maxLength - minLength);

  for (let i = minLength; i <= maxLength; i++) {
    const value = minValue + stepValue * (i - minLength);
    data.push({
      month: `Month ${i}`,
      price: value.toFixed(2),
    });
  }

  return data;
};

const RentBarChart: React.FC<RentBarChartProps> = ({ minValue, maxValue, minLength, maxLength }) => {

  const data = generateData(minValue, maxValue, minLength, maxLength);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="price" fill="#a3b899" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RentBarChart;
