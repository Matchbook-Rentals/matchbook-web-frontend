import React from 'react';
import { CheckboxDemo } from '@/app/app/rent/preferences/custom-checkbox';

interface PropertyTypeCheckboxesProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

const PropertyTypeCheckboxes: React.FC<PropertyTypeCheckboxesProps> = ({ propertyDetails, setPropertyDetails }) => (
  <div className="flex scale-75 w-full">
    <CheckboxDemo label="Single Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'singleFamily' })} isChecked={propertyDetails.category === 'singleFamily'} details={{ id: 'singleFamily' }} />
    <CheckboxDemo label="Multi Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'multiFamily' })} isChecked={propertyDetails.category === 'multiFamily'} details={{ id: 'multiFamily' }} />
    <CheckboxDemo label="Townhouse" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'townhouse' })} isChecked={propertyDetails.category === 'townhouse'} details={{ id: 'townhouse' }} />
    <CheckboxDemo label="Apartment" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'apartment' })} isChecked={propertyDetails.category === 'apartment'} details={{ id: 'apartment' }} />
    <CheckboxDemo label="Private Room" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'privateRoom' })} isChecked={propertyDetails.category === 'privateRoom'} details={{ id: 'privateRoom' }} />
  </div>
);

export default PropertyTypeCheckboxes;
