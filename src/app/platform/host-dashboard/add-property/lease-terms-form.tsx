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
  const [requireBackgroundCheck, setRequireBackgroundCheck] = useState(false);
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
        <h2 className="text-3xl font-bold text-center">Lease Terms</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">Please select your minimum and maximum acceptable lease length</p>
        <DualThumbSlider setMinimumLeaseTerms={handleSetMinimumLeaseTerms} setMaximumLeaseTerms={handleSetMaximumLeaseTerms} />
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

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Require Background Check */}
        <div className="space-y-2">
          <Label htmlFor="background-check">Require Background Check</Label>
          <Switch id="background-check" checked={requireBackgroundCheck} onClick={() => setRequireBackgroundCheck(prev => !prev)} />
        </div>
        {/* Deposit Size */}
        <div className="space-y-2">
          <Label htmlFor="deposit-size">Deposit Size ($)</Label>
          <Input id="deposit-size" placeholder="Enter deposit size" type="number" value={depositSize.toString()} onChange={e => setDepositSize(parseFloat(e.target.value) || 0)} />
        </div>
      </form>

      {withButtons && <CarouselButtonControls onBack={goToPrevious} onNext={handleNext} backLabel="BACK" nextLabel="NEXT" />}
    </div>
  );
}
