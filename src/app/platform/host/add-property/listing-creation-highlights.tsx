import React, { useState, useEffect } from "react";
import Tile from "@/components/ui/tile";
import * as AmenitiesIcons from '@/components/icons/amenities';

// Using the same interface as in add-property-client.tsx
interface ListingHighlights {
  category: string | null;
  petsAllowed: boolean | null;
  furnished: boolean | null;
}

interface ListingUploadHighlightsProps {
  listingHighlights: ListingHighlights;
  setListingHighlights: (highlights: ListingHighlights) => void;
}

const ListingUploadHighlights: React.FC<ListingUploadHighlightsProps> = ({
  listingHighlights,
  setListingHighlights,
}) => {
  // Local state for tracking selections
  const [selectedType, setSelectedType] = useState<string>(listingHighlights.category || "Single Family");
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>(listingHighlights.furnished ? "Furnished" : "Unfurnished");
  const [selectedPets, setSelectedPets] = useState<string>(listingHighlights.petsAllowed ? "Pets welcome" : "No pets");

  // Update local state when props change
  useEffect(() => {
    setSelectedType(listingHighlights.category || "Single Family");
    setSelectedFurnishing(listingHighlights.furnished ? "Furnished" : "Unfurnished");
    setSelectedPets(listingHighlights.petsAllowed ? "Pets welcome" : "No pets");
  }, [listingHighlights]);

  // Property type options data
  const propertyTypes = [
    {
      id: "single-family",
      name: "Single Family",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-[44px] h-[44px]" />
    },
    {
      id: "apartment",
      name: "Apartment",
      icon: <AmenitiesIcons.UpdatedApartmentIcon className="w-[44px] h-[44px]" />
    },
    {
      id: "townhouse",
      name: "Townhouse",
      icon: <AmenitiesIcons.UpdatedTownhouseIcon className="w-[48px] h-[48px]" />
    },
    {
      id: "private-room",
      name: "Private Room",
      icon: <AmenitiesIcons.UpdatedSingleRoomIcon className="w-[48px] h-[48px]" />
    },
  ];

  // Furnishing options data
  const furnishingOptions = [
    {
      id: "furnished",
      name: "Furnished",
      icon: <AmenitiesIcons.UpdatedFurnishedIcon className="w-[44px] h-[44px]" />
    },
    {
      id: "unfurnished",
      name: "Unfurnished",
      icon: <AmenitiesIcons.UpdatedUnfurnishedIcon className="w-[44px] h-[44px]" />
    },
  ];


  // Pets options data
  const petsOptions = [
    {
      id: "pets-welcome",
      name: "Pets welcome",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-[44px] h-[44px]" /> // Replace with actual pets icon when available
    },
    {
      id: "no-pets",
      name: "No pets",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-[44px] h-[44px]" /> // Replace with actual no pets icon when available
    },
  ];

  // Helper function to determine if an option is selected
  const isSelected = (category: string, optionName: string) => {
    switch (category) {
      case "type":
        return selectedType === optionName;
      case "furnishing":
        return selectedFurnishing === optionName;
      case "pets":
        return selectedPets === optionName;
      default:
        return false;
    }
  };

  return (
    <>
      {/* Property Type Section */}
      <section className="mb-6">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2">
          What kind of property is it?
        </h3>
        <div className="flex flex-wrap gap-4">
          {propertyTypes.map((type) => {
            const isTypeSelected = isSelected("type", type.name);
            return (
              <Tile
                key={type.id}
                icon={type.icon}
                label={type.name}
                className={`cursor-pointer w-[116px] h-[131px] py-1.5 ${
                  isTypeSelected
                    ? "border-[3px] bg-background border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border-[2px] border-[#E3E3E3] hover:border-gray-400"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#404040] text-[15px] text-center leading-tight`}
                onClick={() => {
                  setSelectedType(type.name);
                  setListingHighlights({
                    ...listingHighlights,
                    category: type.name
                  });
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Furnishings Section */}
      <section className="mb-6">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2">
          Is it furnished or unfurnished?
        </h3>
        <div className="flex gap-4">
          {furnishingOptions.map((option) => {
            const isFurnishingSelected = isSelected("furnishing", option.name);
            return (
              <Tile
                key={option.id}
                icon={option.icon}
                label={option.name}
                className={`cursor-pointer w-[116px] h-[131px] py-1.5 ${
                  isFurnishingSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border-[2px] border-[#E3E3E3] hover:border-gray-400"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#404040] text-[15px] text-center leading-tight`}
                onClick={() => {
                  setSelectedFurnishing(option.name);
                  setListingHighlights({
                    ...listingHighlights,
                    furnished: option.name === "Furnished"
                  });
                }}
              />
            );
          })}
        </div>
      </section>


      {/* Pets Section */}
      <section className="mb-6">
        <h3 className="font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2">
          Do you allow pets?
        </h3>
        <div className="flex gap-4">
          {petsOptions.map((option) => {
            const isPetsSelected = isSelected("pets", option.name);
            return (
              <Tile
                key={option.id}
                icon={option.icon}
                label={option.name}
                className={`cursor-pointer w-[116px] h-[131px] py-1.5 ${
                  isPetsSelected
                    ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                    : "border-[2px] border-[#E3E3E3] hover:border-gray-400"
                }`}
                labelClassNames={`font-['Poppins',Helvetica] font-medium text-[#404040] text-[15px] text-center leading-tight px-1`}
                onClick={() => {
                  setSelectedPets(option.name);
                  setListingHighlights({
                    ...listingHighlights,
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
