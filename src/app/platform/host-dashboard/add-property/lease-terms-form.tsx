import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import DualThumbSlider from './double-slider';
import RentBarChart from './rent-bar-chart';
import CarouselButtonControls from './carousel-button-controls'; // Import CarouselButtonControls component
import { CheckboxDemo } from '../../preferences/custom-checkbox';
import CurrencyInput from '@/components/ui/currency-input';

interface ComponentProps {
  goToNext: () => void;
  goToPrevious: () => void;
  propertyDetails: PropertyDetails;
  setPropertyDetails: (details: PropertyDetails) => void;
  withButtons?: boolean; // Add withButtons prop
}

interface PropertyDetails {
  requireBackgroundCheck: boolean;
  depositSize: number;
  shortestLeaseLength: number | null;
  longestLeaseLength: number | null;
  shortestLeasePrice: number | null;
  longestLeasePrice: number;
}

export default function LeaseTermsForm({ goToNext, goToPrevious, propertyDetails, setPropertyDetails, withButtons = true }: ComponentProps) {
  const [depositSize, setDepositSize] = useState(0);

  const handleNext = () => {
    goToNext();
  }

  const handleSetShortestLeaseTerms = (length: number, price: number) => {
    setPropertyDetails({
      ...propertyDetails,
      shortestLeaseLength: length,
      shortestLeasePrice: price
    });
  }

  const handleSetLongestLeaseTerms = (length: number, price: number) => {
    setPropertyDetails({
      ...propertyDetails,
      longestLeaseLength: length,
      longestLeasePrice: price
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <DualThumbSlider setShortestLeaseTerms={handleSetShortestLeaseTerms} setLongestLeaseTerms={handleSetLongestLeaseTerms} propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
      </div>

      <RentBarChart
        maxLength={propertyDetails.longestLeaseLength || 12}
        maxValue={propertyDetails.longestLeasePrice || 2500}
        minLength={propertyDetails.shortestLeaseLength || 1}
        minValue={propertyDetails.shortestLeasePrice || 3000}
      />

      <div className="flex justify-evenly items-center ">
        <div className='scale-90'>
          <CheckboxDemo label="Require Background Check" isChecked={propertyDetails.requireBackgroundCheck} handleChange={() => setPropertyDetails({ ...propertyDetails, requireBackgroundCheck: !propertyDetails.requireBackgroundCheck })} details={{ id: 'requireBackgroundCheck' }} />
        </div>
        <div onClick={() => console.log(propertyDetails.depositSize)}>
          {/* <Label htmlFor="deposit-size">Deposit Size ($)</Label>
          <Input id="deposit-size" placeholder="Enter deposit size" type="number" value={propertyDetails.depositSize?.toString() || ''} onChange={e => setPropertyDetails({ ...propertyDetails, depositSize: parseFloat(e.target.value) || 0 })} /> */}
          <CurrencyInput id="deposit-size" label='Deposit Size ($)' value={propertyDetails.depositSize} onChange={number => setPropertyDetails({ ...propertyDetails, depositSize: number || 0 })} />
        </div>
      </div>

      {withButtons && <CarouselButtonControls onBack={goToPrevious} onNext={handleNext} backLabel="BACK" nextLabel="NEXT" />}
    </div>
  );
}
