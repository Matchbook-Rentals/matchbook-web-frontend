import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming you have a Switch component
import { Slider } from '@/components/ui/slider';
import DualThumbSlider from './double-slider';
import RentBarChart from './rent-bar-chart';
import CarouselButtonControls from './carousel-button-controls'; // Import CarouselButtonControls component
import { CheckboxDemo } from '../../preferences/custom-checkbox';

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
  minimumLeaseLength: number | null;
  maximumLeaseLength: number | null;
  minimumLeasePrice: number | null;
  maximumLeasePrice: number;
}

export default function LeaseTermsForm({ goToNext, goToPrevious, propertyDetails, setPropertyDetails, withButtons = true }: ComponentProps) {
  const [depositSize, setDepositSize] = useState(0);

  const handleNext = () => {
    // setPropertyDetails(prev => ({
    //   ...prev,
    //   depositSize,
    //   minimumLeaseLength: propertyDetails.minimumLeaseLength,
    //   maximumLeaseLength: propertyDetails.maximumLeaseLength,
    //   minimumLeasePrice: propertyDetails.minimumLeasePrice,
    //   maximumLeasePrice: propertyDetails.maximumLeasePrice,
    //   requireBackgroundCheck
    // }));
    goToNext();
  }

  const handleSetMinimumLeaseTerms = (length: number, price: number) => {
    setPropertyDetails({
      ...propertyDetails,
      minimumLeaseLength: length,
      minimumLeasePrice: price
    });
  }

  const handleSetMaximumLeaseTerms = (length: number, price: number) => {
    setPropertyDetails({
      ...propertyDetails,
      maximumLeaseLength: length,
      maximumLeasePrice: price
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <DualThumbSlider setMinimumLeaseTerms={handleSetMinimumLeaseTerms} setMaximumLeaseTerms={handleSetMaximumLeaseTerms} propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
      </div>

      {
        !propertyDetails?.maximumLeaseLength || !propertyDetails.maximumLeasePrice || !propertyDetails.minimumLeaseLength || !propertyDetails.minimumLeasePrice ? (
          <div className="flex items-center justify-center h-64 text-xl text-red-600">
            Please provide information about your desired lease terms to see a visualization.
          </div>
        ) : (
          <RentBarChart
            maxLength={propertyDetails.maximumLeaseLength}
            maxValue={propertyDetails.maximumLeasePrice}
            minLength={propertyDetails.minimumLeaseLength}
            minValue={propertyDetails.minimumLeasePrice}
          />
        )
      }

      <div className="flex justify-evenly items-center ">
        <div>
          <CheckboxDemo label="Require Background Check" isChecked={propertyDetails.requireBackgroundCheck} handleChange={() => setPropertyDetails({ ...propertyDetails, requireBackgroundCheck: !propertyDetails.requireBackgroundCheck })} details={{ id: 'requireBackgroundCheck' }} />
        </div>
        <div>
          <Label htmlFor="deposit-size">Deposit Size ($)</Label>
          <Input id="deposit-size" placeholder="Enter deposit size" type="number" value={propertyDetails.depositSize?.toString() || ''} onChange={e => setPropertyDetails({ ...propertyDetails, depositSize: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      {withButtons && <CarouselButtonControls onBack={goToPrevious} onNext={handleNext} backLabel="BACK" nextLabel="NEXT" />}
    </div>
  );
}
