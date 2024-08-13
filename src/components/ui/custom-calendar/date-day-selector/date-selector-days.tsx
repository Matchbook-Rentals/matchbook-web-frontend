import React from 'react';
import { getDaysInMonth, startOfMonth, isSameDay } from 'date-fns';

interface DaysProps {
  currentDate: Date;
  selectedDay: Date | null;
  onDateClick: (date: Date) => void;
}

const Days: React.FC<DaysProps> = ({ currentDate, selectedDay, onDateClick }) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = startOfMonth(currentDate);
  const startDayOfWeek = startDate.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const isSelected = selectedDay && isSameDay(date, selectedDay);

    let className = "p-2 text-center hover:bg-primaryBrand/40 cursor-pointer";
    if (isSelected) className += " bg-primaryBrand rounded-full";

    return (
      <div
        key={i}
        className={className}
        onClick={() => onDateClick(date)}
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