import React, { useState } from 'react';
import { format, add, Duration, endOfMonth } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface SimpleDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (start: Date | null, end: Date | null) => void;
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  dateRange: DateRange;
  onDateSelect: (day: number, month: number, year: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isPrevDisabled?: boolean;
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null;
}

// Helper function to format Duration object into a readable string
function formatDuration(duration: Duration): string {
  const parts: string[] = [];
  if (duration.years && duration.years > 0) {
    parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
  }
  if (duration.months && duration.months > 0) {
    parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
  }
  if (duration.weeks && duration.weeks > 0) {
    parts.push(`${duration.weeks} week${duration.weeks > 1 ? 's' : ''}`);
  }
  if (duration.days && duration.days > 0) {
    parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
  }
  return parts.join(', ');
}

interface CalendarDayProps {
  day: number;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate?: boolean;
  isEndDate?: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  disabledReason?: string | null;
}

function CalendarDay({ day, isSelected, isInRange, isStartDate, isEndDate, onClick, isDisabled, disabledReason }: CalendarDayProps) {
  const selectedDayBgColor = 'bg-secondaryBrand';
  const inRangeBgColor = 'bg-gray-200';

  const hasCompleteRange = isInRange || isEndDate;
  const showRangeBackground = hasCompleteRange && isInRange && !isSelected;
  const showStartBackground = hasCompleteRange && isStartDate && !isEndDate;
  const showEndBackground = hasCompleteRange && isEndDate && !isStartDate;

  const DayButton = (
    <button
      className={`
        aspect-square w-full flex items-center justify-center text-base relative
        ${!isDisabled ? 'hover:bg-gray-100' : 'cursor-not-allowed'}
      `}
      onClick={onClick}
      disabled={isDisabled}
      tabIndex={isDisabled ? -1 : undefined}
    >
      <span className={`
        z-10
        ${isSelected ? `rounded-full ${selectedDayBgColor} text-white w-9 h-9 flex items-center justify-center text-base` : ''}
        ${isDisabled && !isSelected ? 'text-gray-300' : ''}
      `}>
        {day}
      </span>
      {showRangeBackground && (
        <div className={`absolute inset-y-1/4 inset-x-0 ${inRangeBgColor}`} />
      )}
      {showStartBackground && (
        <div className={`absolute right-0 left-1/2 inset-y-1/4 ${inRangeBgColor}`} />
      )}
      {showEndBackground && (
        <div className={`absolute left-0 right-1/2 inset-y-1/4 ${inRangeBgColor}`} />
      )}
    </button>
  );

  if (isDisabled && disabledReason) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{DayButton}</TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return DayButton;
}

