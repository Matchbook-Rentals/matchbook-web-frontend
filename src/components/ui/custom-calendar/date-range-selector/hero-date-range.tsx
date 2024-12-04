import React, { useState } from 'react';
import Header from '../calendar-header';
import ColumnHeaders from '../column-headers';
import Days from './date-range-days';
import { Button } from "@/components/ui/button";
import { addMonths } from 'date-fns';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface HeroDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (startDate: Date, endDate: Date) => void;
}

const HeroDateRange: React.FC<HeroDateRangeProps> = ({ start, end, handleChange }) => {
  const [leftDate, setLeftDate] = useState(start);
  const [rightDate, setRightDate] = useState(end);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: start, endDate: end });

  const handleDateClick = (date: Date) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      if (!dateRange.startDate) {
        const newStartDate = date;
        const newEndDate = addMonths(date, 1);
        setDateRange({
          startDate: newStartDate,
          endDate: newEndDate
        });
        handleChange(newStartDate, newEndDate);
      } else if (!dateRange.endDate) {
        if (date >= dateRange.startDate) {
          const minimumEndDate = addMonths(dateRange.startDate, 1);
          const newEndDate = date < minimumEndDate ? minimumEndDate : date;
          setDateRange({
            ...dateRange,
            endDate: newEndDate
          });
          handleChange(dateRange.startDate, newEndDate);
        } else {
          const newStartDate = date;
          const newEndDate = addMonths(date, 1);
          setDateRange({
            startDate: newStartDate,
            endDate: newEndDate
          });
          handleChange(newStartDate, newEndDate);
        }
      }
    } else {
      if (date < dateRange.startDate) {
        const newStartDate = date;
        const newEndDate = addMonths(date, 1);
        setDateRange({
          startDate: newStartDate,
          endDate: newEndDate
        });
        handleChange(newStartDate, newEndDate);
      } else if (date > dateRange.endDate) {
        const minimumEndDate = addMonths(dateRange.startDate, 1);
        const newEndDate = date < minimumEndDate ? minimumEndDate : date;
        setDateRange({
          ...dateRange,
          endDate: newEndDate
        });
        handleChange(dateRange.startDate, newEndDate);
      } else if (date.getTime() === dateRange.startDate.getTime() ||
                 date.getTime() === dateRange.endDate.getTime()) {
        setDateRange({ startDate: null, endDate: null });
        // Don't call handleChange here as both dates are null
      } else {
        const newStartDate = date;
        const newEndDate = addMonths(date, 1);
        setDateRange({
          startDate: newStartDate,
          endDate: newEndDate
        });
        handleChange(newStartDate, newEndDate);
      }
    }
  };

  const handleLeftMonthChange = (newDate: Date) => {
    setLeftDate(newDate);
    setRightDate(addMonths(newDate, 1));
  };

  const handleRightMonthChange = (newDate: Date) => {
    setRightDate(newDate);
    setLeftDate(addMonths(newDate, -1));
  };

  const onClear = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  return (
    <div className="w-full bg-dark shadow-lg rounded-lg p-4">
      <div className="flex flex-col lg:flex-row lg:space-x-4">
        {/* Left Calendar */}
        <div className="flex-1 min-w-[300px]">
          <Header
            currentDate={leftDate}
            setCurrentDate={handleLeftMonthChange}
          />
          <ColumnHeaders />
          <Days
            currentDate={leftDate}
            dateRange={dateRange}
            onDateClick={handleDateClick}
          />
        </div>

        {/* Right Calendar */}
        <div className="flex-1 min-w-[300px] mt-4 lg:mt-0">
          <Header
            currentDate={rightDate}
            setCurrentDate={handleRightMonthChange}
          />
          <ColumnHeaders />
          <Days
            currentDate={rightDate}
            dateRange={dateRange}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      <div className="p-4 space-y-2 text-md text-center mt-4">
        <div className="text-sm text-gray-500">
          {dateRange.startDate ? dateRange.startDate.toLocaleDateString() : 'Start date not selected'}
          {dateRange.endDate && (
            <>
              {' - '}
              {dateRange.endDate.toLocaleDateString()}
            </>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={onClear} className="w-full" variant="outline">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroDateRange;