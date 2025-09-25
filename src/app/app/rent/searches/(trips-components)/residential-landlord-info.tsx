import React, { useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import MonthSelect from "@/components/ui/month-select";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { useApplicationStore, defaultResidentialHistory } from '@/stores/application-store';
import { ResidentialHistory } from '@prisma/client';
import { validateResidentialHistory } from '@/utils/application-validation';
import { useToast } from "@/components/ui/use-toast";

// New MonthlyPaymentInput component
interface MonthlyPaymentInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

const MonthlyPaymentInput: React.FC<MonthlyPaymentInputProps> = ({ value, onChange, id, className }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
  };

  let displayValue = value;
  if (!isFocused && value && /^\d+$/.test(value)) {
    // Format as currency when not focused
    const numericValue = parseInt(value, 10);
    displayValue = "$" + numericValue.toLocaleString();
  }

  return (
    <Input
      id={id}
      type="text"
      className={className}
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => {
        // Remove any $ or commas so only a raw numeric string is passed upward
        const cleaned = e.target.value.replace(/[$,]/g, '');
        onChange(cleaned);
      }}
    />
  );
};

interface ResidentialLandlordInfoProps {
  inputClassName?: string;
  isMobile?: boolean;
}

export const ResidentialLandlordInfo: React.FC<ResidentialLandlordInfoProps> = ({ inputClassName, isMobile = false }) => {
  // Directly use residentialHistory from the store
  const residentialHistory = useApplicationStore((state) => state.residentialHistory);
  const setResidentialHistory = useApplicationStore((state) => state.setResidentialHistory);
  const preservedResidentialHistory = useApplicationStore((state) => state.preservedResidentialHistory);
  const setPreservedResidentialHistory = useApplicationStore((state) => state.setPreservedResidentialHistory);
  const residentialHistoryErrors = useApplicationStore((state) => state.errors.residentialHistory);
  const { fieldErrors, saveField, validateField, setFieldError, clearFieldError } = useApplicationStore();
  const { toast } = useToast();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Create debounced save function with toast feedback (increased to 1000ms for onChange)

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldPath = `residentialHistory.${index}.${name}`;
    
    // Update state immediately
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, [name]: value } : residence
      )
    );
    
    // Validate immediately
    const validationError = validateField(fieldPath, value);
    if (validationError) {
      setFieldError(fieldPath, validationError);
      if (isDevelopment) {
        console.log(`[ResidentialHistory] Validation error for ${fieldPath}:`, validationError);
      }
    } else {
      clearFieldError(fieldPath);
      if (isDevelopment) {
        console.log(`[ResidentialHistory] Field ${fieldPath} validated successfully (no auto-save)`);
      }
    }
  };

  const handleRadioChange = async (index: number, value: 'rent' | 'own') => {
    // Update the residence with new housing status
    const updatedResidence = { ...residentialHistory[index], housingStatus: value };
    
    // Clear landlord info if switching to "own"
    if (value === 'own') {
      updatedResidence.landlordFirstName = '';
      updatedResidence.landlordLastName = '';
      updatedResidence.landlordEmail = '';
      updatedResidence.landlordPhoneNumber = '';
    }
    
    // Update the store
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? updatedResidence : residence
      )
    );
    
    if (isDevelopment) {
      console.log(`[Residential] Housing status updated for index ${index} (no auto-save)`);
    }
  };

  const handleMonthlyPaymentChange = (index: number, value: string) => {
    const strippedValue = value.replace(/[$,]/g, '').split('.')[0];
    // Directly update the store
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, monthlyPayment: strippedValue } : residence
      )
    );
  };

  const handleDurationChange = (index: number, value: string) => {
    const fieldPath = `residentialHistory.${index}.durationOfTenancy`;
    
    // Update state immediately
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, durationOfTenancy: value } : residence
      )
    );
    
    // Validate immediately
    const validationError = validateField(fieldPath, value);
    if (validationError) {
      setFieldError(fieldPath, validationError);
      if (isDevelopment) {
        console.log(`[ResidentialHistory] Validation error for ${fieldPath}:`, validationError);
      }
    } else {
      clearFieldError(fieldPath);
      if (isDevelopment) {
        console.log(`[ResidentialHistory] Field ${fieldPath} validated successfully (no auto-save)`);
      }
    }
  };



  return (
    <div className="space-y-8 w-full">
      {residentialHistoryErrors.overall && (
        <p onClick={() => console.log(residentialHistory)} className="text-red-500 text-sm mt-1">{residentialHistoryErrors.overall}</p>
      )}
      {residentialHistory.map((residence, index) => {
        let headerText;
        if (index === 0) {
          headerText = "Current Residence";
        } else if (index === 1) {
          headerText = "Previous Residence";
        } else {
          headerText = `Residence ${index + 1}`;
        }
        return (
          <Card key={index} className="py-6 px-0 bg-neutral-50 rounded-xl border-none shadow-none">
            <CardContent className="p-0 flex flex-col gap-8">
              <div className="flex flex-col items-start gap-5 w-full">
                <h2 className="[font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-lg tracking-[-0.40px] leading-normal">
                  {headerText}
                </h2>

                {/* Row 1: Street Address + Apt */}
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                            Street Address
                          </Label>
                        </div>

                        <Input
                          name="street"
                          value={residence.street || ""}
                          onChange={(e) => handleInputChange(index, e)}
                          placeholder="Enter Street Address"
                          className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                        />
                        {fieldErrors[`residentialHistory.${index}.street`] && 
                          <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.street`]}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                            Apt, Suite, Bldg
                          </Label>
                        </div>

                        <Input
                          name="apt"
                          value={residence.apt || ""}
                          onChange={(e) => handleInputChange(index, e)}
                          placeholder="Enter Apt, Suite, Bldg"
                          className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: City + State */}
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          City
                        </Label>
                      </div>

                      <Input
                        name="city"
                        value={residence.city || ""}
                        onChange={(e) => handleInputChange(index, e)}
                        placeholder="Enter City"
                        className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                      />
                      {fieldErrors[`residentialHistory.${index}.city`] && 
                        <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.city`]}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          State
                        </Label>
                      </div>

                      <Input
                        name="state"
                        value={residence.state || ""}
                        onChange={(e) => handleInputChange(index, e)}
                        placeholder="Enter State"
                        className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                      />
                      {fieldErrors[`residentialHistory.${index}.state`] && 
                        <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.state`]}</p>}
                    </div>
                  </div>
                </div>

                {/* Row 3: ZIP Code + Months */}
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          ZIP Code
                        </Label>
                      </div>

                      <Input
                        name="zipCode"
                        value={residence.zipCode || ""}
                        onChange={(e) => handleInputChange(index, e)}
                        placeholder="Enter ZIP Code"
                        className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                      />
                      {fieldErrors[`residentialHistory.${index}.zipCode`] && 
                        <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.zipCode`]}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                        <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          How many months have you stayed here?
                        </Label>
                      </div>

                      <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                        <Input
                          type="number"
                          name="durationOfTenancy"
                          value={residence.durationOfTenancy || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Prevent 0 or negative values
                            if (value === "" || (parseInt(value) > 0)) {
                              handleDurationChange(index, value);
                            }
                          }}
                          min="1"
                          placeholder="Enter months"
                          className={`w-[160px] ${inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}`}
                        />
                        {fieldErrors[`residentialHistory.${index}.durationOfTenancy`] && 
                          <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.durationOfTenancy`]}</p>}

                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                            Months
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 4: Property Type (radio buttons) */}
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                      </div>

                      <RadioGroup
                        value={residence.housingStatus || ""}
                        onValueChange={(value) => handleRadioChange(index, value as 'rent' | 'own')}
                        className={`flex ${isMobile ? 'flex-col items-start gap-3' : 'items-center gap-6'} relative self-stretch w-full flex-[0_0_auto] pt-2`}
                      >
                        <div className="flex items-center gap-2 relative">
                          <RadioGroupItem
                            value="rent"
                            id={`rent-${index}`}
                            className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                          />
                          <Label
                            htmlFor={`rent-${index}`}
                            className="relative w-fit  [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                          >
                            I rent this property
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 relative">
                          <RadioGroupItem
                            value="own"
                            id={`own-${index}`}
                            className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                          />
                          <Label
                            htmlFor={`own-${index}`}
                            className="relative w-fit  [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                          >
                            I own this property
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    {/* Empty div to maintain 2-column layout */}
                  </div>
                </div>

                {/* Row 5: Landlord Info (only show if renting) */}
                {residence.housingStatus === 'rent' && (
                  <>
                    <div className="mt-4 mb-2">
                      <h3 className={ApplicationItemSubHeaderStyles}>
                        {index === 0 ? 'Current Landlord Information' : 'Previous Landlord Information'}
                      </h3>
                    </div>
                    
                    {/* Landlord First Name + Last Name */}
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                      <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                        <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                              Landlord First Name
                            </Label>
                          </div>

                          <Input
                            name="landlordFirstName"
                            value={residence.landlordFirstName || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            placeholder="Enter landlord's first name"
                            className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                          />
                          {fieldErrors[`residentialHistory.${index}.landlordFirstName`] && 
                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.landlordFirstName`]}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                        <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                              Landlord Last Name
                            </Label>
                          </div>

                          <Input
                            name="landlordLastName"
                            value={residence.landlordLastName || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            placeholder="Enter landlord's last name"
                            className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                          />
                          {fieldErrors[`residentialHistory.${index}.landlordLastName`] && 
                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.landlordLastName`]}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Landlord Email + Phone */}
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-5'} relative self-stretch w-full flex-[0_0_auto]`}>
                      <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                        <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                              Landlord Email
                            </Label>
                          </div>

                          <Input
                            name="landlordEmail"
                            value={residence.landlordEmail || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            placeholder="Enter landlord's email"
                            type="email"
                            className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                          />
                          {fieldErrors[`residentialHistory.${index}.landlordEmail`] && 
                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.landlordEmail`]}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                        <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                              Landlord Phone
                            </Label>
                          </div>

                          <Input
                            name="landlordPhoneNumber"
                            value={residence.landlordPhoneNumber || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            placeholder="Enter landlord's phone"
                            type="tel"
                            className={inputClassName || `flex ${isMobile ? 'py-3' : 'h-12 py-2'} items-center gap-2 px-3 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900 placeholder:text-gray-400`}
                          />
                          {fieldErrors[`residentialHistory.${index}.landlordPhoneNumber`] && 
                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`residentialHistory.${index}.landlordPhoneNumber`]}</p>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
