'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '../../brandDialog';
import { BrandButton } from '../brandButton';
import { Input } from '../input';
import { Textarea } from '../textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { InteractiveDatePicker } from './date-range-selector/interactive-date-picker';
import { CalendarIcon, XCircleIcon } from 'lucide-react';
import { ListingUnavailability } from '@prisma/client';
import { format } from 'date-fns';

interface UnavailablePeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface EditUnavailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unavailability: ListingUnavailability | UnavailablePeriod;
  onSave: (updatedUnavailability: ListingUnavailability | UnavailablePeriod) => void;
}

export const EditUnavailabilityDialog: React.FC<EditUnavailabilityDialogProps> = ({
  isOpen,
  onClose,
  unavailability,
  onSave
}) => {
  // Store original values to detect changes
  const [originalValues] = useState({
    startDate: unavailability.startDate,
    endDate: unavailability.endDate,
    reason: unavailability.reason || ""
  });

  const [startDate, setStartDate] = useState<Date>(unavailability.startDate);
  const [endDate, setEndDate] = useState<Date>(unavailability.endDate);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [startDateTouched, setStartDateTouched] = useState(false);
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [reason, setReason] = useState(unavailability.reason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if there are any changes from original values
  const hasChanges = useMemo(() => {
    return (
      startDate.getTime() !== originalValues.startDate.getTime() ||
      endDate.getTime() !== originalValues.endDate.getTime() ||
      reason !== originalValues.reason
    );
  }, [startDate, endDate, reason, originalValues]);

  // Initialize form with current unavailability data
  useEffect(() => {
    if (unavailability) {
      setStartDate(unavailability.startDate);
      setEndDate(unavailability.endDate);
      setStartDateInput(format(unavailability.startDate, "MM/dd/yyyy"));
      setEndDateInput(format(unavailability.endDate, "MM/dd/yyyy"));
      setReason(unavailability.reason || "");
    }
  }, [unavailability]);

  const parseDate = (value: string, isStartDate: boolean, shouldValidate: boolean = false) => {
    if (value === "") {
      if (isStartDate) {
        if (shouldValidate) setStartDateError("");
        setStartDate(new Date());
      } else {
        if (shouldValidate) setEndDateError("");
        setEndDate(new Date());
      }
      return;
    }

    // STEP 1: NORMALIZE for both inputs
    let normalizedValue = value;
    // Convert periods, commas, and hyphens to slashes
    normalizedValue = value.replace(/[.,-]/g, '/');
    // De-duplicate multiple separators
    normalizedValue = normalizedValue.replace(/[\/]+/g, '/');
    
    // ALWAYS update the input display with normalized value immediately
    if (shouldValidate) {
      if (isStartDate) {
        setStartDateInput(normalizedValue);
      } else {
        setEndDateInput(normalizedValue);
      }
    }

    // STEP 2: Try to match and parse the normalized value
    const formats = [
      /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/, // MM/DD/YYYY
      /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{2})$/, // MM/DD/YY
      /^(\d{4})\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/, // YYYY/MM/DD
    ];

    let month: number, day: number, year: number;
    let matched = false;

    for (let i = 0; i < formats.length; i++) {
      const match = normalizedValue.match(formats[i]);
      if (match) {
        if (i === 2) { // YYYY/MM/DD format
          [, year, month, day] = match.map(Number);
        } else {
          [, month, day, year] = match.map(Number);
          // Handle 2-digit years (70+ = 19xx, <70 = 20xx)
          if (year < 100) {
            year += year >= 70 ? 1900 : 2000;
          }
        }
        matched = true;
        break;
      }
    }

    // STEP 3: If matched, create the final normalized display value
    if (matched) {
      const date = new Date(year, month - 1, day);
      
      // Check if the date is valid (handles invalid dates like 02/30/2024)
      if (date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year) {
        // Valid date - update input display with full 4-digit year for both inputs
        if (shouldValidate) {
          const displayDate = format(date, "MM/dd/yyyy");
          if (isStartDate) {
            setStartDateInput(displayDate);
          } else {
            setEndDateInput(displayDate);
          }
        }
        
        if (isStartDate) {
          if (shouldValidate) setStartDateError("");
          setStartDate(date);
        } else {
          if (shouldValidate) setEndDateError("");
          setEndDate(date);
        }
      } else {
        // Invalid date (like 02/30/2024)
        if (shouldValidate) {
          if (isStartDate) {
            setStartDateError("Invalid date format");
          } else {
            setEndDateError("Invalid date format");
          }
        }
      }
    } else {
      // No format match - already showed normalized separators above
      if (shouldValidate) {
        if (isStartDate) {
          setStartDateError("Invalid date format");
        } else {
          setEndDateError("Invalid date format");
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedUnavailability = {
        ...unavailability,
        startDate,
        endDate,
        reason
      };
      
      onSave(updatedUnavailability);
    } catch (error) {
      console.error("Error updating unavailability:", error);
      alert("Failed to update unavailability period");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStartDate(originalValues.startDate);
    setEndDate(originalValues.endDate);
    setStartDateInput(format(originalValues.startDate, "MM/dd/yyyy"));
    setEndDateInput(format(originalValues.endDate, "MM/dd/yyyy"));
    setStartDateError("");
    setEndDateError("");
    setStartDateTouched(false);
    setEndDateTouched(false);
    setReason(originalValues.reason);
  };

  const handleClose = () => {
    if (hasChanges) {
      handleReset();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[467px] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Unavailable Period</h2>
        </div>
        
        <div className="flex-1 space-y-4 min-h-0">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  className={`pr-10 ${
                    startDateTouched && startDateError ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="mm/dd/yyyy"
                  value={startDateInput}
                  onChange={(e) => {
                    setStartDateInput(e.target.value);
                    parseDate(e.target.value, true, false);
                  }}
                  onBlur={() => {
                    setStartDateTouched(true);
                    parseDate(startDateInput, true, true);
                  }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600">
                      <CalendarIcon className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <InteractiveDatePicker
                      selectedDate={startDate}
                      onDateSelect={(date) => {
                        setStartDate(date);
                        setStartDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        setStartDateError("");
                      }}
                      minDate={new Date(2020, 0, 1)}
                      isRangeMode={true}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {startDateTouched && startDateError && (
                <p className="text-red-500 text-sm mt-1">{startDateError}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  className={`pr-10 ${
                    endDateTouched && endDateError ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="mm/dd/yyyy"
                  value={endDateInput}
                  onChange={(e) => {
                    setEndDateInput(e.target.value);
                    parseDate(e.target.value, false, false);
                  }}
                  onBlur={() => {
                    setEndDateTouched(true);
                    parseDate(endDateInput, false, true);
                  }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600">
                      <CalendarIcon className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <InteractiveDatePicker
                      selectedDate={endDate}
                      onDateSelect={(date) => {
                        setEndDate(date);
                        setEndDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        setEndDateError("");
                      }}
                      minDate={startDate || new Date(2020, 0, 1)}
                      isRangeMode={true}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {endDateTouched && endDateError && (
                <p className="text-red-500 text-sm mt-1">{endDateError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <Textarea
              className="resize-none"
              placeholder="e.g Personal use, maintenance, already booked elsewhere..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <BrandButton
            variant={hasChanges ? "outline" : "outline"}
            onClick={hasChanges ? handleReset : handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            {hasChanges ? "Reset" : "Close"}
          </BrandButton>
          <BrandButton
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || !startDate || !endDate}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </BrandButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};