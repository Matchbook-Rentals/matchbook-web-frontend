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
    return currentMonth;
  });
  const [displayYear, setDisplayYear] = useState(() => {
    if (selectedDate) return selectedDate.getFullYear();
    return currentYear;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate years from current year - 1 to current year + 10
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

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

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(displayYear, displayMonth, day);
    if (!isDateDisabled(day)) {
      onDateSelect(selectedDate);
    }
  };

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(prev => prev - 1);
    } else {
      setDisplayMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
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
          className="text-sm px-2 py-1 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900"
        >
          Prev
        </button>
        
        <div className="flex justify-center items-center gap-0">
          <Select value={displayMonth.toString()} onValueChange={(value) => setDisplayMonth(parseInt(value))}>
            <SelectTrigger className="w-fit test-green pr-0 h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
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
          
          <Select value={displayYear.toString()} onValueChange={(value) => setDisplayYear(parseInt(value))}>
            <SelectTrigger className="w-fit test-blue h-8 text-sm border-none shadow-none text-secondaryBrand font-medium">
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
