'use client';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import * as AmenitiesIcons from '@/components/icons/amenities';

export default function WebLandlord() {
  // State to track selected options
  const [selectedType, setSelectedType] = useState<string>("Single Family");
  const [selectedFurnishing, setSelectedFurnishing] =
    useState<string>("Furnished");
  const [selectedUtilities, setSelectedUtilities] =
    useState<string>("Included in rent");
  const [selectedPets, setSelectedPets] = useState<string>("Pets welcome");

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
    <main className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-12">
        {/* Progress bar and navigation */}
        <div className="mx-auto w-full max-w-[885px] mb-12">
          <div className="relative w-full h-[95px]">
            <div className="absolute w-[883px] h-5 top-[46px] left-0">
              <div className="w-full h-[9px] top-1.5 rounded-[10px] absolute left-0 border border-solid border-[#0000004c]" />
              <div className="w-[21px] h-5 left-[115px] bg-[#5c9ac5] rounded-[10.5px/10px] shadow-[0px_4px_4px_#00000040] absolute top-0" />
            </div>

            <div className="absolute w-[120px] h-[7px] top-[53px] left-px bg-[#5c9ac5]" />

            <div className="w-[102px] h-[18px] top-[77px] left-[75px] font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-sm text-center absolute tracking-[0] leading-[normal]">
              Highlights
            </div>

            <div className="absolute w-[106px] h-[29px] top-0 left-[777px]">
              <div className="h-[29px] bg-white rounded-[15px] border-[0.5px] border-solid border-[#0000004c]">
                <div className="relative w-[89px] h-5 top-1 left-2">
                  <div className="w-[89px] h-5 top-0 left-0 font-['Montserrat',Helvetica] font-medium text-[#3f3f3f] text-xs text-center absolute tracking-[0] leading-[normal]">
                    Save &amp; Exit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto w-full max-w-[891px]">
          <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-2xl mb-6">
            Listing Highlights
          </h2>

          {/* Property Type Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Type
            </h3>
            <div className="flex flex-wrap gap-8">
              {propertyTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`w-[196px] h-[295px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("type", type.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedType(type.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="w-[80px] h-[80px] flex items-center justify-center mb-16">
                      {type.icon}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12">
                      {type.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Furnishings Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Furnishings
            </h3>
            <div className="flex gap-8">
              {furnishingOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[297px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("furnishing", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedFurnishing(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="w-[80px] h-[80px] flex items-center justify-center mb-16">
                      {option.icon}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Utilities Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Utilities
            </h3>
            <div className="flex gap-8">
              {utilitiesOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[296px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("utilities", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedUtilities(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="w-[80px] h-[80px] flex items-center justify-center mb-8">
                      {option.icon}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12 px-4">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Pets Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Pets
            </h3>
            <div className="flex gap-8">
              {petsOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[296px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("pets", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedPets(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="w-[80px] h-[80px] flex items-center justify-center mb-16">
                      {option.icon}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12 px-4">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Footer with navigation buttons */}
        <Separator className="w-full my-8" />
        <div className="flex justify-between mx-auto w-full max-w-[891px] mt-8">
          <Button className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base">
            Back
          </Button>
          <Button className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base">
            Next
          </Button>
        </div>
      </div>
    </main>
  );
};
