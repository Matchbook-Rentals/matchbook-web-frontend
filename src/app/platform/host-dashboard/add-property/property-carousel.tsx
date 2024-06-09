"use client";

import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import prisma from "@/lib/prismadb";
import PropertyTypeRadio from "./property-type-radio";
import { Button } from "@/components/ui/button";
import DetailsForm from "./details-form";
import ImageUploadForm from "./image-upload";
import LeaseTermsForm from "./lease-terms-form";
import PropertyAmenitySelect from "./property-amenities";
import Summary from "./summary";
import SimpleDetails from "./simple-details";

interface PropertyCarouselProps {
  handleListingCreation: () => void;
  setCurrStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function PropertyCarousel({
  handleListingCreation,
  setCurrStep,
}: PropertyCarouselProps) {
  const { isSignedIn, user } = useUser();

  // State to keep track of the current index
  const [api, setApi] = useState<CarouselApi>();
  const [propertyDetails, setPropertyDetails] = useState({
    // User (must get from server instead later)
    userId: user?.id,

    propertyType: "",
    bathroomCount: 0,
    bedroomCount: 0,
    roomCount: 0,
    guestCount: 0,

    // Lease Terms
    minimumLeaseLength: null,
    maximumLeaseLength: null,
    minimumLeasePrice: null,
    maximumLeasePrice: null,

    // Amenities
    furnished: false,
    airConditioning: false,
    laundryFacilities: false,
    fitnessCenter: false,
    pool: false,
    dishwasher: false,
    elevator: false,
    wheelchairAccess: false,
    doorman: false,
    parking: false,
    fireplace: false,
    wifi: false,
    kitchen: false,
    inUnitWasher: false,
    inUnitDryer: false,
    dedicatedWorkspace: false,
    tv: false,
    hairDryer: false,
    iron: false,
    heating: false,
    washer: false,
    dryer: false,
    hotTub: false,
    gym: false,
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    privateEntrance: false,
    secure: false,
    waterfront: false,
    beachfront: false,
    mountainView: false,
    streetParking: false,
    streetParkingFree: false,
    coveredParking: false,
    coveredParkingFree: false,
    uncoveredParking: false,
    uncoveredParkingFree: false,
    garageParking: false,
    garageParkingFree: false,
    allowDogs: false,
    allowCats: false,
  });
  const router = useRouter();

  // Function to go to the next question/component
  const goToNext = () => {
    console.log(propertyDetails);
    setCurrStep((prev) => prev + 1);
    api?.scrollNext();
  };

  // Function to go to the previous question/component
  const goToPrevious = () => {
    setCurrStep((prev) => prev - 1);
    api?.scrollPrev();
  };

  const handleFinish = (amenities) => {
    const tempPreferences = { ...propertyDetails, amenities };
    handleListingCreation();
    router.push(`/platform/host-dashboard`);
  };

  return (
    <Carousel
      className="lg:w-1/2 h-1/2 m-auto"
      opts={{ watchDrag: false }}
      setApi={setApi}
    // keyboardControls={false}
    >
      <CarouselContent>
        <CarouselItem>
          <PropertyTypeRadio
            setPropertyDetails={setPropertyDetails}
            propertyDetails={propertyDetails}
            goToNext={goToNext}
          />
        </CarouselItem>
        <CarouselItem>
          {/* <DetailsForm
            setPropertyDetails={setPropertyDetails}
            goToNext={goToNext}
            goToPrevious={goToPrevious}
          /> */}
          <SimpleDetails
            propertyDetails={propertyDetails}
            setPropertyDetails={setPropertyDetails}
            goToNext={goToNext}
            goToPrevious={goToPrevious}
          />

        </CarouselItem>
        <CarouselItem>
          <ImageUploadForm
            setPropertyDetails={setPropertyDetails}
            goToNext={goToNext}
            goToPrevious={goToPrevious}
            propertyDetails={propertyDetails}
          />
        </CarouselItem>
        <CarouselItem>
          <LeaseTermsForm
            goToNext={goToNext}
            goToPrevious={goToPrevious}
            setPropertyDetails={setPropertyDetails}
            propertyDetails={propertyDetails}
          />
        </CarouselItem>
        <CarouselItem>
          <h2 className=" text-center text-2xl my-10 font-semibold">
            Tell us more about your properties features
          </h2>
          <PropertyAmenitySelect
            handleListingCreation={handleListingCreation}
            goToPrevious={goToPrevious}
            goToNext={goToNext}
            setPropertyDetails={setPropertyDetails}
            propertyDetails={propertyDetails}
          />
        </CarouselItem>
        <CarouselItem>
          <Summary
            propertyDetails={propertyDetails}
            setPropertyDetails={setPropertyDetails}
            handleListingCreation={handleListingCreation}
            goToPrevious={goToPrevious}
          />
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>
  );
}
