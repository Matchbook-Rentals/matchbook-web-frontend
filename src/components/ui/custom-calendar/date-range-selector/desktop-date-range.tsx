import React, { useState } from 'react';
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DesktopDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (start: Date | null, end: Date | null) => void;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  dateRange: DateRange;
  onDateSelect: (day: number, month: number, year: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isPrevDisabled?: boolean;
}

interface CalendarDayProps {
  day: number;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate?: boolean;
  isEndDate?: boolean;
  onClick: () => void;
}

function CalendarDay({ day, isSelected, isInRange, isStartDate, isEndDate, onClick }: CalendarDayProps) {
  const hasCompleteRange = isInRange || isEndDate;
  const showRangeBackground = hasCompleteRange && isInRange && !isSelected;
  const showStartBackground = hasCompleteRange && isStartDate && !isEndDate;
  const showEndBackground = hasCompleteRange && isEndDate && !isStartDate;

  return (
    <button
      className="aspect-square w-full flex items-center justify-center text-base hover:bg-gray-100 relative"
      onClick={onClick}
    >
      <span className={`
                z-10
                ${isSelected ? 'rounded-full bg-[#4f4f4f] text-white w-9 h-9 flex items-center justify-center text-base' : ''}
            `}>
        {day}
      </span>
      {showRangeBackground && (
        <div className="absolute inset-y-1/4 inset-x-0 bg-[#5C9AC533]" />
      )}
      {showStartBackground && (
        <div className="absolute right-0 left-1/2 inset-y-1/4 bg-[#5C9AC533]" />
      )}
      {showEndBackground && (
        <div className="absolute left-0 right-1/2 inset-y-1/4 bg-[#5C9AC533]" />
      )}
    </button>
  );
}

