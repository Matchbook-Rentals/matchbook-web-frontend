"use client";

import React, { useState } from 'react';
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InteractiveDatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

interface CalendarDayProps {
  day: number;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}

function CalendarDay({ day, isSelected, onClick, isDisabled }: CalendarDayProps) {
  const selectedDayBgColor = 'bg-secondaryBrand';

  return (
    <button
      className={`
        aspect-square w-full flex items-center justify-center text-base relative
        ${!isDisabled ? 'hover:bg-gray-100' : 'cursor-not-allowed'}
        ${isDisabled ? 'text-gray-300' : ''}
      `}
      onClick={onClick}
      disabled={isDisabled}
    >
      <span className={`
        z-10
        ${isSelected ? `rounded-full ${selectedDayBgColor} text-white w-9 h-9 flex items-center justify-center text-base` : ''}
      `}>
        {day}
      </span>
    </button>
  );
}

export function InteractiveDatePicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate
}: InteractiveDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (selectedDate) return selectedDate.getMonth();
    // If we have a maxDate and it's in the past, start with maxDate's month/year
    if (maxDate && maxDate < new Date()) return maxDate.getMonth();
    return currentMonth;
  });
  const [displayYear, setDisplayYear] = useState(() => {
    if (selectedDate) return selectedDate.getFullYear();
    // If we have a maxDate and it's in the past, start with maxDate's year
    if (maxDate && maxDate < new Date()) return maxDate.getFullYear();
    return currentYear;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate years based on minDate and maxDate, or use sensible defaults
  const getYearRange = () => {
    let startYear: number;
    let endYear: number;
    
    if (minDate && maxDate) {
      startYear = minDate.getFullYear();
      endYear = maxDate.getFullYear();
    } else if (minDate) {
      startYear = minDate.getFullYear();
      endYear = currentYear + 10; // Default to 10 years in future if no maxDate
    } else if (maxDate) {
      startYear = currentYear - 10; // Default to 10 years in past if no minDate  
      endYear = maxDate.getFullYear();
    } else {
      // Default range: 10 years in past to 10 years in future
      startYear = currentYear - 10;
      endYear = currentYear + 10;
    }
    
    // Ensure we include the current display year if it's outside the range
    if (displayYear < startYear) startYear = displayYear;
    if (displayYear > endYear) endYear = displayYear;
    
    const yearCount = endYear - startYear + 1;
    return Array.from({ length: yearCount }, (_, i) => startYear + i);
  };
  
  const years = getYearRange();

  // Calculate calendar grid parameters
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    const currentDate = new Date(displayYear, displayMonth, day);
    return currentDate.getTime() === selectedDate.getTime();
  };

  const isDateDisabled = (day: number) => {
    const currentDate = new Date(displayYear, displayMonth, day);
    
    if (minDate && currentDate < minDate) return true;
    if (maxDate && currentDate > maxDate) return true;
    
    return false;
  };

  const isMonthDisabled = (monthIndex: number, year: number) => {
    if (!minDate && !maxDate) return false;
    
    // Check if the entire month is outside the allowed range
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    
    if (minDate && lastDayOfMonth < minDate) return true;
    if (maxDate && firstDayOfMonth > maxDate) return true;
    
    return false;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(displayYear, displayMonth, day);
    if (!isDateDisabled(day)) {
      onDateSelect(selectedDate);
    }
  };

  const canNavigateToPrevMonth = () => {
    const prevMonth = displayMonth === 0 ? 11 : displayMonth - 1;
    const prevYear = displayMonth === 0 ? displayYear - 1 : displayYear;
    
    if (minDate) {
      const firstDayOfPrevMonth = new Date(prevYear, prevMonth, 1);
      const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0);
      return lastDayOfPrevMonth >= minDate;
    }
    return true;
  };

  const canNavigateToNextMonth = () => {
    const nextMonth = displayMonth === 11 ? 0 : displayMonth + 1;
    const nextYear = displayMonth === 11 ? displayYear + 1 : displayYear;
    
    if (maxDate) {
      const firstDayOfNextMonth = new Date(nextYear, nextMonth, 1);
      return firstDayOfNextMonth <= maxDate;
    }
    return true;
  };

  const handlePrevMonth = () => {
    if (!canNavigateToPrevMonth()) return;
    
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(prev => prev - 1);
    } else {
      setDisplayMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canNavigateToNextMonth()) return;
    
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(prev => prev + 1);
    } else {
      setDisplayMonth(prev => prev + 1);
    }
  };

  return (
    <div className="bg-background rounded-xl p-4 w-[320px]">
      {/* Month and Year Display with Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          disabled={!canNavigateToPrevMonth()}
          className={`text-sm px-2 py-1 rounded-md ${
            canNavigateToPrevMonth() 
              ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          Prev
        </button>
        
        <div className="flex justify-center items-center gap-0">
          <Select value={displayMonth.toString()} onValueChange={(value) => setDisplayMonth(parseInt(value))}>
            <SelectTrigger className="w-fit test-green pr-0 h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1002]">
              <ScrollArea className="h-[200px]">
                {months.map((monthName, index) => (
                  <SelectItem 
                    key={index} 
                    value={index.toString()}
                    disabled={isMonthDisabled(index, displayYear)}
                  >
                    {monthName}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          
          <Select value={displayYear.toString()} onValueChange={(value) => setDisplayYear(parseInt(value))}>
            <SelectTrigger className="w-fit test-blue h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1002]">
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
          onClick={handleNextMonth}
          disabled={!canNavigateToNextMonth()}
          className={`text-sm px-2 py-1 rounded-md ${
            canNavigateToNextMonth() 
              ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
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
      <div className="grid grid-cols-7 grid-rows-6 gap-0 h-[240px]">
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
              isDisabled={isDateDisabled(day)}
              onClick={() => handleDateClick(day)}
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
