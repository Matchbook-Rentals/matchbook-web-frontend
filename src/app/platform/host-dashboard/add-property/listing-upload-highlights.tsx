import React, { useState } from "react";
import Paddle from "@/components/ui/paddle";
import * as AmenitiesIcons from '@/components/icons/amenities';

interface ListingHighlightsState {
  category: string | null;
  petsAllowed: boolean | null;
  furnished: boolean | null;
  utilitiesIncluded: boolean | null;
}

interface ListingUploadHighlightsProps {
  propertyDetails: any;
  setPropertyDetails: (details: any) => void;
}

const ListingUploadHighlights: React.FC<ListingUploadHighlightsProps> = ({
  propertyDetails,
  setPropertyDetails,
}) => {
  // Local state for tracking selections
  const [selectedType, setSelectedType] = useState<string>(propertyDetails.propertyType || "Single Family");
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>(propertyDetails.furnishingType || "Furnished");
  const [selectedUtilities, setSelectedUtilities] = useState<string>(propertyDetails.utilitiesIncluded ? "Included in rent" : "Paid separately");
  const [selectedPets, setSelectedPets] = useState<string>(propertyDetails.petsAllowed ? "Pets welcome" : "No pets");

  // Property type options data
  const propertyTypes = [
    {
      id: "single-family",
      name: "Single Family",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" />
    },
    {
      id: "apartment",
      name: "Apartment",
      icon: <AmenitiesIcons.UpdatedApartmentIcon className="w-full h-full" />
    },
    {
      id: "townhouse",
      name: "Townhouse",
      icon: <AmenitiesIcons.UpdatedTownhouseIcon className="w-full h-full" />
    },
    {
      id: "private-room",
      name: "Private Room",
      icon: <AmenitiesIcons.UpdatedSingleRoomIcon className="w-full h-full" />
    },
  ];

  // Furnishing options data
  const furnishingOptions = [
    {
      id: "furnished",
      name: "Furnished",
      icon: <AmenitiesIcons.UpdatedFurnishedIcon className="w-full h-full" />
    },
    {
      id: "unfurnished",
      name: "Unfurnished",
      icon: <AmenitiesIcons.UpdatedUnfurnishedIcon className="w-full h-full" />
    },
  ];

  // Utilities options data
  const utilitiesOptions = [
    {
      id: "included",
      name: "Included in rent",
      icon: <AmenitiesIcons.UpdatedUtilitiesIncludedIcon className="w-full h-full" />
    },
    {
      id: "separate",
      name: "Paid separately",
      icon: <AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon className="w-full h-full" />
    },
  ];

  // Pets options data
  const petsOptions = [
    {
      id: "pets-welcome",
      name: "Pets welcome",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" /> // Replace with actual pets icon when available
    },
    {
      id: "no-pets",
      name: "No pets",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" /> // Replace with actual no pets icon when available
    },
  ];

  // Helper function to determine if an option is selected
  const isSelected = (category: string, optionName: string) => {
    switch (category) {
      case "type":
        return selectedType === optionName;
      case "furnishing":
        return selectedFurnishing === optionName;
      case "utilities":
        return selectedUtilities === optionName;
      case "pets":
        return selectedPets === optionName;
      default:
        return false;
    }
  };

  return (
    <>
      <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-2xl mb-6">
        Listing Highlights
      </h2>

      {/* Property Type Section */}
      <section className="mb-12">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
          Type
        </h3>
        <div className="flex flex-wrap gap-8">
          {propertyTypes.map((type) => {
            const isTypeSelected = isSelected("type", type.name);
            return (
              <Paddle
                key={type.id}
                icon={type.icon}
                label={type.name}
                className={`h-[295px] w-[196px] cursor-pointer box-border  ${
                  isTypeSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border border-solid border-[#0000004c]"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center`}
                iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                onClick={() => {
                  setSelectedType(type.name);
                  setPropertyDetails({
                    ...propertyDetails,
                    propertyType: type.name
                  });
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Furnishings Section */}
      <section className="mb-12">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
          Furnishings
        </h3>
        <div className="flex gap-8">
          {furnishingOptions.map((option) => {
            const isFurnishingSelected = isSelected("furnishing", option.name);
            return (
              <Paddle
                key={option.id}
                icon={option.icon}
                label={option.name}
                className={`h-[297px] w-[197px] cursor-pointer box-border  ${
                  isFurnishingSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border border-solid border-[#0000004c]"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center`}
                iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                onClick={() => {
                  setSelectedFurnishing(option.name);
                  setPropertyDetails({
                    ...propertyDetails,
                    furnishingType: option.name
                  });
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Utilities Section */}
      <section className="mb-12">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
          Utilities
        </h3>
        <div className="flex gap-8">
          {utilitiesOptions.map((option) => {
            const isUtilitiesSelected = isSelected("utilities", option.name);
            return (
              <Paddle
                key={option.id}
                icon={option.icon}
                label={option.name}
                className={`h-[296px] w-[197px] cursor-pointer box-border  ${
                  isUtilitiesSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border border-solid border-[#0000004c]"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center px-4`}
                iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                onClick={() => {
                  setSelectedUtilities(option.name);
                  setPropertyDetails({
                    ...propertyDetails,
                    utilitiesIncluded: option.name === "Included in rent"
                  });
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Pets Section */}
      <section className="mb-12">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
          Pets
        </h3>
        <div className="flex gap-8">
          {petsOptions.map((option) => {
            const isPetsSelected = isSelected("pets", option.name);
            return (
              <Paddle
                key={option.id}
                icon={option.icon}
                label={option.name}
                className={`h-[296px] w-[197px] cursor-pointer box-border  ${
                  isPetsSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border border-solid border-[#0000004c]"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center px-4`}
                iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                onClick={() => {
                  setSelectedPets(option.name);
                  setPropertyDetails({
                    ...propertyDetails,
                    petsAllowed: option.name === "Pets welcome"
                  });
                }}
              />
            );
          })}
        </div>
      </section>
    </>
  );
};

export default ListingUploadHighlights;