function CalendarMonth({ year, month, dateRange, onDateSelect, onPrevMonth, onNextMonth, isPrevDisabled }: CalendarMonthProps) {
  // Calculate calendar grid parameters
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Helper functions for date comparisons
  const isDateInRange = (day: number) => {
    if (!dateRange.start || !dateRange.end) return false;
    const currentDate = new Date(year, month, day);
    return currentDate >= dateRange.start && currentDate <= dateRange.end;
  };

  const isDateSelected = (day: number) => {
    if (!dateRange.start) return false;
    const currentDate = new Date(year, month, day);
    return (
      currentDate.getTime() === dateRange.start.getTime() ||
      (dateRange.end && currentDate.getTime() === dateRange.end.getTime())
    );
  };

  const isStartDate = (day: number) => {
    if (!dateRange.start) return false;
    const currentDate = new Date(year, month, day);
    return currentDate.getTime() === dateRange.start.getTime();
  };

  const isEndDate = (day: number) => {
    if (!dateRange.end) return false;
    const currentDate = new Date(year, month, day);
    return currentDate.getTime() === dateRange.end.getTime();
  };

  return (
    <div className="w-full flex-1">
      {/* Month and Year Display with Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onPrevMonth}
          disabled={isPrevDisabled}
          className={`text-sm px-2 py-1 hover:bg-gray-100 rounded-md ${
            isPrevDisabled
              ? 'text-gray-300 cursor-not-allowed hover:bg-transparent'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Prev
        </button>
        <h2 className="text-base font-medium">
          {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={onNextMonth}
          className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded-md"
        >
          Next
        </button>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          return (
            <CalendarDay
              key={day}
              day={day}
              isSelected={isDateSelected(day)}
              isInRange={isDateInRange(day)}
              isStartDate={isStartDate(day)}
              isEndDate={isEndDate(day)}
              onClick={() => onDateSelect(day, month, year)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DesktopDateRange({ start, end, handleChange }: DesktopDateRangeProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [leftMonth, setLeftMonth] = useState(currentMonth);
  const [leftYear, setLeftYear] = useState(currentYear);
  const [rightMonth, setRightMonth] = useState(() => {
    // If end date exists and is valid (after start date and different month)
    if (end && (!start || (end > start &&
        (end.getMonth() !== start.getMonth() || end.getFullYear() !== start.getFullYear())))) {
      return end.getMonth();
    }
    // Default to next month
    return currentMonth === 11 ? 0 : currentMonth + 1;
  });
  const [rightYear, setRightYear] = useState(() => {
    // If end date exists and is valid (after start date and different month)
    if (end && (!start || (end > start &&
        (end.getMonth() !== start.getMonth() || end.getFullYear() !== start.getFullYear())))) {
      return end.getFullYear();
    }
    // Default to current year (or next year if December)
    return currentMonth === 11 ? currentYear + 1 : currentYear;
  });

  // Helper to check if a month/year combination is before current month
  const isBeforeCurrentMonth = (month: number, year: number) => {
    return year < currentYear || (year === currentYear && month < currentMonth);
  };

  // Helper to check if it's the current month
  const isCurrentMonth = (month: number, year: number) => {
    return month === currentMonth && year === currentYear;
  };

  const handleLeftPrevMonth = () => {
    // Don't allow going before current month
    if (isCurrentMonth(leftMonth, leftYear)) return;

    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(prev => prev - 1);
    } else {
      setLeftMonth(prev => prev - 1);
    }
  };

  const handleLeftNextMonth = () => {
    // Calculate next month for left calendar
    const nextLeftMonth = leftMonth === 11 ? 0 : leftMonth + 1;
    const nextLeftYear = leftMonth === 11 ? leftYear + 1 : leftYear;

    // Update left calendar
    setLeftMonth(nextLeftMonth);
    setLeftYear(nextLeftYear);

    // If this would overlap with right calendar, push right calendar forward
    if (nextLeftMonth === rightMonth && nextLeftYear === rightYear) {
      if (rightMonth === 11) {
        setRightMonth(0);
        setRightYear(prev => prev + 1);
      } else {
        setRightMonth(prev => prev + 1);
      }
    }
  };

  // Add navigation handlers for right calendar
  const handleRightPrevMonth = () => {
    const newDate = new Date(rightYear, rightMonth - 1);
    const leftDate = new Date(leftYear, leftMonth);

    // Only allow moving back if it would still be after left calendar
    if (newDate > leftDate) {
      if (rightMonth === 0) {
        setRightMonth(11);
        setRightYear(prev => prev - 1);
      } else {
        setRightMonth(prev => prev - 1);
      }
    } else {
      // If trying to go too far back, move left calendar back too
      handleLeftPrevMonth();
      if (rightMonth === 0) {
        setRightMonth(11);
        setRightYear(prev => prev - 1);
      } else {
        setRightMonth(prev => prev - 1);
      }
    }
  };

  const handleRightNextMonth = () => {
    if (rightMonth === 11) {
      setRightMonth(0);
      setRightYear(prev => prev + 1);
    } else {
      setRightMonth(prev => prev + 1);
    }
  };

  // Date selection handler
  const handleDateSelect = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day);

    // If selected date matches start or end, deselect it
    if (start?.getTime() === selectedDate.getTime()) {
      return handleChange(null, end);
    }
    if (end?.getTime() === selectedDate.getTime()) {
      return handleChange(start, null);
    }

    // If both dates are selected...
    if (start && end) {
      // If selected date is between start and end, set it as new start
      if (selectedDate > start && selectedDate < end) {
        return handleChange(selectedDate, null);
      }
      if (selectedDate < start) {
        return handleChange(selectedDate, end);
      }
      if (selectedDate > end) {
        return handleChange(start, selectedDate);
      }
    }

    // If only start is selected...
    if (start && !end) {
      // Set end date based on whether selected is before or after start
      return selectedDate < start
        ? handleChange(selectedDate, start)
        : handleChange(start, selectedDate);
    }

    // If nothing is selected, set as start date
    return handleChange(selectedDate, null);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex gap-8">
        <div className="flex-1">
          <CalendarMonth
            year={leftYear}
            month={leftMonth}
            dateRange={{ start, end }}
            onDateSelect={handleDateSelect}
            onPrevMonth={handleLeftPrevMonth}
            onNextMonth={handleLeftNextMonth}
            isPrevDisabled={isCurrentMonth(leftMonth, leftYear)}
          />
        </div>
        <div className="flex-1">
          <CalendarMonth
            year={rightYear}
            month={rightMonth}
            dateRange={{ start, end }}
            onDateSelect={handleDateSelect}
            onPrevMonth={handleRightPrevMonth}
            onNextMonth={handleRightNextMonth}
            isPrevDisabled={isCurrentMonth(leftMonth, leftYear) && rightMonth === currentMonth + 1}
          />
        </div>
      </div>
    </div>
  );
}
