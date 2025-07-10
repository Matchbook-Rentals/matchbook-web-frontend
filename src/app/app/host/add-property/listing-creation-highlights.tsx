import React, { useState, useEffect } from "react";
import { ListingCreationCard } from './listing-creation-card';
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
  questionTextStyles?: string;
}

const ListingUploadHighlights: React.FC<ListingUploadHighlightsProps> = ({
  listingHighlights,
  setListingHighlights,
  questionTextStyles,
}) => {
  // Local state for tracking selections
  const [selectedType, setSelectedType] = useState<string>(listingHighlights.category || "Single Family");
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>(listingHighlights.furnished ? "Furnished" : "Unfurnished");
  const [selectedPets, setSelectedPets] = useState<string>(listingHighlights.petsAllowed ? "Pets Welcome" : "No Pets");

  // Update local state when props change
  useEffect(() => {
    setSelectedType(listingHighlights.category || "Single Family");
    setSelectedFurnishing(listingHighlights.furnished ? "Furnished" : "Unfurnished");
    setSelectedPets(listingHighlights.petsAllowed ? "Pets Welcome" : "No Pets");
  }, [listingHighlights]);

  // Property type options data
  const propertyTypes = [
    {
      id: "single-family",
      name: "Single Family",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-6 h-6" />
    },
    {
      id: "apartment",
      name: "Apartment",
      icon: <AmenitiesIcons.UpdatedApartmentIcon className="w-6 h-6" />
    },
    {
      id: "townhouse",
      name: "Town House",
      icon: <AmenitiesIcons.UpdatedTownhouseIcon className="w-6 h-6" />
    },
    {
      id: "private-room",
      name: "Private Room",
      icon: <AmenitiesIcons.UpdatedSingleRoomIcon className="w-6 h-6" />
    },
  ];

  // Furnishing options data
  const furnishingOptions = [
    {
      id: "furnished",
      name: "Furnished",
      icon: <AmenitiesIcons.UpdatedFurnishedIcon className="w-6 h-6" />
    },
    {
      id: "unfurnished",
      name: "Unfurnished",
      icon: <AmenitiesIcons.UpdatedUnfurnishedIcon className="w-6 h-6" />
    },
  ];


  // Pets options data
  const petsOptions = [
    {
      id: "pets-welcome",
      name: "Pets Welcome",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-6 h-6" /> // Replace with actual pets icon when available
    },
    {
      id: "no-pets",
      name: "No Pets",
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-6 h-6" /> // Replace with actual no pets icon when available
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
        <h3 className={questionTextStyles || "font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2"}>
          What kind of property is it?
        </h3>
        <div className="flex flex-wrap items-center gap-6 w-full">
          {propertyTypes.map((type) => {
            const isTypeSelected = isSelected("type", type.name);
            return (
              <ListingCreationCard
                key={type.id}
                name={type.name}
                icon={type.icon}
                isSelected={isTypeSelected}
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
        <h3 className={questionTextStyles || "font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2"}>
          Is it furnished or unfurnished?
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          {furnishingOptions.map((option) => {
            const isFurnishingSelected = isSelected("furnishing", option.name);
            return (
              <ListingCreationCard
                key={option.id}
                name={option.name}
                icon={option.icon}
                isSelected={isFurnishingSelected}
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
        <h3 className={questionTextStyles || "font-['Poppins',Helvetica] font-normal text-[#404040] text-2xl mb-4 mt-2"}>
          Do you allow pets?
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          {petsOptions.map((option) => {
            const isPetsSelected = isSelected("pets", option.name);
            return (
              <ListingCreationCard
                key={option.id}
                name={option.name}
                icon={option.icon}
                isSelected={isPetsSelected}
                onClick={() => {
                  setSelectedPets(option.name);
                  setListingHighlights({
                    ...listingHighlights,
                    petsAllowed: option.name === "Pets Welcome"
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
