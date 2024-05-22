import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const generateData = () => {
  const initialPrice = 2000;
  const data = [];
  let currentPrice = initialPrice;

  for (let i = 1; i <= 12; i++) {
    data.push({
      month: `Month ${i}`,
      price: currentPrice.toFixed(2),
    });
    currentPrice *= 0.99; // 1% decline each month
  }

  return data;
};

const RentBarChart: React.FC = () => {
  const data = generateData();

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="price" fill="#a3b899" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RentBarChart;
