import React, { useState } from 'react';
import Header from '../calendar-header';
import ColumnHeaders from '../column-headers';
import Days from './date-selector-days';
import { Button } from "@/components/ui/button";

interface DateDaySelectorProps {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
}

const DateDaySelector: React.FC<DateDaySelectorProps> = ({ selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(selectedDate || null);

  const handleDateClick = (date: Date) => {
    setSelectedDay(date);
  };

  const onSave = () => {
    if (selectedDay && onDateSelect) {
      onDateSelect(selectedDay);
    }
  };

  const onClear = () => {
    setSelectedDay(null);
  };

  return (
    <div className="w-full min-w-[300px] bg-dark shadow-lg rounded-lg ">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <Days
        currentDate={currentDate}
        selectedDay={selectedDay}
        onDateClick={handleDateClick}
      />
      <div className="p-4 space-y-2 text-md text-center">
        <div className="text-sm text-gray-500">
        </div>
      </div>
    </div>
  );
};

export default DateDaySelector;