import React, { useState } from 'react';
import { format, add, Duration } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

interface CalendarDayProps {
  day: number;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate?: boolean;
  isEndDate?: boolean;
  onClick: () => void;
  isMobile?: boolean;
  isDisabled?: boolean;
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
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"];

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

  const getMonthName = (monthIndex: number) => {
    return new Date(2024, monthIndex).toLocaleString('default', { month: 'short' });
  };

  const isDateDisabled = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    const currentDate = new Date(currentYear, currentMonth, day);
    currentDate.setHours(0, 0, 0, 0); // Normalize the current calendar day

    // Disable past dates
    if (currentDate < today) {
      return true;
    }

    // Existing logic: Disable dates within 30 days *before* the start date if only start is selected
    if (dateRange.start && !dateRange.end) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Normalize start date

      // Don't disable the start date itself
      if (currentDate.getTime() === startDate.getTime()) return false;

      // Disable dates strictly *before* the start date
      if (currentDate < startDate) {
         return true;
      }

      // NEW: Check minimum date range requirement
      if (minimumDateRange) {
        // Calculate the minimum allowed end date
        const minEndDate = add(startDate, minimumDateRange);
        minEndDate.setHours(0, 0, 0, 0); // Normalize min end date

        // Disable dates *before* the minimum required end date
        if (currentDate < minEndDate) {
          return true;
        }
      }

      // NEW: Check maximum date range requirement
      if (maximumDateRange) {
        // Calculate the maximum allowed end date
        const maxEndDate = add(startDate, maximumDateRange);
        maxEndDate.setHours(0, 0, 0, 0); // Normalize max end date

        // Disable dates *after* the maximum allowed end date
        if (currentDate > maxEndDate) {
          return true;
        }
      }
    }

    // If no specific disabling condition met, the date is enabled
    return false;
  };

  return (
    <div className="w-full px-2 py-5">
      <div className="flex w-full items-center justify-between mb-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <div className="font-semibold text-[#3c8787] text-center text-base font-['Poppins',Helvetica]">
          {getMonthName(currentMonth)} {currentYear}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="p-2 rounded-lg"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="overflow-hidden relative" >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentMonth + '-' + currentYear}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction * 100 + '%',
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0
              }),
              center: {
                x: 0,
                position: 'relative',
                width: '100%'
              },
              exit: (direction: number) => ({
                x: direction * -100 + '%',
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="grid grid-cols-7 gap-0 mb-1">
              {weekDays.map(day => (
                <div key={day} className="relative flex-1 h-10 rounded-full flex items-center justify-center">
                  <div className="font-text-sm-medium text-[#344054] text-center">
                    {day}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="relative flex-1 h-10 rounded-full" />
              ))}

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
                    onClick={() => onDateSelect(day, currentMonth, currentYear)}
                    isMobile={isMobile}
                    isDisabled={isDateDisabled(day)}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CalendarDay({ day, isSelected, isInRange, isStartDate, isEndDate, onClick, isMobile, isDisabled }: CalendarDayProps) {
  const selectedDayBgColor = 'bg-[#3c8787]';
  const inRangeBgColor = 'bg-gray-200';

  const hasCompleteRange = isInRange || isEndDate;
  const showRangeBackground = hasCompleteRange && isInRange && !isSelected;
  const showStartBackground = hasCompleteRange && isStartDate && !isEndDate;
  const showEndBackground = hasCompleteRange && isEndDate && !isStartDate;

  return (
    <div className="relative flex-1 h-10 rounded-full flex items-center justify-center">
      <button
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center
          ${isDisabled ? 'cursor-not-allowed' : ''}
        `}
        onClick={onClick}
        disabled={isDisabled}
      >
        <div
          className={`
            text-center z-10
            ${isSelected
              ? `font-text-sm-medium text-white w-10 h-10 rounded-full ${selectedDayBgColor} flex items-center justify-center`
              : `font-text-sm-regular ${
                  isDisabled ? 'text-[#667085]' : 'text-[#344054]'
                }`
            }
          `}
        >
          {day}
        </div>
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
        <Button
          key={`${type}-option-${index}`}
          variant="outline"
          size="sm"
          className={`
            p-2 h-auto rounded border border-solid border-[#6c727e] 
            font-text-paragraph-xsmall-paragraph text-gray-neutral500
            hover:bg-[#3c8787] hover:text-white
            ${currentValue === option.value ? 'bg-[#3c8787] text-white' : ''}
          `}
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
        </Button>
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
    <div className="flex flex-col w-full">
      <div className="flex items-end justify-end relative self-stretch w-full bg-white rounded-xl overflow-hidden border border-solid border-[#eaecf0]">
        <div className="flex flex-col items-end justify-end relative flex-1 grow">
          <div className="flex flex-col items-start relative self-stretch w-full">
            <div className="flex flex-col items-center relative self-stretch w-full">
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
          </div>

          <div className="flex flex-col items-start gap-3 p-4 relative self-stretch w-full border-t border-[#eaecf0]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full">
              <div className="relative self-stretch mt-[-1.00px] font-text-paragraph-xsmall-paragraph text-gray-neutral700">
                Flexible Start Date
              </div>
              <FlexibleDateSelector
                type="start"
                selectedOption={flexibility}
                onSelect={(type, option) => {
                  const updated = { ...flexibility, [type]: option };
                  setFlexibility(updated);
                  onFlexibilityChange?.(updated);
                }}
              />
            </div>

            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full">
              <div className="relative self-stretch mt-[-1.00px] font-text-paragraph-xsmall-paragraph text-gray-neutral700">
                Flexible End Date
              </div>
              <FlexibleDateSelector
                type="end"
                selectedOption={flexibility}
                onSelect={(type, option) => {
                  const updated = { ...flexibility, [type]: option };
                  setFlexibility(updated);
                  onFlexibilityChange?.(updated);
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
