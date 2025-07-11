"use client";

import React, { useState } from 'react';
import { format, add, Duration, endOfMonth } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface Booking {
  id: string;
  startDate: Date;
  endDate: Date;
  guestName?: string;
  status?: string;
}

interface UnavailablePeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface DesktopScheduleViewerProps {
  bookings?: Booking[];
  unavailablePeriods?: UnavailablePeriod[];
}

interface CalendarMonthProps {
  year: number;
  month: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isPrevDisabled?: boolean;
  bookings?: Booking[];
  unavailablePeriods?: UnavailablePeriod[];
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
}

interface CalendarDayProps {
  day: number;
  isBooked: boolean;
  isUnavailable: boolean;
  bookingInfo?: string;
  unavailableReason?: string;
}

function CalendarDay({ day, isBooked, isUnavailable, bookingInfo, unavailableReason }: CalendarDayProps) {
  const bookedBgColor = 'bg-blue-500';
  const unavailableBgColor = 'bg-red-500';
  
  const getDisplayInfo = () => {
    if (isBooked && bookingInfo) return bookingInfo;
    if (isUnavailable && unavailableReason) return unavailableReason;
    return null;
  };

  const DayButton = (
    <div
      className={`
        aspect-square w-full flex items-center justify-center text-base relative
        ${isBooked ? 'bg-blue-100' : ''}
        ${isUnavailable ? 'bg-red-100' : ''}
      `}
    >
      <span className={`
        z-10
        ${isBooked ? `rounded-full ${bookedBgColor} text-white w-9 h-9 flex items-center justify-center text-base` : ''}
        ${isUnavailable && !isBooked ? `rounded-full ${unavailableBgColor} text-white w-9 h-9 flex items-center justify-center text-base` : ''}
      `}>
        {day}
      </span>
    </div>
  );

  const displayInfo = getDisplayInfo();
  
  // Wrap with tooltip if there's info to display
  if (displayInfo) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{DayButton}</TooltipTrigger>
          <TooltipContent>
            <p>{displayInfo}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return DayButton;
}

