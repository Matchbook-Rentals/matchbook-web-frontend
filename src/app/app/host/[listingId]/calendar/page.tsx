"use client";

import { CalendarIcon, XCircleIcon } from "lucide-react";
import React, { useState } from "react";
import { addUnavailability } from "@/app/actions/listings";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { DesktopScheduleViewer } from "@/components/ui/custom-calendar/date-range-selector/desktop-schedule-viewer";
import { HostPageTitle } from "../(components)/host-page-title";
import { useListingDashboard } from "../listing-dashboard-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InteractiveDatePicker } from "@/components/ui/custom-calendar/date-range-selector/interactive-date-picker";
import { format } from "date-fns";

export const Body = (): JSX.Element => {
  const { data, addUnavailability: addUnavailabilityToContext } = useListingDashboard();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [startDateTouched, setStartDateTouched] = useState(false);
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseDate = (value: string, isStartDate: boolean, shouldValidate: boolean = false) => {
    if (value === "") {
      if (isStartDate) {
        if (shouldValidate) setStartDateError("");
        setStartDate(undefined);
      } else {
        if (shouldValidate) setEndDateError("");
        setEndDate(undefined);
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
            setStartDate(undefined);
          } else {
            setEndDateError("Invalid date format");
            setEndDate(undefined);
          }
        }
      }
    } else {
      // No format match - already showed normalized separators above
      
      if (shouldValidate) {
        if (isStartDate) {
          setStartDateError("Invalid date format");
          setStartDate(undefined);
        } else {
          setEndDateError("Invalid date format");
          setEndDate(undefined);
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
      const unavailability = await addUnavailability(data.listing.id, startDate, endDate, reason);
      addUnavailabilityToContext(unavailability);
      // Clear form
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    } catch (error) {
      console.error("Error adding unavailability:", error);
      alert("Failed to add unavailability period");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStartDateInput("");
    setEndDateInput("");
    setStartDateError("");
    setEndDateError("");
    setStartDateTouched(false);
    setEndDateTouched(false);
    setReason("");
  };
  
  return (
    <div className="flex flex-col w-full items-start">
      <HostPageTitle 
        title="Calendar Management" 
        subtitle={`Manage availability for ${data.listing.streetAddress1 || data.listing.title || 'your listing'}`} 
      />
      <section className="flex flex-col items-start gap-6 px-0 py-0 self-stretch w-full bg-[#f9f9f9]">

        {/* Calendar Schedule Viewer */}
        <div className=" pb-8 w-full">
          <DesktopScheduleViewer
            bookings={data.bookings}
            unavailablePeriods={data.listing.unavailablePeriods || []}
          />
        </div>

        <div className="flex flex-col items-start gap-[18px] self-stretch w-full">
          <div className="flex flex-col items-start gap-6 self-stretch w-full">
            <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl p-2  overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-end justify-center gap-6 w-full">
                  <div className="flex flex-col items-start gap-8 p-0 w-full rounded-xl">
                    <div className="flex flex-col items-start gap-5 w-full">
                      <h2 className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-[normal]">
                        Block Unavailable Dates
                      </h2>

                      <div className="flex items-start gap-5 w-full">
                        <div className="flex flex-col items-start gap-1.5 flex-1">
                          <div className="flex flex-col items-start gap-1.5 w-full">
                            <div className="inline-flex items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5">
                                <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                  Start Date
                                </span>
                              </label>
                              <span className="text-red-500 w-[5.2px] h-1.5">
                                *
                              </span>
                            </div>
                            <div className="relative w-full">
                              <Input
                                className={`h-12 w-full pr-10 bg-sidebar focus:outline-none focus:ring-2 focus:border-black ${
                                  startDateTouched && startDateError ? "focus:ring-red-500 ring-red-500 border-red-500" : "focus:ring-black"
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
                        </div>

                        <div className="flex flex-col items-start gap-1.5 flex-1">
                          <div className="flex flex-col items-start gap-1.5 w-full">
                            <div className="inline-flex items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5">
                                <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                  End Date
                                </span>
                              </label>
                              <span className="text-red-500 w-[5.2px] h-1.5">
                                *
                              </span>
                            </div>
                            <div className="relative w-full">
                              <Input
                                className={`h-12 w-full pr-10 bg-sidebar focus:outline-none focus:ring-2 focus:border-blue-500 transition-all duration-200 ${
                                  endDateTouched && endDateError ? "focus:ring-red-500 ring-red-500 border-red-500" : "focus:ring-blue-500"
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
                      </div>

                      <div className="flex flex-col h-[149px] items-start gap-1.5 w-full">
                        <div className="flex flex-col items-start gap-1.5 flex-1 w-full">
                          <div className="inline-flex items-center gap-1.5">
                            <label className="inline-flex items-center gap-1.5">
                              <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                Reason
                              </span>
                            </label>
                          </div>
                          <Textarea
                            className="flex-1 w-full resize-none bg-sidebar"
                            placeholder="e.g Personal use, maintenance, already booked elsewhere..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-3">
                    <BrandButton
                      variant="outline"
                      className="pl-3 pr-2 min-w-0"
                      rightIcon={<XCircleIcon className="w-5 h-5 ml-[2px] " />}
                      onClick={handleClear}
                      disabled={isSubmitting}
                    >
                      Clear
                    </BrandButton>

                    <BrandButton 
                      variant="default"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !startDate || !endDate}
                    >
                      {isSubmitting ? "Adding..." : "Add Unavailability"}
                    </BrandButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function CalendarPage() {
  return (
    <div className={HOST_PAGE_STYLE}>
      <Body />
    </div>
  );
}
