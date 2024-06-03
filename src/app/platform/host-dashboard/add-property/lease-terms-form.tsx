import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming you have a Switch component
import { Slider } from '@/components/ui/slider';
import DualThumbSlider from './double-slider';
import RentBarChart from './rent-bar-chart';

interface ComponentProps {
  goToNext: () => void;
  goToPrevious: () => void;
  setPropertyDetails: (details: PropertyDetails) => void;
}

interface PropertyDetails {
  requireBackgroundCheck: boolean;
  depositSize: number;
  minimumLeaseLength: number;
  maximumLeaseLength: number;
  minimumLeasePrice: number;
  maximumLeasePrice: number;
}

export default function LeaseTermsForm({ goToNext, goToPrevious, setPropertyDetails }: ComponentProps) {
  const [requireBackgroundCheck, setRequireBackgroundCheck] = useState(false);
  const [depositSize, setDepositSize] = useState(0);
  const [minimumLeaseTerms, setMinimumLeaseTerms] = useState({ length: null, price: null });
  const [maximumLeaseTerms, setMaximumLeaseTerms] = useState({ length: null, price: null })

  const handleNext = () => {
    setPropertyDetails(prev => ({
      ...prev,
      depositSize,
      minimumLeaseLength: minimumLeaseTerms.length,
      maximumLeaseLength: maximumLeaseTerms.length,
      minimumLeasePrice: minimumLeaseTerms.price,
      maximumLeasePrice: maximumLeaseTerms.price,
      requireBackgroundCheck
    }));
    goToNext();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-center">Lease Terms</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">Please select your minimum and maximum acceptable lease length</p>
        <p>{minimumLeaseTerms.length}, {minimumLeaseTerms.price}</p>
        <p>{maximumLeaseTerms.length}, {maximumLeaseTerms.price}</p>
        <DualThumbSlider setMinimumLeaseTerms={setMinimumLeaseTerms} setMaximumLeaseTerms={setMaximumLeaseTerms} />
      </div>

      {
        !maximumLeaseTerms.length || !maximumLeaseTerms.price || !minimumLeaseTerms.length || !minimumLeaseTerms.length ? (
          <div className="flex items-center justify-center h-64 text-xl text-red-600">
            Please provide information about your desired lease terms to see a visualization.
          </div>
        ) : (
          <RentBarChart
            maxLength={maximumLeaseTerms.length}
            maxValue={maximumLeaseTerms.price}
            minLength={minimumLeaseTerms.length}
            minValue={minimumLeaseTerms.price}
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
      <div className="flex gap-2 justify-center mt-5 p-1">
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={goToPrevious}>BACK</button>
        <button className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg" onClick={handleNext}>NEXT</button>
      </div>
    </div>
  );

}

