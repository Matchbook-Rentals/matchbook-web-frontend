import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  goToNext: () => void;
  goToPrevious: () => void;
  setPropertyDetails: (details: PropertyDetails) => void;
}

interface PropertyDetails {
  title: string;
  description: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  bathroomCount: number;
  bedroomCount: number;
  pricePerMonth: number;
}

export default function DetailsForm({ goToNext, goToPrevious, setPropertyDetails }: ComponentProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bathroomCount, setBathroomCount] = useState(0);
  const [bedroomCount, setBedroomCount] = useState(0);
  const [pricePerMonth, setPricePerMonth] = useState(0);

  const handleDecrease = (setter: React.Dispatch<React.SetStateAction<number>>) => () => {
    setter(prev => prev > 0 ? prev - 1 : 0);
  };

  const handleIncrease = (setter: React.Dispatch<React.SetStateAction<number>>) => () => {
    setter(prev => prev + 1);
  };

  const handleNext = () => {
    setPropertyDetails(prev => {
      return {...prev, title, description, streetAdress: street, city, state, postalCode, bathroomCount, bedroomCount, price: pricePerMonth}
    })
    goToNext();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Property Details</h2>
        <p className="text-gray-500 dark:text-gray-400">Fill out the form below to submit your property details.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter property title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea className="min-h-[100px]" id="description" placeholder="Enter property description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input id="street" placeholder="Enter street" value={street} onChange={e => setStreet(e.target.value)} />
          </div>
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Enter city" value={city} onChange={e => setCity(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* State */}
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Enter state" value={state} onChange={e => setState(e.target.value)} />
          </div>
          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input id="postal-code" placeholder="Enter postal code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Bathroom Count */}
          <div className="space-y-2">
            <Label htmlFor="bathroom-count">Bathroom Count</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={handleDecrease(setBathroomCount)}>
                <MinusIcon className="w-4 h-4" />
              </Button>
              <Input id="bathroom-count" placeholder="Enter bathroom count" type="number" value={bathroomCount.toString()} onChange={e => setBathroomCount(parseInt(e.target.value) || 0)} />
              <Button size="icon" variant="outline" onClick={handleIncrease(setBathroomCount)}>
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Bedroom Count */}
          <div className="space-y-2">
            <Label htmlFor="bedroom-count">Bedroom Count</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={handleDecrease(setBedroomCount)}>
                <MinusIcon className="w-4 h-4" />
              </Button>
              <Input id="bedroom-count" placeholder="Enter bedroom count" type="number" value={bedroomCount.toString()} onChange={e => setBedroomCount(parseInt(e.target.value) || 0)} />
              <Button size="icon" variant="outline" onClick={handleIncrease(setBedroomCount)}>
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price-per-month">Price Per Month</Label>
          <Input id="price-per-month" placeholder="Enter price per month" type="number" value={pricePerMonth.toString()} onChange={e => setPricePerMonth(parseFloat(e.target.value) || 0)} />
        </div>
        <Button onClick={goToPrevious} type="submit">BACK</Button>
        <Button onClick={handleNext} type="submit">Next</Button>
      </form>
    </div>
  );
}

// MinusIcon and PlusIcon components remain unchanged


function MinusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  )
}


function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

