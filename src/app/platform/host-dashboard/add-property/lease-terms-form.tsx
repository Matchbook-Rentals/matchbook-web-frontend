import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming you have a Switch component
import { Slider } from '@/components/ui/slider';
import DualThumbSlider from './double-slider';

interface ComponentProps {
  goToNext: () => void;
  goToPrevious: () => void;
  setPropertyDetails: (details: PropertyDetails) => void;
}

interface PropertyDetails {
  requireBackgroundCheck: boolean;
  depositSize: number;
  minimumLeaseLength: number;
}

export default function LeaseTermsForm({ goToNext, goToPrevious, setPropertyDetails }: ComponentProps) {
  const [requireBackgroundCheck, setRequireBackgroundCheck] = useState(false);
  const [depositSize, setDepositSize] = useState(0);
  const [minimumLeaseLength, setMinimumLeaseLength] = useState(0);

  const handleNext = () => {
    setPropertyDetails(prev => ({ ...prev, depositSize, minimumLeaseLength, requireBackgroundCheck }))
    goToNext();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-center">Lease Terms</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">Please select your minimum and maximum acceptable lease length</p>
        <DualThumbSlider />
      </div>
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
        {/* Minimum Lease Length */}
        <div className="space-y-2">
          <Label htmlFor="lease-length">Minimum Lease Length (Months)</Label>
          <Input id="lease-length" placeholder="Enter minimum lease length" type="number" value={minimumLeaseLength.toString()} onChange={e => setMinimumLeaseLength(parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex justify-between">
          <Button onClick={goToPrevious}>Back</Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </form>
    </div>
  );
}
