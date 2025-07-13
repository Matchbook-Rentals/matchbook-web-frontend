"use client";

import React, { useState } from 'react';
import { format, add, Duration, endOfMonth } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
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
  platform?: 'matchbook' | 'other';
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

export interface CalendarMonthProps {
  year: number;
  month: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isPrevDisabled?: boolean;
  bookings?: Booking[];
  unavailablePeriods?: UnavailablePeriod[];
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  className?: string;
  headerClassName?: string;
  gridClassName?: string;
  legendClassName?: string;
  dayClassName?: string;
  dayContainerClassName?: string;
  daySpanClassName?: string;
  useSelectPortal?: boolean;
}

interface CalendarDayProps {
  day: number;
  isBooked: boolean;
  isUnavailable: boolean;
  bookingInfo?: string;
  unavailableReason?: string;
  bookingPlatform?: 'matchbook' | 'other';
  className?: string;
  containerClassName?: string;
  spanClassName?: string;
}

function CalendarDay({ 
  day, 
  isBooked, 
  isUnavailable, 
  bookingInfo, 
  unavailableReason, 
  bookingPlatform = 'matchbook', 
  className, 
  containerClassName, 
  spanClassName,
  isStartOfRange,
  isEndOfRange,
  isInRange,
  rangeType // 'booking' | 'unavailable' | null
}: CalendarDayProps & {
  isStartOfRange?: boolean;
  isEndOfRange?: boolean;
  isInRange?: boolean;
  rangeType?: 'booking' | 'unavailable' | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const getBookedBgColor = () => {
    if (bookingPlatform === 'other') return 'bg-[#00A6E8]';
    return 'bg-secondaryBrand';
  };
  const bookedBgColor = getBookedBgColor();
  const unavailableBgColor = 'bg-[#b2aaaa]';
  
  const getRangeBgColor = () => {
    if (rangeType === 'booking') {
      return bookingPlatform === 'other' ? 'bg-[#00A6E8]/20' : 'bg-secondaryBrand/20';
    }
    return 'bg-[#b2aaaa]/20';
  };
  
  const getDisplayInfo = () => {
    if (isBooked && bookingInfo) return bookingInfo;
    if (isUnavailable && unavailableReason) return unavailableReason;
    return null;
  };

  const showRangeBackground = isInRange && !isStartOfRange && !isEndOfRange;
  const showStartBackground = isStartOfRange && !isEndOfRange;
  const showEndBackground = isEndOfRange && !isStartOfRange;

  const displayInfo = getDisplayInfo();

  const DayButton = (
    <div
      className={cn(
        "aspect-square w-full flex items-center justify-center relative text-sm md:text-base lg:text-lg",
        containerClassName,
        className
      )}
    >
      <span className={cn(
        "z-10 relative",
        (isStartOfRange || isEndOfRange) && isBooked && `rounded-full ${bookedBgColor} text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center`,
        (isStartOfRange || isEndOfRange) && isUnavailable && !isBooked && `rounded-full ${unavailableBgColor} text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center`,
        spanClassName
      )}>
        {day}
      </span>
      {showRangeBackground && (
        <div className={`absolute inset-y-[30%] inset-x-0 transition-colors duration-200 ${getRangeBgColor()}`} />
      )}
      {showStartBackground && (
        <div className={`absolute right-0 left-1/2 inset-y-[30%] transition-colors duration-200 ${getRangeBgColor()}`} />
      )}
      {showEndBackground && (
        <div className={`absolute left-0 right-1/2 inset-y-[30%] transition-colors duration-200 ${getRangeBgColor()}`} />
      )}
    </div>
  );

  // Wrap with popover if there's info to display
  if (displayInfo) {
    return (
      <div
        className={cn(
          "aspect-square w-full flex items-center justify-center relative text-sm md:text-base lg:text-lg",
          containerClassName,
          className
        )}
      >
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <span className={cn(
              "z-10 relative cursor-pointer",
              (isStartOfRange || isEndOfRange) && isBooked && `rounded-full ${bookedBgColor} text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center`,
              (isStartOfRange || isEndOfRange) && isUnavailable && !isBooked && `rounded-full ${unavailableBgColor} text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center`,
              (isInRange && !isStartOfRange && !isEndOfRange && isBooked && bookingPlatform === 'other') && (isOpen ? 'rounded-full bg-[#00A6E8] text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center' : 'hover:rounded-full hover:bg-[#00A6E8] hover:text-white hover:w-9 hover:h-9 md:hover:w-10 md:hover:h-10 lg:hover:w-11 lg:hover:h-11 hover:flex hover:items-center hover:justify-center'),
              (isInRange && !isStartOfRange && !isEndOfRange && isBooked && bookingPlatform === 'matchbook') && (isOpen ? 'rounded-full bg-secondaryBrand text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center' : 'hover:rounded-full hover:bg-secondaryBrand hover:text-white hover:w-9 hover:h-9 md:hover:w-10 md:hover:h-10 lg:hover:w-11 lg:hover:h-11 hover:flex hover:items-center hover:justify-center'),
              (isInRange && !isStartOfRange && !isEndOfRange && isUnavailable && !isBooked) && (isOpen ? 'rounded-full bg-[#b2aaaa] text-white w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center' : 'hover:rounded-full hover:bg-[#b2aaaa] hover:text-white hover:w-9 hover:h-9 md:hover:w-10 md:hover:h-10 lg:hover:w-11 lg:hover:h-11 hover:flex hover:items-center hover:justify-center'),
              spanClassName
            )}>
              {day}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            {displayInfo}
          </PopoverContent>
        </Popover>
        {showRangeBackground && (
          <div className={`absolute inset-y-[30%] inset-x-0 transition-colors duration-200 ${getRangeBgColor()}`} />
        )}
        {showStartBackground && (
          <div className={`absolute right-0 left-1/2 inset-y-[30%] transition-colors duration-200 ${getRangeBgColor()}`} />
        )}
        {showEndBackground && (
          <div className={`absolute left-0 right-1/2 inset-y-[30%] transition-colors duration-200 ${getRangeBgColor()}`} />
        )}
      </div>
    );
  }

  return DayButton;
}

export function CalendarMonth({ year, month, onPrevMonth, onNextMonth, isPrevDisabled, bookings = [], unavailablePeriods = [], onMonthChange, onYearChange, className, headerClassName, gridClassName, legendClassName, dayClassName, dayContainerClassName, daySpanClassName, useSelectPortal }: CalendarMonthProps) {
  const { useSelectPortal: useSelectPortalProp = true } = { useSelectPortal };  // Extract with default value

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
    
    if (!booking) return undefined;
    
    const startDate = format(new Date(booking.startDate), 'MMM d, yyyy');
    const endDate = format(new Date(booking.endDate), 'MMM d, yyyy');
    const name = booking.guestName || 'Unknown Guest';
    
    return (
      <div>
        <div className="font-medium">Booking</div>
        <div><span className="font-medium">Guest:</span> {name}</div>
        <div><span className="font-medium">Dates:</span> {startDate} - {endDate}</div>
      </div>
    );
  };

  const getBookingPlatform = (day: number) => {
    const currentDate = new Date(year, month, day);
    const booking = bookings.find(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return currentDate >= start && currentDate <= end;
    });
    return booking?.platform || 'matchbook';
  };

  const getUnavailableReason = (day: number) => {
    const currentDate = new Date(year, month, day);
    const period = unavailablePeriods.find(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return currentDate >= start && currentDate <= end;
    });
    
    if (!period) return 'Unavailable';
    
    const startDate = format(new Date(period.startDate), 'MMM d, yyyy');
    const endDate = format(new Date(period.endDate), 'MMM d, yyyy');
    const reason = period.reason || 'No reason provided';
    
    return (
      <div>
        <div className="font-medium">Unavailability</div>
        <div><span className="font-medium">Dates:</span> {startDate} - {endDate}</div>
        <div><span className="font-medium">Reason:</span> {reason}</div>
      </div>
    );
  };

  // Helper functions for range visualization
  const isStartOfBookingRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return bookings.some(booking => {
      const start = new Date(booking.startDate);
      return currentDate.toDateString() === start.toDateString();
    });
  };

  const isEndOfBookingRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return bookings.some(booking => {
      const end = new Date(booking.endDate);
      return currentDate.toDateString() === end.toDateString();
    });
  };

  const isInBookingRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return bookings.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return currentDate >= start && currentDate <= end;
    });
  };

  const isStartOfUnavailableRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return unavailablePeriods.some(period => {
      const start = new Date(period.startDate);
      return currentDate.toDateString() === start.toDateString();
    });
  };

  const isEndOfUnavailableRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return unavailablePeriods.some(period => {
      const end = new Date(period.endDate);
      return currentDate.toDateString() === end.toDateString();
    });
  };

  const isInUnavailableRange = (day: number) => {
    const currentDate = new Date(year, month, day);
    return unavailablePeriods.some(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return currentDate >= start && currentDate <= end;
    });
  };

  const getRangeType = (day: number): 'booking' | 'unavailable' | null => {
    if (isInBookingRange(day)) return 'booking';
    if (isInUnavailableRange(day)) return 'unavailable';
    return null;
  };

  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate years from current year - 1 to current year + 10
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

  return (
    <div className={cn("w-full flex-1", className)}>
      {/* Month and Year Display with Navigation */}
      <div className={cn("flex justify-between items-center mb-4", headerClassName)}>
        <button
          onClick={onPrevMonth}
          disabled={isPrevDisabled}
          className={`text-sm px-2 focus:outline-none focus-visible:outline-black py-1 hover:bg-gray-100 rounded-md ${isPrevDisabled
            ? 'text-gray-300 cursor-not-allowed hover:bg-transparent'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Prev
        </button>
        
        <div className="flex items-center gap-2">
          <Select value={month.toString()} onValueChange={(value) => onMonthChange?.(parseInt(value))}>
            <SelectTrigger className="w-fit h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            {useSelectPortalProp ? (
              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  position="popper"
                  className={cn(
                    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
                  )}
                >
                  <ScrollArea className="h-[200px]">
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            ) : (
              <SelectPrimitive.Content
                position="item-aligned"
                className={cn(
                  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                )}
              >
                <ScrollArea className="h-[200px]">
                  {months.map((monthName, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {monthName}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectPrimitive.Content>
            )}
          </Select>
          
          <Select value={year.toString()} onValueChange={(value) => onYearChange?.(parseInt(value))}>
            <SelectTrigger className="w-fit h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            {useSelectPortalProp ? (
              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  position="popper"
                  className={cn(
                    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
                  )}
                >
                  <ScrollArea className="h-[200px]">
                    {years.map((yearOption) => (
                      <SelectItem key={yearOption} value={yearOption.toString()}>
                        {yearOption}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            ) : (
              <SelectPrimitive.Content
                position="item-aligned"
                className={cn(
                  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                )}
              >
                <ScrollArea className="h-[200px]">
                  {years.map((yearOption) => (
                    <SelectItem key={yearOption} value={yearOption.toString()}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectPrimitive.Content>
            )}
          </Select>
        </div>
        
        <button
          onClick={onNextMonth}
          className="text-sm text-gray-600 focus:outline-none focus-visible:outline-black hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded-md"
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
      <div className={cn("grid grid-cols-7 grid-rows-6 gap-y-1 h-[320px]", gridClassName)}>
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
          const bookingPlatform = getBookingPlatform(day);
          const rangeType = getRangeType(day);
          
          const isStartOfRange = rangeType === 'booking' 
            ? isStartOfBookingRange(day) 
            : rangeType === 'unavailable' 
              ? isStartOfUnavailableRange(day) 
              : false;
              
          const isEndOfRange = rangeType === 'booking'
            ? isEndOfBookingRange(day)
            : rangeType === 'unavailable'
              ? isEndOfUnavailableRange(day)
              : false;
              
          const isInRange = rangeType === 'booking'
            ? isInBookingRange(day)
            : rangeType === 'unavailable'
              ? isInUnavailableRange(day)
              : false;
          
          return (
            <CalendarDay
              key={day}
              day={day}
              isBooked={isBooked}
              isUnavailable={isUnavailable}
              bookingInfo={bookingInfo}
              unavailableReason={unavailableReason}
              bookingPlatform={bookingPlatform}
              className={dayClassName}
              containerClassName={dayContainerClassName}
              spanClassName={daySpanClassName}
              isStartOfRange={isStartOfRange}
              isEndOfRange={isEndOfRange}
              isInRange={isInRange}
              rangeType={rangeType}
            />
          );
        })}

        {/* Fill remaining cells to complete 6 rows (42 total cells) */}
        {Array.from({ length: 42 - firstDayOfWeek - daysInMonth }).map((_, index) => (
          <div key={`fill-${index}`} className="aspect-square" />
        ))}
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
    <div className=" rounded-xl pb-6 w-full mx-auto">
      {/* Legend */}
      <div className="w-full  mx-auto mb-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-secondaryBrand rounded-full"></div>
            <span>Matchbook Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00A6E8] rounded-full"></div>
            <span>Off Platform Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#b2aaaa] rounded-full"></div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* Desktop: Two calendars side by side */}
      <div className="hidden xl:flex justify-evenly pt-8 pb-8 lg:px-4 gap-4  w-full mx-auto bg-background rounded-xl overflow-hidden shadow-[0px_0px_5px_#00000029]">
        <div className="flex-1 bg-background px-8 flex flex-col max-w-[800px] ">
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
            dayContainerClassName=""
            daySpanClassName=""
          />
        </div>
        <div className="w-px bg-gray-200"></div>
        <div className="flex-1 bg-background px-8 flex flex-col max-w-[800px]">
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
            dayContainerClassName=""
            daySpanClassName="lg:p-2"
          />
        </div>
      </div>

      {/* Mobile/Tablet: Single calendar */}
      <div className="xl:hidden w-full py-2 rounded-xl bg-background shadow-[0px_0px_5px_#00000029]">
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
          dayContainerClassName=""
          daySpanClassName="p-2"
        />
      </div>
    </div>
  );
}
