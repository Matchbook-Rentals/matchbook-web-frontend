import React from 'react';
import { Input } from "@/components/ui/input";

interface InputFieldsProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

const InputFields: React.FC<InputFieldsProps> = ({ propertyDetails, setPropertyDetails }) => (
  <div className="flex justify-between">
    <div className="flex flex-col items-center mb-4">
      <label htmlFor="bedrooms" className="font-medium">Bedrooms:</label>
      <Input
        id="bedrooms"
        type="number"
        placeholder="Bedrooms"
        min="0"
        value={typeof propertyDetails.roomCount === 'number' || typeof propertyDetails.roomCount === 'string' ? propertyDetails.roomCount : ''}
        onChange={(e) => setPropertyDetails({ ...propertyDetails, roomCount: e.target.value })}
        className="rounded-full text-center"
      />
    </div>
    <div className="flex flex-col items-center mb-4">
      <label htmlFor="bathrooms" className="font-medium">Bathrooms:</label>
      <Input
        id="bathrooms"
        type="number"
        placeholder="Bathrooms"
        min="0"
        value={typeof propertyDetails.bathroomCount === 'number' || typeof propertyDetails.bathroomCount === 'string' ? propertyDetails.bathroomCount : ''}
        onChange={(e) => setPropertyDetails({ ...propertyDetails, bathroomCount: e.target.value })}
        className="rounded-full text-center"
      />
    </div>
    <div className="flex flex-col items-center mb-4">
      <label htmlFor="squareFootage" className="font-medium">Square Footage:</label>
      <Input
        id="squareFootage"
        type="number"
        placeholder="1000 sq ft."
        min="0"
        value={typeof propertyDetails.squareFootage === 'number' || typeof propertyDetails.squareFootage === 'string' ? propertyDetails.squareFootage : ''}
        onChange={(e) => setPropertyDetails({ ...propertyDetails, squareFootage: e.target.value })}
        className="rounded-full text-center"
      />
    </div>
  </div>
);

export default InputFields;