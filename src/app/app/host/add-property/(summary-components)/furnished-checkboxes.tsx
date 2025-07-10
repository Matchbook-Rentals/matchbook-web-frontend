import React from 'react';
import { CheckboxDemo } from '@/app/app/preferences/custom-checkbox';

interface FurnishedCheckboxesProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

const FurnishedCheckboxes: React.FC<FurnishedCheckboxesProps> = ({ propertyDetails, setPropertyDetails }) => (
  <div className="flex scale-75 justify-center w-full">
    <CheckboxDemo label="Furnished" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, furnished: !propertyDetails.furnished })} isChecked={propertyDetails.furnished} details={{ id: 'furnished' }} />
    <CheckboxDemo label="Unfurnished" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, furnished: !propertyDetails.furnished })} isChecked={!propertyDetails.furnished} details={{ id: 'unfurnished' }} />
  </div>
);

export default FurnishedCheckboxes;