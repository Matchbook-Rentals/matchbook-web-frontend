import React, { useState } from 'react';
import { format, add, Duration } from "date-fns"; // Import add and Duration
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  minimumDateRange?: Duration | null; // Add minimumDateRange prop
}

interface CalendarMonthProps {
  year: number;
  month: number;
  dateRange: DateRange;
  onDateSelect: (day: number, month: number, year: number) => void;
  isMobile?: boolean;
  minimumDateRange?: Duration | null; // Add minimumDateRange prop
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

function CalendarMonth({ year: initialYear, month: initialMonth, dateRange, onDateSelect, isMobile }: CalendarMonthProps) {
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
    }

    // If no specific disabling condition met, the date is enabled
    return false;
  };

  return (
    <div className="w-full px-2 ">
      <div className="flex justify-between items-center mt-1 mb-2 h-12">
        <button
          onClick={handlePreviousMonth}
          className="h-full px-4 text-gray-600 hover:text-gray-800"
        >
          Prev
        </button>
        <h2 className="text-base font-medium">{getMonthName(currentMonth)} {currentYear}</h2>
        <button
          onClick={handleNextMonth}
          className="h-full px-4 text-gray-600 hover:text-gray-800"
        >
          Next
        </button>
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
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7  gap-0">
              {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square text-xs text-gray-400" />
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
  const hasCompleteRange = isInRange || isEndDate;
  const showRangeBackground = hasCompleteRange && isInRange && !isSelected;
  const showStartBackground = hasCompleteRange && isStartDate && !isEndDate;
  const showEndBackground = hasCompleteRange && isEndDate && !isStartDate;

  return (
    <button
      className={`
        aspect-square w-full flex items-center justify-center
        ${isMobile ? 'text-sm py-1' : 'text-xs hover:bg-gray-100'}
        relative
        touch-manipulation
        ${isDisabled ? 'cursor-not-allowed' : ''}
      `}
      onClick={onClick}
      disabled={isDisabled}
    >
      <span className={`
        z-10
        ${isSelected ? 'rounded-full bg-[#4f4f4f] text-white w-9 h-9 flex items-center justify-center' : ''}
        ${isDisabled && !isSelected ? 'text-gray-300' : ''}
      `}>
        {day}
      </span>
      {showRangeBackground && (
        <div className="absolute" style={{
          left: 0,
          right: 0,
          height: '25px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#5C9AC533'
        }} />
      )}
      {showStartBackground && (
        <div className="absolute" style={{
          left: '50%',
          right: 0,
          height: '25px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#5C9AC533'
        }} />
      )}
      {showEndBackground && (
        <div className="absolute" style={{
          left: 0,
          right: '50%',
          height: '25px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#5C9AC533'
        }} />
      )}
    </button>
  );
}

function FlexibleDateSelector({ type, selectedOption, onSelect }: FlexibleSelectorProps) {
  const flexibleDays = [1, 3, 5, 7, 14];
  const currentValue = type === 'start' ? selectedOption.start : selectedOption.end;

  const handleOptionSelect = (option: 'exact' | number) => {
    onSelect(type, currentValue === option ? null : option);
  };

  return (
    <div className="flex gap-1 font-montserrat-light flex-wrap ">
      <button
        className={`
                    px-3 py-1 text-sm rounded-full border-2
                    ${currentValue === 'exact'
            ? 'border-[#404040]'
            : 'border-gray-200'}
                `}
        onClick={() => handleOptionSelect('exact')}
      >
        Exact dates
      </button>
      {flexibleDays.map(days => (
        <button
          key={days}
          className={` px-4 py-1 text-sm flex items-center gap-1 rounded-full
            border-2 ${currentValue === days ? 'border-[#404040]' : 'border-gray-200'} `}
          onClick={() => handleOptionSelect(days)}
        >
          &#177;{days}
        </button>
      ))}
    </div>
  );
}

export function MobileDateRange({ dateRange, onDateRangeChange, onClose, onProceed, flexibleStart = null, flexibleEnd = null, onFlexibilityChange, minimumDateRange }: MobileDateRangeProps) { // Destructure minimumDateRange
  // If a start date is provided, open the calendar at that month/year, otherwise use today's date.
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
      <div className="mb-6">
        <div className="px-0">
          <CalendarMonth
            year={currentYear}
            month={currentMonth}
            dateRange={dateRange}
            onDateSelect={handleDateSelect}
            isMobile={true}
            minimumDateRange={minimumDateRange} // Pass prop down
          />
        </div>

        <div className="px-3 space-y-4">
          <div>
            <h3 className="text-xs mb-1">Flexible Start Date</h3>
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
          <div>
            <h3 className="text-xs mb-1">Flexible End Date</h3>
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

        <div className="px-3 mt-4">
          <div className="flex gap-x-4">
            <button
              onClick={handleClear}
              className="flex-1 px-2 py-2 text-sm rounded-full border-2 border-gray-200 hover:bg-gray-100"
            >
              Clear
            </button>
            <button
              onClick={onProceed}
              className="flex-1 bg-[#404040]/90 hover:bg-[#404040] text-white rounded-full py-2 text-sm"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
