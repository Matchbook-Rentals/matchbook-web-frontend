"use client";

import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
   CarouselApi,
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
  const [api, setApi] = useState<CarouselApi>();
  const router = useRouter();
  const [propertyDetails, setPropertyDetails] = useState({
    userId: user?.id,
    title: "",
    description: "",
    imageSrc: "",
    category: "",
    roomCount: 0,
    bathroomCount: 0,
    guestCount: 0,
    latitude: 0,
    longitude: 0,
    locationString: "",
    city: "",
    state: "",
    streetAddress1: "",
    streetAddress2: "",
    postalCode: "",
    squareFootage: 0,
    depositSize: 0,
    requireBackgroundCheck: false,
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
    washerInUnit: false,
    washerHookup: false,
    washerNotAvailable: false,
    washerInComplex: false,
    dryerInUnit: false,
    dryerHookup: false,
    dryerNotAvailable: false,
    dryerInComplex: false,
    dedicatedWorkspace: false,
    tv: false,
    hairDryer: false,
    iron: false,
    heating: false,
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goToNext = () => {
    console.log(propertyDetails);
    setCurrStep((prev) => prev + 1);
    api?.scrollNext();
    if (window.scrollY > 50) {
      window.scrollTo(0, 51);
    }
  };

  const goToPrevious = () => {
    // Ensure that currStep does not go below 1
    setCurrStep((prev) => Math.max(1, prev - 1));
    api?.scrollPrev();
    if (window.scrollY > 50) {
      window.scrollTo(0, 51);
    }
  };

  const handleFinish = (amenities) => {
    const tempPreferences = { ...propertyDetails, amenities };
    handleListingCreation();
    router.push(`/app/host/dashboard/listings`);
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
          <h2 className="text-3xl font-bold text-center mt-8">Lease Terms</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">Please select your minimum and maximum acceptable lease length</p>
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
    </Carousel>
  );
}
