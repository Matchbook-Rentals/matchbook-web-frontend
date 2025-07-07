import React, { useState } from 'react';
import { format, add, Duration, endOfMonth } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface MobileDateRangeProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClose: () => void;
  onProceed?: () => void;
  flexibleStart?: 'exact' | number | null;
  flexibleEnd?: 'exact' | number | null;
  onFlexibilityChange?: (flexibility: { start: 'exact' | number | null; end: 'exact' | number | null }) => void;
  minimumDateRange?: Duration | null;
  maximumDateRange?: Duration | null; // Add maximumDateRange prop
}

interface CalendarMonthProps {
  year: number;
  month: number;
  dateRange: DateRange;
  onDateSelect: (day: number, month: number, year: number) => void;
  isMobile?: boolean;
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
  return parts.join(', ');
}

interface CalendarDayProps {
  day: number;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate?: boolean;
  isEndDate?: boolean;
  onClick: () => void;
  isMobile?: boolean;
  isDisabled?: boolean;
  disabledReason?: string | null;
}

interface FlexibleSelectorProps {
  type: 'start' | 'end';
  selectedOption: { start: 'exact' | number | null, end: 'exact' | number | null };
  onSelect: (type: 'start' | 'end', option: 'exact' | number | null) => void;
}

function CalendarMonth({ year: initialYear, month: initialMonth, dateRange, onDateSelect, isMobile, minimumDateRange, maximumDateRange }: CalendarMonthProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [direction, setDirection] = useState(0);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePreviousMonth = () => {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Helper to check if it's the current month
  const isCurrentMonth = (month: number, year: number) => {
    const today = new Date();
    return month === today.getMonth() && year === today.getFullYear();
  };

  const isDateInRange = (day: number) => {
    if (!dateRange.start || !dateRange.end) return false;
    const currentDate = new Date(currentYear, currentMonth, day);
    return currentDate >= dateRange.start && currentDate <= dateRange.end;
  };

  const isDateSelected = (day: number) => {
    if (!dateRange.start) return false;
    const currentDate = new Date(currentYear, currentMonth, day);
    return (
      currentDate.getTime() === dateRange.start.getTime() ||
      (dateRange.end && currentDate.getTime() === dateRange.end.getTime())
    );
  };

  const isStartDate = (day: number) => {
    if (!dateRange.start) return false;
    const currentDate = new Date(currentYear, currentMonth, day);
    return currentDate.getTime() === dateRange.start.getTime();
  };

  const isEndDate = (day: number) => {
    if (!dateRange.end) return false;
    const currentDate = new Date(currentYear, currentMonth, day);
    return currentDate.getTime() === dateRange.end.getTime();
  };

  // Returns a reason string if disabled, otherwise null
  const getDisabledReason = (day: number): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const currentDate = new Date(currentYear, currentMonth, day);
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
          onClick={handlePreviousMonth}
          disabled={isCurrentMonth(currentMonth, currentYear)}
          className={`text-sm px-2 py-1 hover:bg-gray-100 rounded-md ${isCurrentMonth(currentMonth, currentYear)
            ? 'text-gray-300 cursor-not-allowed hover:bg-transparent'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Prev
        </button>
        <h2 className="text-base font-medium text-secondaryBrand">
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={handleNextMonth}
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
              onClick={() => !isDisabled && onDateSelect(day, currentMonth, currentYear)}
              isMobile={isMobile}
              isDisabled={isDisabled}
              disabledReason={disabledReason}
            />
          );
        })}
      </div>
    </div>
  );
}

function CalendarDay({ day, isSelected, isInRange, isStartDate, isEndDate, onClick, isMobile, isDisabled, disabledReason }: CalendarDayProps) {
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
            flex items-center hover:bg-secondaryBrand hover:text-white
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

export function MobileDateRange({ dateRange, onDateRangeChange, onClose, onProceed, flexibleStart = null, flexibleEnd = null, onFlexibilityChange, minimumDateRange, maximumDateRange }: MobileDateRangeProps) {
  const initialDate = dateRange.start ? new Date(dateRange.start) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [flexibility, setFlexibility] = useState<{
    start: 'exact' | number | null;
    end: 'exact' | number | null;
  }>({
    start: flexibleStart === 0 ? 'exact' : flexibleStart,
    end: flexibleEnd === 0 ? 'exact' : flexibleEnd,
  });

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"];

  const handleDateSelect = (date: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, date);

    // If we don't have a start date yet, set it
    if (!dateRange.start) {
      onDateRangeChange({
        start: selectedDate,
        end: null
      });
      return;
    }

    // If we have both start and end dates
    if (dateRange.start && dateRange.end) {
      // If clicking on start or end date, deselect that date
      if (selectedDate.getTime() === dateRange.start.getTime()) {
        onDateRangeChange({
          start: dateRange.end,
          end: null
        });
        return;
      }
      if (selectedDate.getTime() === dateRange.end.getTime()) {
        onDateRangeChange({
          start: dateRange.start,
          end: null
        });
        return;
      }

      // If before start date, make it new start
      if (selectedDate < dateRange.start) {
        onDateRangeChange({
          start: selectedDate,
          end: dateRange.end
        });
        return;
      }

      // If after end date, make it new end
      if (selectedDate > dateRange.end) {
        onDateRangeChange({
          start: dateRange.start,
          end: selectedDate
        });
        return;
      }

      // If inside the range, make it new start and clear end
      if (selectedDate > dateRange.start && selectedDate < dateRange.end) {
        onDateRangeChange({
          start: selectedDate,
          end: null
        });
        return;
      }
    } else {
      // We only have start date, set end date
      if (selectedDate < dateRange.start) {
        onDateRangeChange({
          start: selectedDate,
          end: dateRange.start
        });
      } else {
        onDateRangeChange({
          start: dateRange.start,
          end: selectedDate
        });
      }
    }
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'MMM d, yyyy');
  };

  const handleClear = () => {
    onDateRangeChange({ start: null, end: null });
    setFlexibility({ start: null, end: null });
    onFlexibilityChange?.({ start: null, end: null });
  };

  return (
    <div className="bg-background rounded-xl p-6">
      <div className="flex flex-col">
        <div className="flex-1">
          <CalendarMonth
            year={currentYear}
            month={currentMonth}
            dateRange={dateRange}
            onDateSelect={handleDateSelect}
            isMobile={true}
            minimumDateRange={minimumDateRange}
            maximumDateRange={maximumDateRange}
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
        <div>
          <h3 className="text-xs mt-3 mb-1">Flexible End Date</h3>
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
  );
}
