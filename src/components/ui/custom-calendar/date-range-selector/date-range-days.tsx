import React from 'react';
import { getDaysInMonth, startOfMonth, format, isWithinInterval, isSameDay } from 'date-fns';

interface DaysProps {
  currentDate: Date;
  dateRange?: { startDate: Date | null; endDate: Date | null };
  onDateClick?: (date: Date) => void;
}

const Days: React.FC<DaysProps> = ({ currentDate, dateRange, onDateClick }) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = startOfMonth(currentDate);
  const startDayOfWeek = startDate.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const isStartDate = dateRange?.startDate && isSameDay(date, dateRange.startDate);
    const isEndDate = dateRange?.endDate && isSameDay(date, dateRange.endDate);
    const isInRange = dateRange?.startDate && dateRange?.endDate &&
      isWithinInterval(date, {
        start: new Date(dateRange.startDate.getTime() + 86400000), // Add one day to start
        end: new Date(dateRange.endDate.getTime() - 86400000) // Subtract one day from end
      });

    let className = "p-2 text-center hover:bg-primaryBrand/40 cursor-pointer";
    if (isStartDate || isEndDate) className += " bg-primaryBrand";
    else if (isInRange) className += " bg-primaryBrand/60";

    return (
      <div
        key={i}
        className={className}
        onClick={() => onDateClick && onDateClick(date)}
      >
        {i + 1}
      </div>
    );
  });

  const blanks = Array(startDayOfWeek).fill(null).map((_, i) => (
    <div key={`blank-${i}`} className="p-2"></div>
  ));

  return (
    <div className="grid grid-cols-7 gap-1 p-2">
      {blanks}
      {days}
    </div>
  );
};

export default Days;