function CalendarMonth({ year, month, onPrevMonth, onNextMonth, isPrevDisabled, bookings = [], unavailablePeriods = [], onMonthChange, onYearChange }: CalendarMonthProps) {
  // Calculate calendar grid parameters
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Helper functions for checking dates
  const isDateBooked = (day: number) => {
    const currentDate = new Date(year, month, day);
    return bookings.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return currentDate >= start && currentDate <= end;
    });
  };

  const isDateUnavailable = (day: number) => {
    const currentDate = new Date(year, month, day);
    return unavailablePeriods.some(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return currentDate >= start && currentDate <= end;
    });
  };

  const getBookingInfo = (day: number) => {
    const currentDate = new Date(year, month, day);
    const booking = bookings.find(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return currentDate >= start && currentDate <= end;
    });
    return booking ? `Booked by ${booking.guestName || 'Guest'}` : undefined;
  };

  const getUnavailableReason = (day: number) => {
    const currentDate = new Date(year, month, day);
    const period = unavailablePeriods.find(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return currentDate >= start && currentDate <= end;
    });
    return period?.reason || 'Unavailable';
  };

  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate years from current year - 1 to current year + 10
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

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
        
        <div className="flex items-center gap-2">
          <Select value={month.toString()} onValueChange={(value) => onMonthChange?.(parseInt(value))}>
            <SelectTrigger className="w-[120px] h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {months.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          
          <Select value={year.toString()} onValueChange={(value) => onYearChange?.(parseInt(value))}>
            <SelectTrigger className="w-[80px] h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
        
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

      {/* Calendar Grid - Fixed height for 6 rows */}
      <div className="grid grid-cols-7 grid-rows-6 gap-0 h-[300px]">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isBooked = isDateBooked(day);
          const isUnavailable = isDateUnavailable(day);
          const bookingInfo = getBookingInfo(day);
          const unavailableReason = getUnavailableReason(day);
          
          return (
            <CalendarDay
              key={day}
              day={day}
              isBooked={isBooked}
              isUnavailable={isUnavailable}
              bookingInfo={bookingInfo}
              unavailableReason={unavailableReason}
            />
          );
        })}

        {/* Fill remaining cells to complete 6 rows (42 total cells) */}
        {Array.from({ length: 42 - firstDayOfWeek - daysInMonth }).map((_, index) => (
          <div key={`fill-${index}`} className="aspect-square" />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}

export function DesktopScheduleViewer({
  bookings = [],
  unavailablePeriods = []
}: DesktopScheduleViewerProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [leftMonth, setLeftMonth] = useState(currentMonth);
  const [leftYear, setLeftYear] = useState(currentYear);
  const [rightMonth, setRightMonth] = useState(() => {
    return currentMonth === 11 ? 0 : currentMonth + 1;
  });
  const [rightYear, setRightYear] = useState(() => {
    return currentMonth === 11 ? currentYear + 1 : currentYear;
  });

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

  const handleLeftMonthChange = (newMonth: number) => {
    setLeftMonth(newMonth);
    // If left calendar would overlap with right, push right forward
    if (newMonth === rightMonth && leftYear === rightYear) {
      if (rightMonth === 11) {
        setRightMonth(0);
        setRightYear(prev => prev + 1);
      } else {
        setRightMonth(prev => prev + 1);
      }
    }
  };

  const handleLeftYearChange = (newYear: number) => {
    setLeftYear(newYear);
    // If left calendar would overlap with right, push right forward
    if (leftMonth === rightMonth && newYear === rightYear) {
      if (rightMonth === 11) {
        setRightMonth(0);
        setRightYear(prev => prev + 1);
      } else {
        setRightMonth(prev => prev + 1);
      }
    }
  };

  const handleRightMonthChange = (newMonth: number) => {
    setRightMonth(newMonth);
    // Ensure right calendar is after left calendar
    const leftDate = new Date(leftYear, leftMonth);
    const newRightDate = new Date(rightYear, newMonth);
    if (newRightDate <= leftDate) {
      // Move left calendar back
      if (leftMonth === 0) {
        setLeftMonth(11);
        setLeftYear(prev => prev - 1);
      } else {
        setLeftMonth(prev => prev - 1);
      }
    }
  };

  const handleRightYearChange = (newYear: number) => {
    setRightYear(newYear);
    // Ensure right calendar is after left calendar
    const leftDate = new Date(leftYear, leftMonth);
    const newRightDate = new Date(newYear, rightMonth);
    if (newRightDate <= leftDate) {
      // Move left calendar back
      if (leftMonth === 0) {
        setLeftMonth(11);
        setLeftYear(prev => prev - 1);
      } else {
        setLeftMonth(prev => prev - 1);
      }
    }
  };

  return (
    <div className=" rounded-xl p-6 w-full max-w-[1260px] mx-auto">
      {/* Desktop: Two calendars side by side */}
      <div className="hidden md:flex justify-between w-full gap-4">
        <div className="flex-1 bg-background p-4 flex flex-col rounded-xl max-w-[530px] shadow-[0px_0px_5px_#00000029]">
          <CalendarMonth
            year={leftYear}
            month={leftMonth}
            onPrevMonth={handleLeftPrevMonth}
            onNextMonth={handleLeftNextMonth}
            isPrevDisabled={isCurrentMonth(leftMonth, leftYear)}
            bookings={bookings}
            unavailablePeriods={unavailablePeriods}
            onMonthChange={handleLeftMonthChange}
            onYearChange={handleLeftYearChange}
          />
        </div>
        <div className="flex-1 bg-background p-4 flex flex-col rounded-xl max-w-[530px] shadow-[0px_0px_5px_#00000029]">
          <CalendarMonth
            year={rightYear}
            month={rightMonth}
            onPrevMonth={handleRightPrevMonth}
            onNextMonth={handleRightNextMonth}
            isPrevDisabled={
              new Date(rightYear, rightMonth - 1) <= new Date(leftYear, leftMonth)
            }
            bookings={bookings}
            unavailablePeriods={unavailablePeriods}
            onMonthChange={handleRightMonthChange}
            onYearChange={handleRightYearChange}
          />
        </div>
      </div>

      {/* Mobile/Tablet: Single calendar */}
      <div className="md:hidden w-full">
        <CalendarMonth
          year={leftYear}
          month={leftMonth}
          onPrevMonth={handleLeftPrevMonth}
          onNextMonth={handleLeftNextMonth}
          isPrevDisabled={isCurrentMonth(leftMonth, leftYear)}
          bookings={bookings}
          unavailablePeriods={unavailablePeriods}
          onMonthChange={handleLeftMonthChange}
          onYearChange={handleLeftYearChange}
        />
      </div>
    </div>
  );
}
