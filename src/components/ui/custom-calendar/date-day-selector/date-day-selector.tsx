import React, { useState, useEffect } from 'react';
import Header from '../calendar-header';
import ColumnHeaders from '../column-headers';
import Days from './date-selector-days';

interface DateDaySelectorProps {
  tripDate: Date;
  onDateSelect?: (dates: [Date | null, Date | null]) => void;
}

const DateDaySelector: React.FC<DateDaySelectorProps> = ({ tripDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date(tripDate));
  const [selectedDays, setSelectedDays] = useState<[Date | null, Date | null]>([
    new Date(tripDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    new Date(tripDate.getTime() + 2 * 24 * 60 * 60 * 1000)
  ]);

  const handleDateClick = (date: Date) => {
    setSelectedDays(prevDays => {
      const newDays: [Date | null, Date | null] = [...prevDays];
      const index = date < tripDate ? 0 : 1;

      if (prevDays[index]?.getTime() === date.getTime()) {
        newDays[index] = null;
      } else {
        newDays[index] = date;
      }

      return newDays;
    });
  };

  useEffect(() => {
    if (onDateSelect) {
      onDateSelect(selectedDays);
    }
  }, [selectedDays]);

  return (
    <div className="w-full min-w-[300px] bg-dark shadow-lg rounded-lg ">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <Days
        currentDate={currentDate}
        selectedDays={selectedDays}
        tripDate={tripDate}
        onDateClick={handleDateClick}
      />
      <div className="p-4 space-y-2 text-md text-center">
        <div className="text-sm text-gray-500">
          {/* You can add additional information here if needed */}
        </div>
      </div>
    </div>
  );
};

export default DateDaySelector;