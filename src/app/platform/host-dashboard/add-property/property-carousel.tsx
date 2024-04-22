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
// import ListingTypeRadio from './listing-type-radio';
// import RoomsCounter from './rooms-counter';
// import FurnishedSelect from './furnished-select';
// import AmenitiesSelect from './amenties-select';
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
  const [propertyDetails, setPropertyDetails] = useState({ userId: user?.id });
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
      className="w-1/2 h-1/2 m-auto"
      opts={{ watchDrag: false }}
      setApi={setApi}
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
          <p>DETAILS</p>
          <DetailsForm
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
          />
        </CarouselItem>
        <CarouselItem>
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
          handleListingCreation={handleListingCreation}
           />
        </CarouselItem>
      </CarouselContent>
      {/* <CarouselPrevious /> */}
      {/* <CarouselNext /> */}
    </Carousel>
  );
}
