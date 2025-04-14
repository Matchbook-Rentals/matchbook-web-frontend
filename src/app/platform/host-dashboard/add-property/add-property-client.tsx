'use client';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Paddle from "@/components/ui/paddle";
import * as AmenitiesIcons from '@/components/icons/amenities';
import ProgressBar, { StepInfo } from "./progress-bar";

export default function WebLandlord() {
  // State to track current step and animation direction
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [animationKey, setAnimationKey] = useState<number>(0);
  
  // We can remove this ref since we're using window.scrollTo

  // Define steps
  const steps: StepInfo[] = [
    { name: "Highlights", position: 0 },
    { name: "Details", position: 1 },
    { name: "Photos", position: 2 },
    { name: "Pricing", position: 3 },
    { name: "Review", position: 4 },
  ];

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

  // Handler for Save & Exit button
  const handleSaveExit = () => {
    console.log("Save and Exit clicked");
    // Implement save and exit functionality
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('right'); // Slide from right to left (next)
      setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
      setCurrentStep(currentStep + 1);
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection('left'); // Slide from left to right (back)
      setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
      setCurrentStep(currentStep - 1);
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
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
                      onClick={() => setSelectedType(type.name)}
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
                      onClick={() => setSelectedFurnishing(option.name)}
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
                      onClick={() => setSelectedUtilities(option.name)}
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
                      onClick={() => setSelectedPets(option.name)}
                    />
                  );
                })}
              </div>
            </section>
          </>
        );
      case 1:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 2: Details
            </h2>
          </div>
        );
      case 2:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 3: Photos
            </h2>
          </div>
        );
      case 3:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 4: Pricing
            </h2>
          </div>
        );
      case 4:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 5: Review
            </h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full min-h-screen">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-12 pb-32">
        {/* Progress bar component */}
        <ProgressBar 
          currentStep={currentStep} 
          steps={steps}
          onSaveExit={handleSaveExit}
        />

        {/* Main content with slide animation */}
        <div className="mx-auto w-full max-w-[891px] overflow-hidden mb-24">
          <div 
            key={animationKey} // Adding key to force re-render on each step change
            className="transition-transform duration-500 ease-in-out"
            style={{
              animation: `${slideDirection === 'right' ? 'slideInRight' : 'slideInLeft'} 0.5s forwards`,
              minHeight: 'calc(100vh - 300px)' // Ensure enough space for content plus buttons
            }}
          >
            {renderStepContent()}
          </div>
        </div>
        
        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Footer with navigation buttons - fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <Separator className="w-full" />
          <div className="flex justify-between mx-auto w-full max-w-[891px] py-4">
            <Button 
              className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button 
              className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
        
{/* Removed redundant padding div as we've added padding elsewhere */}
      </div>
    </main>
  );
};
