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
  handleSave: (startDate: Date, endDate: Date) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ start, end, handleSave }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: start, endDate: end });

  const handleDateClick = (date: Date) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      if (!dateRange.startDate) {
        setDateRange({ startDate: date, endDate: null });
      } else if (!dateRange.endDate) {
        if (date >= dateRange.startDate) {
          setDateRange({ ...dateRange, endDate: date });
        } else {
          setDateRange({ startDate: date, endDate: dateRange.startDate });
        }
      }
    } else {
      if (date < dateRange.startDate) {
        setDateRange({ ...dateRange, startDate: date });
      } else if (date > dateRange.endDate) {
        setDateRange({ ...dateRange, endDate: date });
      } else if (date.getTime() === dateRange.startDate.getTime()) {
        setDateRange({ ...dateRange, startDate: null });
      } else if (date.getTime() === dateRange.endDate.getTime()) {
        setDateRange({ ...dateRange, endDate: null });
      } else {
        setDateRange({ startDate: date, endDate: null });
      }
    }
  };

  const onSave = () => {
    handleSave(dateRange.startDate, dateRange.endDate);
  };

  const onClear = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  return (
    <div className="w-full min-w-[500px] bg-dark shadow-lg rounded-lg ">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <Days
        currentDate={currentDate}
        dateRange={dateRange}
        onDateClick={handleDateClick}
      />
      <div className="p-4 space-y-2 text-md text-center">
        <div className="text-sm text-gray-500">
          {dateRange.startDate ? dateRange.startDate.toLocaleDateString() : 'Start date not selected'}
          {dateRange.endDate && (
            <>
              {' - '}
              {dateRange.endDate.toLocaleDateString()}
            </>
          )}
        </div>
        <Button onClick={onClear} className="w-full" variant="outline">Clear</Button>
        <Button onClick={onSave} className="w-full">Save</Button>
      </div>
    </div>
  );
};

export default DateRangeSelector;