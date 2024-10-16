import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RentBarChartProps {
  minValue: number;
  maxValue: number;
  minLength: number;
  maxLength: number;
}

const roundToNearestFive = (value: number) => {
  return Math.round(value / 5) * 5;
};

const generateData = (
  minValue: number,
  maxValue: number,
  minLength: number,
  maxLength: number,
) => {
  const data = [];
  const stepValue = (maxValue - minValue) / (maxLength - minLength);
  let currMonth = 1;

  for (let i = minLength; i <= maxLength; i++) {
    const value = minValue + stepValue * (i - minLength);
    const roundedValue = roundToNearestFive(value);
    data.push({
      month: ` ${currMonth} Month`,
      price: parseFloat(roundedValue.toFixed(2)), // Changed this to return a number instead of a string
    });
    currMonth++;
  }

  return data;
};

const roundUpToNearestHundred = (value: number) => {
  return Math.ceil(value / 100) * 100;
};

const generateTicks = (maxValue: number) => {
  const ticks = [];
  for (let i = 0; i <= maxValue; i += 500) {
    ticks.push(i);
  }
  return ticks;
};

const RentBarChart: React.FC<RentBarChartProps> = ({
  minValue,
  maxValue,
  minLength,
  maxLength,
}) => {
  const data = generateData(minValue, maxValue, minLength, maxLength);
  const roundedMaxValue = roundUpToNearestHundred(
    Math.max(minValue, maxValue) * 1.2,
  );
  const ticks = generateTicks(roundedMaxValue);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" interval={maxLength - minLength > 6 ? 1 : 0} />
          <YAxis domain={[0, roundedMaxValue]} ticks={ticks} />{" "}
          {/* Set ticks for Y-axis */}
          <Tooltip />
          <Legend />
          <Bar dataKey="price" name="Price Per Month" fill="#a3b899" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RentBarChart;
