"use client";

import React, { useState, useEffect } from 'react';
import { format, parse, isValid, isAfter, isBefore } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InteractiveDatePicker } from '@/components/ui/custom-calendar/date-range-selector/interactive-date-picker';
import { cn } from '@/lib/utils';

interface DateInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  isMobile?: boolean;
}

export function DateInput({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  disabled = false,
  error,
  className = "",
  minDate,
  maxDate,
  isMobile = false,
  ...inputProps
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Update input value when prop value changes
  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'MM/dd/yyyy'));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleCalendarSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
    setInputError(null);
  };

  // Auto-format date input with slashes
  const formatDateInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 8 digits (MMDDYYYY)
    const truncated = numbers.slice(0, 8);
    
    // Format with slashes
    if (truncated.length >= 5) {
      return `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
    } else if (truncated.length >= 3) {
      return `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
    } else {
      return truncated;
    }
  };

  // Calculate cursor position after formatting
  const calculateCursorPosition = (oldValue: string, newValue: string, oldCursor: number): number => {
    // Count how many slashes were added before the cursor position
    const oldSlashes = oldValue.slice(0, oldCursor).split('/').length - 1;
    const newSlashes = newValue.slice(0, oldCursor).split('/').length - 1;
    const slashDiff = newSlashes - oldSlashes;
    
    return Math.min(oldCursor + slashDiff, newValue.length);
  };

  // Handle smart backspace for slashes
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;
    
    if (e.key === 'Backspace' && cursorPosition > 0) {
      const charBeforeCursor = value[cursorPosition - 1];
      
      // If we're about to delete a slash, delete the digit before it instead
      if (charBeforeCursor === '/') {
        e.preventDefault();
        const newValue = value.slice(0, cursorPosition - 2) + value.slice(cursorPosition);
        const formatted = formatDateInput(newValue);
        setInputValue(formatted);
        setInputError(null);
        
        // Position cursor after the deletion
        setTimeout(() => {
          if (input.setSelectionRange) {
            const newPos = Math.max(0, cursorPosition - 2);
            input.setSelectionRange(newPos, newPos);
          }
        }, 0);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    
    // Format the value
    const formatted = formatDateInput(value);
    
    // Calculate new cursor position
    const newCursorPos = calculateCursorPosition(value, formatted, cursorPosition);
    
    // Update state
    setInputValue(formatted);
    setInputError(null);
    
    // Restore cursor position after React re-render
    setTimeout(() => {
      if (input.setSelectionRange) {
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle paste events to format pasted content
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatDateInput(pastedText);
    setInputValue(formatted);
    setInputError(null);
  };

  // Validate and parse a complete date
  const validateAndParseDate = (dateString: string) => {
    if (!dateString.trim()) {
      onChange(null);
      setInputError(null);
      return;
    }

    // Only validate if we have a complete date (8 digits)
    const numbersOnly = dateString.replace(/\D/g, '');
    if (numbersOnly.length < 8) {
      setInputError(null); // Don't show error for incomplete dates
      return;
    }

    // Try to parse the input as MM/dd/yyyy
    const parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
    
    if (!isValid(parsedDate)) {
      setInputError("Please enter a valid date (MM/DD/YYYY)");
      return;
    }

    // Check if date is within allowed range
    if (minDate && isBefore(parsedDate, minDate)) {
      setInputError(`Date must be after ${format(minDate, 'MM/dd/yyyy')}`);
      return;
    }

    if (maxDate && isAfter(parsedDate, maxDate)) {
      setInputError(`Date must be before ${format(maxDate, 'MM/dd/yyyy')}`);
      return;
    }

    // Valid date - update the value
    onChange(parsedDate);
    setInputError(null);
  };

  const handleInputBlur = () => {
    validateAndParseDate(inputValue);
  };

  // Add real-time validation for complete dates
  const handleInputChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    
    // If user has typed a complete date (8 digits), validate it immediately
    const numbersOnly = e.target.value.replace(/\D/g, '');
    if (numbersOnly.length === 8) {
      setTimeout(() => validateAndParseDate(formatDateInput(e.target.value)), 100);
    }
  };

  // Convert Date to HTML date format (YYYY-MM-DD) for mobile
  const toHtmlDate = (date: Date | null): string => {
    if (!date) return "";
    return format(date, 'yyyy-MM-dd');
  };

  // Convert HTML date format to Date object
  const fromHtmlDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = fromHtmlDate(e.target.value);
    onChange(date);
  };

  const displayError = error || inputError;

  return (
    <div className="relative w-full">
      {/* Desktop Version */}
      <div className="hidden md:block relative">
        <Input
          {...inputProps}
          value={inputValue}
          onChange={handleInputChangeWithValidation}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10", // Space for calendar icon
            displayError ? "border-red-500 focus-visible:ring-red-500" : "",
            className
          )}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[1001]" align="center">
            <InteractiveDatePicker
              selectedDate={value || undefined}
              onDateSelect={handleCalendarSelect}
              minDate={minDate}
              maxDate={maxDate}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden">
        <input
          {...inputProps}
          type="date"
          value={toHtmlDate(value)}
          onChange={handleNativeDateChange}
          min={minDate ? toHtmlDate(minDate) : undefined}
          max={maxDate ? toHtmlDate(maxDate) : undefined}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            !value && "text-muted-foreground",
            displayError ? "border-red-500 focus-visible:ring-red-500" : "",
            className
          )}
        />
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="text-red-500 text-sm mt-1">{displayError}</div>
      )}
    </div>
  );
}