import React, { useEffect } from 'react';
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

export const ResidentialLandlordInfo: React.FC = () => {
  // Directly use residentialHistory from the store
  const residentialHistory = useApplicationStore((state) => state.residentialHistory);
  const setResidentialHistory = useApplicationStore((state) => state.setResidentialHistory);
  const residentialHistoryErrors = useApplicationStore((state) => state.errors.residentialHistory);

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Directly update the store's residentialHistory
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, [name]: value } : residence
      )
    );
  };

  const handleRadioChange = (index: number, value: 'rent' | 'own') => {
    // Directly update the store
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, housingStatus: value } : residence
      )
    );
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
    // Directly update the store
    setResidentialHistory(
      residentialHistory.map((residence, i) =>
        i === index ? { ...residence, durationOfTenancy: value } : residence
      )
    );
  };

  // Function to add a new residence with a cap of 3
  const addResidence = () => {
    if (residentialHistory.length < 3) {
      // Directly update the store
      setResidentialHistory([...residentialHistory, { ...defaultResidentialHistory, id: crypto.randomUUID() }]);
    }
  };

    // New useEffect to adjust the number of residences based on the total months entered.
  // It ensures that if the cumulative months across residences reaches or exceeds 24,
  // any extra (unneeded) residences are removed.
  useEffect(() => {
    let cumulativeMonths = 0;
    let neededProperties = residentialHistory.length;
    // Loop over residences in order, accumulating duration until we reach 24.
    for (let i = 0; i < residentialHistory.length; i++) {
      const duration = parseInt(residentialHistory[i].durationOfTenancy || "") || 0; // Corrected parseInt usage
      cumulativeMonths += duration;
      if (cumulativeMonths >= 24) {
        // Only the first (i + 1) residences are needed.
        neededProperties = i + 1;
        break;
      }
    }
    // If we've reached (or exceeded) 24 and have extra residences, trim them.
    if (cumulativeMonths >= 24 && residentialHistory.length > neededProperties) {
      setResidentialHistory(residentialHistory.slice(0, neededProperties));
    }
    // Otherwise, if we're below 24 and the last residence's duration is filled,
    // auto-add a new residence (if we haven't reached the maximum of 3).
    else if (cumulativeMonths < 24) {
      const lastResidence = residentialHistory[residentialHistory.length - 1];
      if (lastResidence && lastResidence.durationOfTenancy !== "" && residentialHistory.length < 3) {
        addResidence();
      }
    }
  }, [residentialHistory, setResidentialHistory]); // Include setResidentialHistory in dependency array


  // Calculate total months from all residences (if needed elsewhere)
  const totalMonths = residentialHistory.reduce((acc, curr) => acc + (parseInt(curr.durationOfTenancy || "") || 0), 0);


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
          <Card key={index} className="h-[534px] p-6 bg-neutral-50 rounded-xl border-0">
            <CardContent className="p-0 flex flex-col gap-8 h-full">
              <div className="flex flex-col items-start gap-5 w-full">
                <h2 className="[font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-normal">
                  {headerText}
                </h2>

                {/* Row 1: Street Address + Apt */}
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
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
                          className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                        />
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
                          className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: City + State */}
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
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
                        className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
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
                        className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: ZIP Code + Months */}
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
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
                        className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                      />
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
                        <Select defaultValue="24+">
                          <SelectTrigger className="flex w-[120px] h-12 items-center gap-2 px-3 py-2 relative bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs">
                            <SelectValue className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24+">24+</SelectItem>
                          </SelectContent>
                        </Select>

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
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                    <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                      </div>

                      <RadioGroup
                        value={residence.housingStatus || ""}
                        onValueChange={(value) => handleRadioChange(index, value as 'rent' | 'own')}
                        className="flex items-center gap-6 relative self-stretch w-full flex-[0_0_auto] pt-2"
                      >
                        <div className="flex items-center gap-2 relative">
                          <RadioGroupItem
                            value="rent"
                            id={`rent-${index}`}
                            className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                          />
                          <Label
                            htmlFor={`rent-${index}`}
                            className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
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
                            className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
