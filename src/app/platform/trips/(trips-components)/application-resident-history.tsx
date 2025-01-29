import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CurrencyInput from "@/components/ui/currency-input";
import MonthSelect from "@/components/ui/month-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';

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
  const normalizedResidentialHistory = {
    ...emptyResidentialHistory,
    ...residentialHistory,
    currentApt: residentialHistory.currentApt || ''
  };

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

  const handleMonthlyPaymentChange = (value: string) => {
    // Strip out currency formatting (dollar signs, commas, and decimals)
    const strippedValue = value.replace(/[$,]/g, '').split('.')[0];
    setResidentialHistory(prevState => ({
      ...prevState,
      monthlyPayment: strippedValue
    }));
  };

  const handleDurationChange = (value: string) => {
    setResidentialHistory(prevState => ({
      ...prevState,
      durationOfTenancy: value
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className={ApplicationItemSubHeaderStyles}>Current Address</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Street Address - Full Width */}
        <div className="md:col-span-2">
          <Label className={ApplicationItemLabelStyles}>Street Address</Label>
          <Input
            name="currentStreet"
            value={residentialHistory.currentStreet}
            onChange={handleInputChange}
            placeholder="Street Address Ex: 123 Main St"
          />
        </div>

        {/* Apt and City */}
        <div>
          <Label className={ApplicationItemLabelStyles}>Apt, Suite, Bldg</Label>
          <Input
            name="currentApt"
            value={normalizedResidentialHistory.currentApt}
            onChange={handleInputChange}
            placeholder="Apt, Suite, Bldg (optional)"
          />
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>City</Label>
          <Input
            name="currentCity"
            value={residentialHistory.currentCity}
            onChange={handleInputChange}
            placeholder="City"
          />
        </div>

        {/* State and ZIP */}
        <div>
          <Label className={ApplicationItemLabelStyles}>State</Label>
          <Input
            name="currentState"
            value={residentialHistory.currentState}
            onChange={handleInputChange}
            placeholder="State"
          />
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>ZIP Code</Label>
          <Input
            name="currentZipCode"
            value={residentialHistory.currentZipCode}
            onChange={handleInputChange}
            placeholder="ZIP Code"
          />
        </div>

        {/* Payment and Duration */}
        <div className="space-y-2 space-x-4 py-0 flex flex-col items-end  xl:flex-row">
          <CurrencyInput
            id="monthlyPayment"
            className="py-2"
            label="Monthly Payment"
            labelClassName={ApplicationItemLabelStyles + 'text-[#404040]'}
            value={residentialHistory.monthlyPayment}
            onChange={handleMonthlyPaymentChange}
          />
          <div className="flex flex-col ">
            <Label className={ApplicationItemLabelStyles}>Length of Stay</Label>
            <MonthSelect
              value={residentialHistory.durationOfTenancy}
              onChange={handleDurationChange}
            />
          </div>
        </div>

        {/* Rent/Own Radio Group */}
        <div className="flex items-center">
          <RadioGroup
            value={residentialHistory.housingStatus}
            onValueChange={handleRadioChange}
            className="space-y-2 est"
          >
            <div className="flex items-center  space-x-2">
              <RadioGroupItem value="rent" id="rent" className='mb-2' />
              <Label className='text-[20px] font-normal' htmlFor="rent">I rent this property</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="own" id="own" className='mb-2' />
              <Label className='text-[20px] font-normal' htmlFor="own">I own this property</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
