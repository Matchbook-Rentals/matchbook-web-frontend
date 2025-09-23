import React, { useRef, useCallback, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles, ApplicationItemInputStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { BrandCheckbox } from "@/app/brandCheckbox";
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";

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
  
  // Helper function to convert stored date to Date object
  const convertStoredDateToDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'string') {
      const [year, month, day] = dateValue.split('T')[0].split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateValue instanceof Date) {
      // Handle Date objects from database - use UTC components
      const utcYear = dateValue.getUTCFullYear();
      const utcMonth = dateValue.getUTCMonth();
      const utcDay = dateValue.getUTCDate();
      return new Date(utcYear, utcMonth, utcDay);
    }
    
    return new Date(dateValue);
  };
  
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

  const handleDateSelect = async (date: Date | null) => {
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
        // No need to close calendar - DateOfBirthPicker handles this
      }
    } else {
      // Handle clearing the date
      const fieldPath = 'personalInfo.dateOfBirth';
      setPersonalInfo({
        ...personalInfo,
        dateOfBirth: null
      });
      clearFieldError(fieldPath);
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
            <DateOfBirthPicker
              value={convertStoredDateToDate(personalInfo.dateOfBirth)}
              onChange={handleDateSelect}
              placeholder={formFields[3].placeholder}
              isMobile={isMobile}
              className={inputClassName || `border-[#d0d5dd] shadow-shadows-shadow-xs`}
            />
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
