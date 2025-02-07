import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CurrencyInput from "@/components/ui/currency-input";
import MonthSelect from "@/components/ui/month-select";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';

const emptyResidentialHistory = {
  currentStreet: '',
  currentApt: '',
  currentCity: '',
  currentState: '',
  currentZipCode: '',
  housingStatus: 'rent' as const,
  monthlyPayment: '',
  durationOfTenancy: '',
};

export const ResidentialHistory: React.FC = () => {
  const {
    residentialHistory,
    setResidentialHistory,
    errors
  } = useApplicationStore();

  const error = errors.residentialHistory;

  const normalizedResidentialHistory = {
    ...emptyResidentialHistory,
    ...residentialHistory,
    currentApt: residentialHistory.currentApt || ''
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResidentialHistory({
      ...residentialHistory,
      [name]: value
    });
  };

  const handleRadioChange = (value: 'rent' | 'own') => {
    setResidentialHistory({
      ...residentialHistory,
      housingStatus: value
    });
  };

  const handleMonthlyPaymentChange = (value: string) => {
    // Strip out currency formatting (dollar signs, commas, and decimals)
    const strippedValue = value.replace(/[$,]/g, '').split('.')[0];
    setResidentialHistory({
      ...residentialHistory,
      monthlyPayment: strippedValue
    });
  };

  const handleDurationChange = (value: string) => {
    setResidentialHistory({
      ...residentialHistory,
      durationOfTenancy: value
    });
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
            className={error?.currentStreet ? "border-red-500" : ""}
          />
          {error?.currentStreet && <p className="mt-1 text-red-500 text-sm">{error.currentStreet}</p>}
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
            className={error?.currentCity ? "border-red-500" : ""}
          />
          {error?.currentCity && <p className="mt-1 text-red-500 text-sm">{error.currentCity}</p>}
        </div>

        {/* State and ZIP */}
        <div>
          <Label className={ApplicationItemLabelStyles}>State</Label>
          <Input
            name="currentState"
            value={residentialHistory.currentState}
            onChange={handleInputChange}
            placeholder="State"
            className={error?.currentState ? "border-red-500" : ""}
          />
          {error?.currentState && <p className="mt-1 text-red-500 text-sm">{error.currentState}</p>}
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>ZIP Code</Label>
          <Input
            name="currentZipCode"
            value={residentialHistory.currentZipCode}
            onChange={handleInputChange}
            placeholder="ZIP Code"
            className={error?.currentZipCode ? "border-red-500" : ""}
          />
          {error?.currentZipCode && <p className="mt-1 text-red-500 text-sm">{error.currentZipCode}</p>}
        </div>

        {/* Payment and Duration */}
        <div className="space-y-2 space-x-4 py-0 flex flex-col items-end  xl:flex-row">
          <CurrencyInput
            id="monthlyPayment"
            className={`py-2 ${error?.monthlyPayment ? "border-red-500" : ""}`}
            label="Monthly Payment"
            labelClassName={ApplicationItemLabelStyles + 'text-[#404040]'}
            value={residentialHistory.monthlyPayment}
            onChange={handleMonthlyPaymentChange}
          />
          {error?.monthlyPayment && <p className="mt-1 text-red-500 text-sm">{error.monthlyPayment}</p>}
          <div className="flex flex-col">
            <Label className={ApplicationItemLabelStyles}>Length of Stay</Label>
            <MonthSelect
              value={residentialHistory.durationOfTenancy}
              onChange={handleDurationChange}
              className={error?.durationOfTenancy ? "border-red-500" : ""}
            />
            {error?.durationOfTenancy && <p className="mt-1 text-red-500 text-sm">{error.durationOfTenancy}</p>}
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
