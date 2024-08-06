import React, { useState } from 'react';
import Header from '../calendar-header';
import ColumnHeaders from '../column-headers';
import Days from './date-range-days';
import { Button } from "@/components/ui/button";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeSelectorProps {
  start: Date | null;
  end: Date | null;
  handleSave: (range: DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ start, end, handleSave }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: start, endDate: end });

  const handleDateClick = (date: Date) => {
    if (!dateRange.startDate) {
      setDateRange({ startDate: date, endDate: null });
    } else if (!dateRange.endDate) {
      if (date >= dateRange.startDate) {
        setDateRange({ ...dateRange, endDate: date });
      } else {
        // If the second selected date is before the start date,
        // make it the new start date and the old start date becomes the end date
        setDateRange({ startDate: date, endDate: dateRange.startDate });
      }
    } else {
      setDateRange({ startDate: date, endDate: null });
    }
  };

  const onSave = () => {
    handleSave(dateRange);
  };

  return (
    <div className="w-80 bg-dark shadow-lg rounded-lg ">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <Days
        currentDate={currentDate}
        dateRange={dateRange}
        onDateClick={handleDateClick}
      />
      <div className="p-4">
        <Button onClick={onSave} className="w-full">Save</Button>
      </div>
    </div>
  );
};

export default DateRangeSelector;