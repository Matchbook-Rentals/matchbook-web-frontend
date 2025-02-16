import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CurrencyInput from "@/components/ui/currency-input";
import MonthSelect from "@/components/ui/month-select";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';

// Define a default residence record
const defaultResidence = {
  street: "",
  apt: "",
  city: "",
  state: "",
  zipCode: "",
  monthlyPayment: "",
  durationOfTenancy: "",
  housingStatus: "rent",
  landlordFirstName: "",
  landlordLastName: "",
  landlordEmail: "",
  landlordPhoneNumber: ""
};

export const ResidentialLandlordInfo: React.FC = () => {
  // Using local state for multiple residences
  const [residences, setResidences] = useState([defaultResidence]);

  // Helper function to update a residence field
  const updateResidence = (index: number, field: string, value: string) => {
    setResidences(prev => {
      const newRes = [...prev];
      newRes[index] = { ...newRes[index], [field]: value };
      return newRes;
    });
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateResidence(index, name, value);
  };

  const handleRadioChange = (index: number, value: 'rent' | 'own') => {
    updateResidence(index, 'housingStatus', value);
  };

  const handleMonthlyPaymentChange = (index: number, value: string) => {
    const strippedValue = value.replace(/[$,]/g, '').split('.')[0];
    updateResidence(index, 'monthlyPayment', strippedValue);
  };

  const handleDurationChange = (index: number, value: string) => {
    updateResidence(index, 'durationOfTenancy', value);
  };

  // Calculate total months from all residences
  const totalMonths = residences.reduce((acc, curr) => acc + (parseInt(curr.durationOfTenancy) || 0), 0);

  // Function to add a new residence with a cap of 3
  const addResidence = () => {
    setResidences(prev => {
      if (prev.length < 3) {
        return [...prev, { ...defaultResidence }];
      }
      return prev;
    });
  };

  // Auto-trim or auto-add residences: Only show as many residences as needed to sum to at least 24 months.
  useEffect(() => {
    let cumulative = 0;
    let trimIndex = -1;
    for (let i = 0; i < residences.length; i++) {
      cumulative += parseInt(residences[i].durationOfTenancy) || 0;
      if (cumulative >= 24) {
        trimIndex = i;
        break;
      }
    }

    if (trimIndex !== -1 && residences.length > trimIndex + 1) {
      // We've reached 24 months; trim extra residences
      setResidences(residences.slice(0, trimIndex + 1));
    } else if (cumulative < 24) {
      // If total is less than 24 and the last residence's duration is filled, auto-add a new residence if not already present
      const lastResidence = residences[residences.length - 1];
      if (lastResidence && lastResidence.durationOfTenancy !== "" && residences.length < 3) {
        setResidences([...residences, { ...defaultResidence }]);
      }
    }
  }, [residences]);

  return (
    <div className="space-y-8">
      {residences.map((residence, index) => {
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
              <h4 className={ApplicationItemSubHeaderStyles}>Address Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className={ApplicationItemLabelStyles}>Street Address</Label>
                  <Input
                    name="street"
                    value={residence.street}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Street Address Ex: 123 Main St"
                  />
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>Apt, Suite, Bldg</Label>
                  <Input
                    name="apt"
                    value={residence.apt}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Apt, Suite, Bldg (optional)"
                  />
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>City</Label>
                  <Input
                    name="city"
                    value={residence.city}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>State</Label>
                  <Input
                    name="state"
                    value={residence.state}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label className={ApplicationItemLabelStyles}>ZIP Code</Label>
                  <Input
                    name="zipCode"
                    value={residence.zipCode}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="ZIP Code"
                  />
                </div>
                <div className="space-y-2 xl:space-x-4 py-0 flex flex-col items-start xl:flex-row">
                  <CurrencyInput
                    id={`monthlyPayment-${index}`}
                    className="py-2"
                    label="Monthly Payment"
                    labelClassName={ApplicationItemLabelStyles + ' text-[#404040]'}
                    value={residence.monthlyPayment}
                    onChange={(value) => handleMonthlyPaymentChange(index, value)}
                  />
                  <div className="flex flex-col">
                    <Label className={ApplicationItemLabelStyles}>Length of Stay (months)</Label>
                    <MonthSelect
                      value={residence.durationOfTenancy}
                      onChange={(value) => handleDurationChange(index, value)}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <RadioGroup
                    value={residence.housingStatus}
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
                      value={residence.landlordFirstName}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's First Name"
                    />
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Last Name</Label>
                    <Input
                      name="landlordLastName"
                      value={residence.landlordLastName}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Last Name"
                    />
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Email</Label>
                    <Input
                      name="landlordEmail"
                      value={residence.landlordEmail}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Email"
                    />
                  </div>
                  <div>
                    <Label className={ApplicationItemLabelStyles}>Phone Number</Label>
                    <Input
                      name="landlordPhoneNumber"
                      value={residence.landlordPhoneNumber}
                      onChange={(e) => handleInputChange(index, e)}
                      placeholder="Landlord's Phone Number"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex flex-col items-start space-y-2">
        <p>Total Months: {totalMonths} (need at least 24)</p>
      </div>
    </div>
  );
};