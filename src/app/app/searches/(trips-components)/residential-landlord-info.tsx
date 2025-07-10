import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    <div className="space-y-8">
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
          <div key={index} className="border p-4 rounded-md space-y-6">
            <h3 className={ApplicationItemSubHeaderStyles}>{headerText}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className={ApplicationItemLabelStyles}>Street Address</Label>
                  <Input
                    name="street"
                    value={residence.street || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Street Address Ex: 123 Main St"
                    className={residentialHistoryErrors.street?.[index] ? "border-red-500" : ""}
                  />
                  {residentialHistoryErrors.street?.[index] && (
                    <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.street[index]}</p>
                  )}
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>Apt, Suite, Bldg</Label>
                  <Input
                    name="apt"
                    value={residence.apt || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Apt, Suite, Bldg (optional)"
                  />
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>City</Label>
                  <Input
                    name="city"
                    value={residence.city || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="City"
                    className={residentialHistoryErrors.city?.[index] ? "border-red-500" : ""}
                  />
                  {residentialHistoryErrors.city?.[index] && (
                    <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.city[index]}</p>
                  )}
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>State</Label>
                  <Input
                    name="state"
                    value={residence.state || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="State"
                    className={residentialHistoryErrors.state?.[index] ? "border-red-500" : ""}
                  />
                  {residentialHistoryErrors.state?.[index] && (
                    <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.state[index]}</p>
                  )}
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>ZIP Code</Label>
                  <Input
                    name="zipCode"
                    value={residence.zipCode || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="ZIP Code"
                    className={residentialHistoryErrors.zipCode?.[index] ? "border-red-500" : ""}
                  />
                  {residentialHistoryErrors.zipCode?.[index] && (
                    <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.zipCode[index]}</p>
                  )}
                </div>
                <div className="space-y-4 xl:space-y-0 xl:space-x-4 py-0 flex flex-col items-start xl:flex-row">
                  <div className="flex flex-col ">
                    <Label className={ApplicationItemLabelStyles}>Monthly Payment</Label>
                    <MonthlyPaymentInput
                      id={`monthlyPayment-${index}`}
                      className={`${residentialHistoryErrors.monthlyPayment?.[index] ? "border-red-500" : ""}`}
                      value={residence.monthlyPayment || ""}
                      onChange={(value) => handleMonthlyPaymentChange(index, value)}
                    />
                    {residentialHistoryErrors.monthlyPayment?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.monthlyPayment[index]}</p>
                    )}
                  </div>
                  <div className="flex flex-col  items-start py-0 ">
                    <Label className={ApplicationItemLabelStyles}>Length of Stay</Label>
                    <MonthSelect
                      value={residence.durationOfTenancy || ""}
                      onChange={(value) => handleDurationChange(index, value)}
                      className={residentialHistoryErrors.durationOfTenancy?.[index] ? "border-red-500" : ""}
                    />
                  {residentialHistoryErrors.durationOfTenancy?.[index] && (
                    <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.durationOfTenancy[index]}</p>
                  )}
                  </div>
                </div>
                <div className="flex items-center">
                  <RadioGroup
                    value={residence.housingStatus || ""}
                    onValueChange={(value) => handleRadioChange(index, value as 'rent' | 'own')}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rent" id={`rent-${index}`} className="mb-2" />
                      <Label className="text-[16px] sm:text-[20px] font-normal" htmlFor={`rent-${index}`}>
                        I rent this property
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="own" id={`own-${index}`} className="mb-2" />
                      <Label className="text-[16px] sm:text-[20px] font-normal" htmlFor={`own-${index}`}>
                        I own this property
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            {residence.housingStatus !== "own" && (
              <div className="mt-8">
                <h4 className={ApplicationItemSubHeaderStyles}>Landlord Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className={ApplicationItemLabelStyles}>First Name</Label>
                    <Input
                      name="landlordFirstName"
                      value={residence.landlordFirstName || ""}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's First Name"
                      className={residentialHistoryErrors.landlordFirstName?.[index] ? "border-red-500" : ""}
                    />
                    {residentialHistoryErrors.landlordFirstName?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.landlordFirstName[index]}</p>
                    )}
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Last Name</Label>
                    <Input
                      name="landlordLastName"
                      value={residence.landlordLastName || ""}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Last Name"
                      className={residentialHistoryErrors.landlordLastName?.[index] ? "border-red-500" : ""}
                    />
                    {residentialHistoryErrors.landlordLastName?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.landlordLastName[index]}</p>
                    )}
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Email</Label>
                    <Input
                      name="landlordEmail"
                      value={residence.landlordEmail || ""}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Email"
                      className={residentialHistoryErrors.landlordEmail?.[index] ? "border-red-500" : ""}
                    />
                    {residentialHistoryErrors.landlordEmail?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.landlordEmail[index]}</p>
                    )}
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Phone Number</Label>
                    <Input
                      name="landlordPhoneNumber"
                      value={residence.landlordPhoneNumber || ""}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Phone Number"
                      className={residentialHistoryErrors.landlordPhoneNumber?.[index] ? "border-red-500" : ""}
                    />
                    {residentialHistoryErrors.landlordPhoneNumber?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{residentialHistoryErrors.landlordPhoneNumber[index]}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};