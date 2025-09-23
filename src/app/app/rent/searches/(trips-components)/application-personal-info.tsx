import React, { useRef, useCallback, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles, ApplicationItemInputStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { BrandCheckbox } from "@/app/brandCheckbox";
import { format } from 'date-fns';
import { CalendarIcon } from "@radix-ui/react-icons";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PersonalInfoProps {
  inputClassName?: string;
  isMobile?: boolean;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ inputClassName, isMobile = false }) => {
  const { 
    personalInfo, 
    setPersonalInfo, 
    errors, 
    fieldErrors,
    saveField,
    validateField,
    setFieldError,
    clearFieldError,
    isApplicationComplete 
  } = useApplicationStore();
  const error = errors.basicInfo.personalInfo;
  const { toast } = useToast();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // State for calendar month/year navigation
  const currentDate = personalInfo.dateOfBirth ? 
    (() => {
      if (typeof personalInfo.dateOfBirth === 'string') {
        const [year, month, day] = personalInfo.dateOfBirth.split('T')[0].split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (personalInfo.dateOfBirth instanceof Date) {
        // Handle Date objects from database - use UTC components
        const utcYear = personalInfo.dateOfBirth.getUTCFullYear();
        const utcMonth = personalInfo.dateOfBirth.getUTCMonth();
        const utcDay = personalInfo.dateOfBirth.getUTCDate();
        return new Date(utcYear, utcMonth, utcDay);
      }
      return new Date(personalInfo.dateOfBirth);
    })() : new Date();
  
  const [calendarMonth, setCalendarMonth] = useState(currentDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(currentDate.getFullYear());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Generate month names and year range
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => currentYear - 120 + i).reverse(); // 120 years back from current year
  
  // Debug logging for date of birth value on load
  if (isDevelopment && personalInfo.dateOfBirth) {
    console.log('[PersonalInfo] Date of Birth on load:', {
      storedValue: personalInfo.dateOfBirth,
      typeOfValue: typeof personalInfo.dateOfBirth,
      parsedDate: typeof personalInfo.dateOfBirth === 'string' ? 
        new Date(personalInfo.dateOfBirth) : personalInfo.dateOfBirth,
      displayDate: typeof personalInfo.dateOfBirth === 'string' ? 
        personalInfo.dateOfBirth.split('T')[0] : 'not a string'
    });
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldPath = `personalInfo.${name}`;
    
    // Check completion status before update
    const wasComplete = isApplicationComplete();
    
    // Update state immediately
    setPersonalInfo({
      ...personalInfo,
      [name]: value
    });
    
    // Validate immediately
    const validationError = validateField(fieldPath, value);
    if (validationError) {
      setFieldError(fieldPath, validationError);
      if (isDevelopment) {
        console.log(`[PersonalInfo] Validation error for ${fieldPath}:`, validationError);
      }
    } else {
      clearFieldError(fieldPath);
      if (isDevelopment) {
        console.log(`[PersonalInfo] Field ${fieldPath} validated successfully (no auto-save)`);
      }
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setPersonalInfo({
      ...personalInfo,
      noMiddleName: checked,
      // Clear middleName if noMiddleName is checked
      ...(checked ? { middleName: '' } : {})
    });
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      // Create a date at noon to avoid UTC offset issues
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      const formattedDate = format(localDate, 'yyyy-MM-dd');
      
      if (isDevelopment) {
        console.log('[PersonalInfo] Date selected:', {
          originalDate: date,
          originalDateString: date.toString(),
          localDate: localDate,
          localDateString: localDate.toString(),
          formattedDate: formattedDate,
          year: date.getFullYear(),
          month: date.getMonth() + 1, // +1 for human readable month
          day: date.getDate()
        });
      }
      
      const fieldPath = 'personalInfo.dateOfBirth';
      
      // Update state immediately
      setPersonalInfo({
        ...personalInfo,
        dateOfBirth: formattedDate
      });
      
      // Validate immediately
      const validationError = validateField(fieldPath, formattedDate);
      if (validationError) {
        setFieldError(fieldPath, validationError);
        if (isDevelopment) {
          console.log(`[PersonalInfo] Validation error for ${fieldPath}:`, validationError);
          toast({
            title: "Validation Error",
            description: validationError,
            variant: "destructive",
            duration: 4000,
          });
        }
      } else {
        clearFieldError(fieldPath);
        if (isDevelopment) {
          console.log(`[PersonalInfo] Date ${fieldPath} validated successfully (no auto-save)`);
        }
        // Close calendar after successful validation
        setCalendarOpen(false);
      }
    }
  };


  const formFields = [
    { label: "First Name", placeholder: "Enter First Name" },
    { label: "Last Name", placeholder: "Enter Last Name" },
    { label: "Middle Name", placeholder: "Enter Middle Name" },
    { label: "Date of Birth", placeholder: "Select Date of Birth" },
  ];

  return (
    <>
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[0].label}
                </Label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <Input
                name="firstName"
                value={personalInfo.firstName}
                onChange={handleInputChange}
                className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                placeholder={formFields[0].placeholder}
              />
              {(fieldErrors['personalInfo.firstName'] || error?.firstName) && 
                <p className="mt-1 text-red-500 text-sm">{fieldErrors['personalInfo.firstName'] || error.firstName}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                {formFields[1].label}
              </Label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <Input
              name="lastName"
              value={personalInfo.lastName}
              onChange={handleInputChange}
              className={inputClassName || "flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400"}
              placeholder={formFields[1].placeholder}
            />
            {(fieldErrors['personalInfo.lastName'] || error?.lastName) && 
              <p className="mt-1 text-red-500 text-sm">{fieldErrors['personalInfo.lastName'] || error.lastName}</p>}
          </div>
        </div>
      </div>

      <div className={`flex-[0_0_auto] flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-5'} relative self-stretch w-full`}>
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[2].label}
                </Label>
              </div>
              <Input
                name="middleName"
                value={personalInfo.middleName || ''}
                onChange={handleInputChange}
                disabled={personalInfo.noMiddleName}
                className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                placeholder={formFields[2].placeholder}
              />
              {(fieldErrors['personalInfo.middleName'] || error?.middleName) && 
                <p className="mt-1 text-red-500 text-sm">{fieldErrors['personalInfo.middleName'] || error.middleName}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-[22px] pb-0 px-0 relative flex-1 grow">
          <BrandCheckbox
            name="noMiddleName"
            checked={personalInfo.noMiddleName}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            label="No Middle Name"
          />
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[3].label}
                </Label>
              </div>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full ${isMobile ? 'py-3' : 'h-12 py-2'} justify-between bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs px-3 font-normal hover:bg-white`}
                >
                  <span className={personalInfo.dateOfBirth ? "text-gray-900" : "text-gray-400"}>
                    {personalInfo.dateOfBirth ? 
                      (() => {
                        if (typeof personalInfo.dateOfBirth === 'string') {
                          const [year, month, day] = personalInfo.dateOfBirth.split('T')[0].split('-');
                          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        } else if (personalInfo.dateOfBirth instanceof Date) {
                          // Handle Date objects from database - extract UTC date components
                          const utcYear = personalInfo.dateOfBirth.getUTCFullYear();
                          const utcMonth = personalInfo.dateOfBirth.getUTCMonth();
                          const utcDay = personalInfo.dateOfBirth.getUTCDate();
                          return new Date(utcYear, utcMonth, utcDay, 12, 0, 0).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        } else {
                          return format(personalInfo.dateOfBirth, 'MMMM d, yyyy');
                        }
                      })()
                      : formFields[3].placeholder}
                  </span>
                  <CalendarIcon className="w-5 h-5 text-[#667085]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-3" align="start" sideOffset={5}>
                <div className="space-y-3">
                  {/* Month and Year Selectors */}
                  <div className="flex gap-2">
                    <Select 
                      value={calendarMonth.toString()} 
                      onValueChange={(value) => setCalendarMonth(parseInt(value))}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm font-medium text-secondaryBrand">
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
                    
                    <Select 
                      value={calendarYear.toString()} 
                      onValueChange={(value) => setCalendarYear(parseInt(value))}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-sm font-medium text-secondaryBrand">
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
                  
                  {/* Calendar */}
                  <div className="w-full">
                    <Calendar
                      mode="single"
                      month={new Date(calendarYear, calendarMonth)}
                      onMonthChange={(date) => {
                        setCalendarMonth(date.getMonth());
                        setCalendarYear(date.getFullYear());
                      }}
                      selected={personalInfo.dateOfBirth ? 
                        (() => {
                          if (typeof personalInfo.dateOfBirth === 'string') {
                            const [year, month, day] = personalInfo.dateOfBirth.split('T')[0].split('-');
                            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                          } else if (personalInfo.dateOfBirth instanceof Date) {
                            // Handle Date objects from database - use UTC components
                            const utcYear = personalInfo.dateOfBirth.getUTCFullYear();
                            const utcMonth = personalInfo.dateOfBirth.getUTCMonth();
                            const utcDay = personalInfo.dateOfBirth.getUTCDate();
                            return new Date(utcYear, utcMonth, utcDay, 12, 0, 0);
                          }
                          return new Date(personalInfo.dateOfBirth);
                        })()
                        : undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                      classNames={{
                        day_selected: "bg-secondaryBrand text-primary-foreground hover:bg-secondaryBrand hover:text-primary-foreground focus:bg-secondaryBrand focus:text-primary-foreground",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-4 w-full",
                        caption: "hidden", // Hide the default caption with month/year
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-around",
                        head_cell: "text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]",
                        row: "flex w-full mt-2 justify-around",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                      }}
                      className="rounded-md border w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {(fieldErrors['personalInfo.dateOfBirth'] || error?.dateOfBirth) && 
              <p className="mt-1 text-red-500 text-sm">{fieldErrors['personalInfo.dateOfBirth'] || error.dateOfBirth}</p>}
          </div>
        </div>
        
        {/* Spacer div to maintain layout */}
        <div className="flex-1 grow"></div>
      </div>

    </>
  );
};
