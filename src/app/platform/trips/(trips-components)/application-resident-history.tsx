import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ResidentialHistoryProps {
  residentialHistory: {
    currentStreet: string;
    currentApt?: string;
    currentCity: string;
    currentState: string;
    currentZipCode: string;
    housingStatus: 'rent' | 'own';
    monthlyPayment: string;
    durationOfTenancy: string;
  };
  setResidentialHistory: React.Dispatch<React.SetStateAction<ResidentialHistoryProps['residentialHistory']>>;
}

const emptyResidentialHistory: ResidentialHistoryProps['residentialHistory'] = {
  currentStreet: '',
  currentApt: '',
  currentCity: '',
  currentState: '',
  currentZipCode: '',
  housingStatus: 'rent',
  monthlyPayment: '',
  durationOfTenancy: '',
};

export const ResidentialHistory: React.FC<ResidentialHistoryProps> = ({ residentialHistory, setResidentialHistory }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResidentialHistory(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleRadioChange = (value: 'rent' | 'own') => {
    setResidentialHistory(prevState => ({
      ...prevState,
      housingStatus: value
    }));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Residential History</h3>
      <div className="space-y-2">
        <Label>Current Address</Label>
        <Input 
          name="currentStreet"
          value={residentialHistory.currentStreet}
          onChange={handleInputChange}
          placeholder="Street Address Ex: 123 Main St"
        />
        <Input 
          name="currentApt"
          value={residentialHistory.currentApt}
          onChange={handleInputChange}
          placeholder="apt, suite, bldg (optional)"
        />
        <Input 
          name="currentCity"
          value={residentialHistory.currentCity}
          onChange={handleInputChange}
          placeholder="City"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input 
            name="currentState"
            value={residentialHistory.currentState}
            onChange={handleInputChange}
            placeholder="State"
          />
          <Input 
            name="currentZipCode"
            value={residentialHistory.currentZipCode}
            onChange={handleInputChange}
            placeholder="ZIP Code"
          />
        </div>
      </div>
      <div className="mt-2">
        <Label>Do you rent or own?</Label>
        <RadioGroup
          value={residentialHistory.housingStatus}
          onValueChange={handleRadioChange}
          className="flex space-x-4 mt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rent" id="rent" />
            <Label htmlFor="rent">Rent</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="own" id="own" />
            <Label htmlFor="own">Own</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-2 mt-2">
        <Label htmlFor="monthlyPayment">Monthly Payment</Label>
        <Input
          id="monthlyPayment"
          name="monthlyPayment"
          value={residentialHistory.monthlyPayment}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2 mt-2">
        <Label htmlFor="durationOfTenancy">How long have you lived here?</Label>
        <Input
          id="durationOfTenancy"
          name="durationOfTenancy"
          value={residentialHistory.durationOfTenancy}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};
