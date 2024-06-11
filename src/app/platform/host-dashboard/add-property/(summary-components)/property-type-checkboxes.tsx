import React from 'react';
import { CheckboxDemo } from '@/app/platform/preferences/custom-checkbox';

interface PropertyTypeCheckboxesProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

const PropertyTypeCheckboxes: React.FC<PropertyTypeCheckboxesProps> = ({ propertyDetails, setPropertyDetails }) => (
  <div className="flex scale-75 w-full">
    <CheckboxDemo label="Single Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'single_family' })} isChecked={propertyDetails.category === 'single_family'} details={{ id: 'singleFamily' }} />
    <CheckboxDemo label="Multi Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'multi_family' })} isChecked={propertyDetails.category === 'multi_family'} details={{ id: 'multiFamily' }} />
    <CheckboxDemo label="Townhouse" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'townhouse' })} isChecked={propertyDetails.category === 'townhouse'} details={{ id: 'townhouse' }} />
    <CheckboxDemo label="Apartment" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'apartment' })} isChecked={propertyDetails.category === 'apartment'} details={{ id: 'apartment' }} />
    <CheckboxDemo label="Single Room" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'single_room' })} isChecked={propertyDetails.category === 'single_room'} details={{ id: 'singleRoom' }} />
  </div>
);

export default PropertyTypeCheckboxes;
