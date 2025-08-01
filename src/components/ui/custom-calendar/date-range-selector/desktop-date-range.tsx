import React, { useState } from 'react';
import { format, add, Duration, endOfMonth } from "date-fns"; // Import endOfMonth
import { motion, AnimatePresence } from 'framer-motion';
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

interface DesktopDateRangeProps {
  start: Date | null;
  end: Date | null;
  handleChange: (start: Date | null, end: Date | null) => void;
  onFlexibilityChange?: (flexibility: { start: 'exact' | number | null, end: 'exact' | number | null }) => void;
  initialFlexibility?: { start: 'exact' | number | null, end: 'exact' | number | null };
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null; // Add maximumDateRange prop
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
  maximumDateRange?: Duration | null; // Add maximumDateRange prop
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
  // Add other units like hours, minutes, seconds if needed
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
  disabledReason?: string | null; // Add reason for being disabled
}

interface FlexibleSelectorProps {
  type: 'start' | 'end';
  selectedOption: { start: 'exact' | number | null, end: 'exact' | number | null };
  onSelect: (type: 'start' | 'end', option: 'exact' | number | null) => void;
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
      // Prevent focus ring when disabled and using tooltip
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

  // Wrap with TooltipProvider and Tooltip only if disabled with a reason
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

  // Return the button directly if not disabled or no reason provided
  return DayButton;
}

function CalendarMonth({ year, month, dateRange, onDateSelect, onPrevMonth, onNextMonth, isPrevDisabled, minimumDateRange, maximumDateRange }: CalendarMonthProps) { // Add maximumDateRange prop
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

  // Returns a reason string if disabled, otherwise null
  const getDisabledReason = (day: number): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0); // Normalize the current calendar day

    // Disable past dates
    if (currentDate < today) {
      return "Trips cannot begin in the past.";
    }

    // Logic when only a start date is selected
    if (dateRange.start && !dateRange.end) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Normalize start date

      // Don't disable the start date itself
      if (currentDate.getTime() === startDate.getTime()) return null;

      // Disable dates strictly *before* the start date
      if (currentDate < startDate) {
         // This case should technically be covered by the past date check,
         // but kept for clarity if start date could be in the future.
         // Consider if a specific message is needed here.
         return "End date cannot be before start date.";
      }

      // Check minimum date range requirement
      if (minimumDateRange) {
        const minEndDate = add(startDate, minimumDateRange);
        minEndDate.setHours(0, 0, 0, 0); // Normalize min end date
        if (currentDate < minEndDate) {
          return `Trips must be at least ${formatDuration(minimumDateRange)} long.`;
        }
      }

      // Check maximum date range requirement
      if (maximumDateRange) {
        let maxEndDate: Date;
        // If days are null/undefined, calculate to the end of the month
        if (maximumDateRange.days === null || maximumDateRange.days === undefined) {
          // Add years, months, weeks first
          const intermediateDate = add(startDate, {
            years: maximumDateRange.years,
            months: maximumDateRange.months,
            weeks: maximumDateRange.weeks,
          });
          // Get the end of that month
          maxEndDate = endOfMonth(intermediateDate);
        } else {
          // Otherwise, add the full duration including days (even if 0)
          maxEndDate = add(startDate, maximumDateRange);
        }

        maxEndDate.setHours(0, 0, 0, 0); // Normalize max end date

        if (currentDate > maxEndDate) {
          // Use the original maximumDateRange for the message for clarity
          return `Trips cannot be longer than ${formatDuration(maximumDateRange)}.`;
        }
      }
    }

    // If no specific disabling condition met, the date is enabled
    return null;
  };


  return (
    <div className="w-full flex-1">
      {/* Month and Year Display with Navigation */}
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
              onClick={() => !isDisabled && onDateSelect(day, month, year)} // Prevent click if disabled
            />
          );
        })}
      </div>
    </div>
  );
}

function FlexibleDateSelector({ type, selectedOption, onSelect }: FlexibleSelectorProps) {
  const flexibleDateOptions = [
    { label: "Exact Date", value: "exact" },
    { label: "3", value: 3 },
    { label: "5", value: 5 },
    { label: "7", value: 7 },
    { label: "14", value: 14 },
  ];
  const currentValue = type === 'start' ? selectedOption.start : selectedOption.end;

  const handleOptionSelect = (option: 'exact' | number) => {
    onSelect(type, currentValue === option ? null : option);
  };

  return (
    <div className="inline-flex items-start gap-3">
      {flexibleDateOptions.map((option, index) => (
        <button
          key={`${type}-option-${index}`}
          className={`
            p-2 h-auto rounded border border-solid border-[#6c727e] 
            text-gray-neutral500 whitespace-nowrap
            flex items-center hover:bg-gray-100
            ${currentValue === option.value ? 'bg-secondaryBrand text-white' : ''}
          `}
          style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          onClick={() => handleOptionSelect(option.value as 'exact' | number)}
        >
          {option.value !== "exact" && (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V11.3333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33398 6.66663H12.6673" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33398 14H12.6673" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function DesktopDateRange({
  start,
  end,
  handleChange,
  onFlexibilityChange,
  initialFlexibility,
  minimumDateRange,
  maximumDateRange // Destructure the new prop
}: DesktopDateRangeProps) {
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

  const [flexibility, setFlexibility] = useState<{
    start: 'exact' | number | null;
    end: 'exact' | number | null;
  }>(() => initialFlexibility ?? { start: 'exact', end: 'exact' });

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

    // If selected date matches start, move end date to start and clear end
    if (start?.getTime() === selectedDate.getTime()) {
      return handleChange(end, null);
    }
    // If selected date matches end, just clear end date
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
    <div className="bg-background rounded-xl p-6">
      <div className="flex flex-wrap gap-8 justify-center">
        <div className="flex-1 flex flex-col max-w-[500px]">
          <div className="flex-1">
            <CalendarMonth
              year={leftYear}
              month={leftMonth}
              dateRange={{ start, end }}
              onDateSelect={handleDateSelect}
              onPrevMonth={handleLeftPrevMonth}
              onNextMonth={handleLeftNextMonth}
              isPrevDisabled={isCurrentMonth(leftMonth, leftYear)}
              minimumDateRange={minimumDateRange}
              maximumDateRange={maximumDateRange} // Pass prop down
            />
          </div>
          <div>
            <h3 className="text-xs mb-1">Flexible Start Date</h3>
            <FlexibleDateSelector
              type="start"
              selectedOption={flexibility}
              onSelect={(type, option) => {
                const newFlexibility = { ...flexibility, [type]: option };
                setFlexibility(newFlexibility);
                onFlexibilityChange?.(newFlexibility);
              }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col max-w-[500px]">
          <div className="flex-1">
            <CalendarMonth
              year={rightYear}
              month={rightMonth}
              dateRange={{ start, end }}
              onDateSelect={handleDateSelect}
              onPrevMonth={handleRightPrevMonth}
              onNextMonth={handleRightNextMonth}
              // Disable prev if the month before the right calendar is the same as or before the left calendar
              isPrevDisabled={
                new Date(rightYear, rightMonth - 1) <= new Date(leftYear, leftMonth)
              }
              minimumDateRange={minimumDateRange}
              maximumDateRange={maximumDateRange} // Pass prop down
            />
          </div>
          <div>
            <h3 className="text-xs mb-1">Flexible End Date</h3>
            <FlexibleDateSelector
              type="end"
              selectedOption={flexibility}
              onSelect={(type, option) => {
                const newFlexibility = { ...flexibility, [type]: option };
                setFlexibility(newFlexibility);
                onFlexibilityChange?.(newFlexibility);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
