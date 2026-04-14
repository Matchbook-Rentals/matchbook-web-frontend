import React, { useState, useEffect } from "react";
import { ListingCreationCard } from './listing-creation-card';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { SingleFamilyIcon, ApartmentIcon, TownhouseIcon, PrivateRoomIcon, FurnishedIcon, UnfurnishedIcon, PetsAllowedIcon, NoPetsIcon } from '@/components/icons-v3/amenities';
import Image from 'next/image';

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
  // Helper function to convert camelCase to display name
  const categoryToDisplay = (category: string | null): string => {
    switch (category) {
      case 'singleFamily':
        return 'Single Family';
      case 'privateRoom':
        return 'Private Room';
      case 'apartment':
        return 'Apartment';
      case 'townhouse':
        return 'Townhouse';
      default:
        return 'Single Family';
    }
  };

  // Local state for tracking selections
  const [selectedType, setSelectedType] = useState<string>(categoryToDisplay(listingHighlights.category));
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>(listingHighlights.furnished ? "Furnished" : "Unfurnished");
  const [selectedPets, setSelectedPets] = useState<string>(listingHighlights.petsAllowed ? "Pets Welcome" : "No Pets");

  // Update local state when props change
  useEffect(() => {
    setSelectedType(categoryToDisplay(listingHighlights.category));
    setSelectedFurnishing(listingHighlights.furnished ? "Furnished" : "Unfurnished");
    setSelectedPets(listingHighlights.petsAllowed ? "Pets Welcome" : "No Pets");
  }, [listingHighlights]);

  // Property type options data
  const propertyTypes = [
    {
      id: "single-family",
      name: "Single Family",
      value: "singleFamily",
      icon: <SingleFamilyIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
    {
      id: "apartment",
      name: "Apartment",
      value: "apartment",
      icon: <ApartmentIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
    {
      id: "townhouse",
      name: "Townhouse",
      value: "townhouse",
      icon: <TownhouseIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
    {
      id: "private-room",
      name: "Private Room",
      value: "privateRoom",
      icon: <PrivateRoomIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
  ];

  // Furnishing options data
  const furnishingOptions = [
    {
      id: "furnished",
      name: "Furnished",
      icon: <FurnishedIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
    {
      id: "unfurnished",
      name: "Unfurnished",
      icon: <UnfurnishedIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
  ];


  // Pets options data
  const petsOptions = [
    {
      id: "pets-welcome",
      name: "Pets Welcome",
      icon: <PetsAllowedIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
    },
    {
      id: "no-pets",
      name: "No Pets",
      icon: <NoPetsIcon className="w-full h-full scale-[1.25] md:scale-[1.33]" />
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
                    category: type.value
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
