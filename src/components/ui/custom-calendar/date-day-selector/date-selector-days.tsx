import React from 'react';
import { getDaysInMonth, startOfMonth, isSameDay } from 'date-fns';

interface DaysProps {
  currentDate: Date;
  selectedDays: [Date | null, Date | null];
  tripDate: Date;
  onDateClick: (date: Date) => void;
}

const Days: React.FC<DaysProps> = ({ currentDate, selectedDays, tripDate, onDateClick }) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = startOfMonth(currentDate);
  const startDayOfWeek = startDate.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const isTripDate = isSameDay(date, tripDate);
    const isSelectedStart = selectedDays[0] && isSameDay(date, selectedDays[0]);
    const isSelectedEnd = selectedDays[1] && isSameDay(date, selectedDays[1]);

    let className = "p-2 text-center ";
    if (isTripDate) {
      className += " bg-primaryBrand cursor-default rounded-full";
    } else if (isSelectedStart || isSelectedEnd) {
      className += " cursor-pointer bg-gray-300 rounded-full hover:bg-gray-200";
    } else {
      className += " cursor-pointer hover:bg-gray-200";
    }

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