function CalendarMonth({ year, month, dateRange, onDateSelect, onPrevMonth, onNextMonth, isPrevDisabled, minimumDateRange, maximumDateRange }: CalendarMonthProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

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

  const getDisabledReason = (day: number): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate < today) {
      return "Trips cannot begin in the past.";
    }

    if (dateRange.start && !dateRange.end) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === startDate.getTime()) return null;

      if (currentDate < startDate) {
         return "End date cannot be before start date.";
      }

      if (minimumDateRange) {
        const minEndDate = add(startDate, minimumDateRange);
        minEndDate.setHours(0, 0, 0, 0);
        if (currentDate < minEndDate) {
          return `Trips must be at least ${formatDuration(minimumDateRange)} long.`;
        }
      }

      if (maximumDateRange) {
        let maxEndDate: Date;
        if (maximumDateRange.days === null || maximumDateRange.days === undefined) {
          const intermediateDate = add(startDate, {
            years: maximumDateRange.years,
            months: maximumDateRange.months,
            weeks: maximumDateRange.weeks,
          });
          maxEndDate = endOfMonth(intermediateDate);
        } else {
          maxEndDate = add(startDate, maximumDateRange);
        }

        maxEndDate.setHours(0, 0, 0, 0);

        if (currentDate > maxEndDate) {
          return `Trips cannot be longer than ${formatDuration(maximumDateRange)}.`;
        }
      }
    }

    return null;
  };

  return (
    <div className="w-full flex-1">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onPrevMonth}
          disabled={isPrevDisabled}
          className={`text-sm px-2 py-1 hover:bg-gray-100 rounded-md ${isPrevDisabled
            ? 'text-gray-300 cursor-not-allowed hover:bg-transparent'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Prev
        </button>
        <h2 className="text-base font-medium text-secondaryBrand">
          {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={onNextMonth}
          className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded-md"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const disabledReason = getDisabledReason(day);
          const isDisabled = !!disabledReason;
          return (
            <CalendarDay
              key={day}
              day={day}
              isSelected={isDateSelected(day)}
              isInRange={isDateInRange(day)}
              isStartDate={isStartDate(day)}
              isEndDate={isEndDate(day)}
              isDisabled={isDisabled}
              disabledReason={disabledReason}
              onClick={() => !isDisabled && onDateSelect(day, month, year)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SimpleDateRange({
  start,
  end,
  handleChange,
  minimumDateRange,
  maximumDateRange
}: SimpleDateRangeProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [leftMonth, setLeftMonth] = useState(() => {
    if (start) return start.getMonth();
    if (end) return end.getMonth();
    return currentMonth;
  });
  const [leftYear, setLeftYear] = useState(() => {
    if (start) return start.getFullYear();
    if (end) return end.getFullYear();
    return currentYear;
  });
  const [rightMonth, setRightMonth] = useState(() => {
    if (end && (!start || (end > start &&
      (end.getMonth() !== start.getMonth() || end.getFullYear() !== start.getFullYear())))) {
      return end.getMonth();
    }
    return currentMonth === 11 ? 0 : currentMonth + 1;
  });
  const [rightYear, setRightYear] = useState(() => {
    if (end && (!start || (end > start &&
      (end.getMonth() !== start.getMonth() || end.getFullYear() !== start.getFullYear())))) {
      return end.getFullYear();
    }
    return currentMonth === 11 ? currentYear + 1 : currentYear;
  });

  const isBeforeCurrentMonth = (month: number, year: number) => {
    return year < currentYear || (year === currentYear && month < currentMonth);
  };

  const isCurrentMonth = (month: number, year: number) => {
    return month === currentMonth && year === currentYear;
  };

  const handleLeftPrevMonth = () => {
    if (isCurrentMonth(leftMonth, leftYear)) return;

    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(prev => prev - 1);
    } else {
      setLeftMonth(prev => prev - 1);
    }
  };

  const handleLeftNextMonth = () => {
    const nextLeftMonth = leftMonth === 11 ? 0 : leftMonth + 1;
    const nextLeftYear = leftMonth === 11 ? leftYear + 1 : leftYear;

    setLeftMonth(nextLeftMonth);
    setLeftYear(nextLeftYear);

    if (nextLeftMonth === rightMonth && nextLeftYear === rightYear) {
      if (rightMonth === 11) {
        setRightMonth(0);
        setRightYear(prev => prev + 1);
      } else {
        setRightMonth(prev => prev + 1);
      }
    }
  };

  const handleRightPrevMonth = () => {
    const newDate = new Date(rightYear, rightMonth - 1);
    const leftDate = new Date(leftYear, leftMonth);

    if (newDate > leftDate) {
      if (rightMonth === 0) {
        setRightMonth(11);
        setRightYear(prev => prev - 1);
      } else {
        setRightMonth(prev => prev - 1);
      }
    } else {
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

  const handleDateSelect = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day);

    if (start?.getTime() === selectedDate.getTime()) {
      return handleChange(end, null);
    }
    if (end?.getTime() === selectedDate.getTime()) {
      return handleChange(start, null);
    }

    if (start && end) {
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

    if (start && !end) {
      return selectedDate < start
        ? handleChange(selectedDate, start)
        : handleChange(start, selectedDate);
    }

    return handleChange(selectedDate, null);
  };

  return (
    <div className="bg-background rounded-xl p-6 min-w-[800px]">
      <div className="flex gap-8 justify-center">
        <div className="flex-1 flex flex-col min-w-[300px]">
          <CalendarMonth
            year={leftYear}
            month={leftMonth}
            dateRange={{ start, end }}
            onDateSelect={handleDateSelect}
            onPrevMonth={handleLeftPrevMonth}
            onNextMonth={handleLeftNextMonth}
            isPrevDisabled={isCurrentMonth(leftMonth, leftYear)}
            minimumDateRange={minimumDateRange}
            maximumDateRange={maximumDateRange}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-[300px]">
          <CalendarMonth
            year={rightYear}
            month={rightMonth}
            dateRange={{ start, end }}
            onDateSelect={handleDateSelect}
            onPrevMonth={handleRightPrevMonth}
            onNextMonth={handleRightNextMonth}
            isPrevDisabled={
              new Date(rightYear, rightMonth - 1) <= new Date(leftYear, leftMonth)
            }
            minimumDateRange={minimumDateRange}
            maximumDateRange={maximumDateRange}
          />
        </div>
      </div>
    </div>
  );
}