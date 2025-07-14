import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StateSelect from '@/components/ui/state-select';

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
  const [invalidFields, setInvalidFields] = useState({
    title: false,
    description: false,
    street: false,
    city: false,
    state: false,
    postalCode: false,
    bathroomCount: false,
    bedroomCount: false,
    pricePerMonth: false,
  });

  const validateFields = () => {
    const newInvalidFields = {
      title: !title,
      description: !description,
      street: !street,
      city: !city,
      state: !state,
      postalCode: !postalCode,
      bathroomCount: bathroomCount <= 0,
      bedroomCount: bedroomCount <= 0,
      pricePerMonth: pricePerMonth <= 0,
    };
    setInvalidFields(newInvalidFields);

    return Object.values(newInvalidFields).every((isValid) => !isValid);
  };

  const handleNext = () => {
    if (validateFields()) {
      setPropertyDetails(prev => ({
        ...prev, title, description, streetAddress1: street, city, city, state: state, postalCode: postalCode, bathroomCount: bathroomCount, roomCount: bedroomCount, price: pricePerMonth, locationString: `${street}, ${city}, ${state}, ${postalCode}`
      }));
      goToNext();
    }
  };

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
            <Input id="title" placeholder="Enter property title" value={title} onChange={e => setTitle(e.target.value)} className={invalidFields.title ? 'border-2 border-red-500' : ''} />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter property description" value={description} onChange={e => setDescription(e.target.value)} className={invalidFields.description ? 'border-2 border-red-500' : ''} />
          </div>
          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input id="street" placeholder="Enter street" value={street} onChange={e => setStreet(e.target.value)} className={invalidFields.street ? 'border-2 border-red-500' : ''} />
          </div>
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Enter city" value={city} onChange={e => setCity(e.target.value)} className={invalidFields.city ? 'border-2 border-red-500' : ''} />
          </div>
          {/* State */}
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            {/* <Input id="state" placeholder="Enter state" value={state} onChange={e => setState(e.target.value)} className={invalidFields.state ? 'border-2 border-red-500' : ''} /> */}
            <StateSelect id='state' value={state} setState={setState} invalidFields={invalidFields} />
          </div>
          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input id="postal-code" placeholder="Enter postal code" value={postalCode} onChange={e => setPostalCode(e.target.value)} className={invalidFields.postalCode ? 'border-2 border-red-500' : ''} />
          </div>
          {/* Bathroom Count */}
          <div className="space-y-2">
            <Label htmlFor="bathroom-count">Bathroom Count</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setBathroomCount(prev => prev > 0 ? prev - 1 : 0)}>
                <MinusIcon />
              </Button>
              <Input id="bathroom-count" placeholder="Enter bathroom count" type="number" step="0.5" value={bathroomCount.toString()} onChange={e => setBathroomCount(parseFloat(e.target.value) || 0)} className={invalidFields.bathroomCount ? 'border-2 border-red-500' : ''} />
              <Button size="icon" variant="outline" onClick={() => setBathroomCount(prev => prev + 1)}>
                <PlusIcon />
              </Button>
            </div>
          </div>
          {/* Bedroom Count */}
          <div className="space-y-2">
            <Label htmlFor="bedroom-count">Bedroom Count</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setBedroomCount(prev => prev > 0 ? prev - 1 : 0)}>
                <MinusIcon />
              </Button>
              <Input id="bedroom-count" placeholder="Enter bedroom count" type="number" value={bedroomCount.toString()} onChange={e => setBedroomCount(parseInt(e.target.value) || 0)} className={invalidFields.bedroomCount ? 'border-2 border-red-500' : ''} />
              <Button size="icon" variant="outline" onClick={() => setBedroomCount(prev => prev + 1)}>
                <PlusIcon />
              </Button>
            </div>
          </div>
          {/* Price Per Month */}
          <div className="space-y-2">
            <Label htmlFor="price-per-month">Price Per Month</Label>
            <Input id="price-per-month" placeholder="Enter price per month" type="number" value={pricePerMonth.toString()} onChange={e => setPricePerMonth(parseFloat(e.target.value) || 0)} className={invalidFields.pricePerMonth ? 'border-2 border-red-500' : ''} />
          </div>
        </div>
        <div className="flex justify-between">
          <Button onClick={goToPrevious} type="button">Back</Button>
          <Button onClick={handleNext} type="button">Next</Button>
        </div>
      </form>
    </div>
  );
}

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
