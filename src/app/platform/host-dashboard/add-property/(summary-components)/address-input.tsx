import React from "react";
import AddressSuggest from "../address-suggest";

interface AddressInputProps {
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({
  propertyDetails,
  setPropertyDetails,
}) => (
  <div className="scale-75 flex justify-center mx-auto">
    <div
      id="property-address"
      className="w-full flex justify-center border-2 rounded-full py-3 px-6"
    >
      <AddressSuggest
        initialValue={propertyDetails.locationString ?? undefined}
        setPropertyDetails={setPropertyDetails}
      />
    </div>
  </div>
);

export default AddressInput;
