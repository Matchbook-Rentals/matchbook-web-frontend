// TODO: upgrade amenity icons to icons v3
"use client";
import React, { useState, Dispatch, SetStateAction } from "react";
import { CheckboxDemo } from "../../preferences/custom-checkbox";
import { Listing } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import BrandRadio from "@/components/ui/brand-radio";
import CarouselButtonControls from "./carousel-button-controls";

interface PropertyAmenitySelectProps {
  goToPrevious: () => void;
  goToNext: () => void;
  setPropertyDetails: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual preference type you expect
  propertyDetails: Listing;
  withButton?: boolean; // New optional prop
}

const PropertyAmenitySelect: React.FC<PropertyAmenitySelectProps> = ({
  goToPrevious,
  goToNext,
  setPropertyDetails, // Updated prop name
  propertyDetails,
  withButton = true, // Default value set to true
}) => {

  const amenitiesOptions = [
    { id: 'airConditioning', label: 'Air Conditioning', isRequired: propertyDetails.airConditioning },
    { id: 'fitnessCenter', label: 'Fitness Center', isRequired: propertyDetails.fitnessCenter },
    { id: 'dishwasher', label: 'Dishwasher', isRequired: propertyDetails.dishwasher },
    { id: 'pool', label: 'Pool', isRequired: propertyDetails.pool },
    { id: 'elevator', label: 'Elevator', isRequired: propertyDetails.elevator },
    { id: 'wheelchairAccess', label: 'Wheelchair Access', isRequired: propertyDetails.wheelchairAccess },
    { id: 'doorman', label: 'Doorman', isRequired: propertyDetails.doorman },
    { id: 'fireplace', label: 'Fireplace', isRequired: propertyDetails.fireplace },
    { id: 'wifi', label: 'Wifi', isRequired: propertyDetails.wifi },
    { id: 'kitchen', label: 'Kitchen', isRequired: propertyDetails.kitchen },
    { id: 'dedicatedWorkspace', label: 'Dedicated Workspace', isRequired: propertyDetails.dedicatedWorkspace },
    { id: 'tv', label: 'TV', isRequired: propertyDetails.tv },
    { id: 'hairDryer', label: 'Hair Dryer', isRequired: propertyDetails.hairDryer },
    { id: 'iron', label: 'Iron', isRequired: propertyDetails.iron },
    { id: 'heating', label: 'Heating', isRequired: propertyDetails.heating },
    { id: 'hotTub', label: 'Hot Tub', isRequired: propertyDetails.hotTub },
    { id: 'gym', label: 'Gym', isRequired: propertyDetails.gym },
    { id: 'smokingAllowed', label: 'Smoking Allowed', isRequired: propertyDetails.smokingAllowed },
    { id: 'eventsAllowed', label: 'Events Allowed', isRequired: propertyDetails.eventsAllowed },
    { id: 'privateEntrance', label: 'Private Entrance', isRequired: propertyDetails.privateEntrance },
    { id: 'secure', label: 'Secure', isRequired: propertyDetails.secure },
    { id: 'waterfront', label: 'Waterfront', isRequired: propertyDetails.waterfront },
    { id: 'beachfront', label: 'Beachfront', isRequired: propertyDetails.beachfront },
    { id: 'mountainView', label: 'Mountain View', isRequired: propertyDetails.mountainView },
  ]

  const structuralOptions = [
    { id: 'balcony', label: 'Balcony', isRequired: propertyDetails.balcony },
    { id: 'patio', label: 'Patio', isRequired: propertyDetails.patio },
    { id: 'sunroom', label: 'Sunroom', isRequired: propertyDetails.sunroom },
    { id: 'firepit', label: 'Firepit', isRequired: propertyDetails.firepit },
    { id: 'fireplace', label: 'Fireplace', isRequired: propertyDetails.fireplace },
    { id: 'pool', label: 'Pool', isRequired: propertyDetails.pool },
    { id: 'jacuzzi', label: 'Jacuzzi', isRequired: propertyDetails.jacuzzi },
    { id: 'grill', label: 'Grill', isRequired: propertyDetails.grill },
    { id: 'wifi', label: 'Wifi', isRequired: propertyDetails.wifi },
    { id: 'oven', label: 'Oven', isRequired: propertyDetails.oven },
    { id: 'stove', label: 'Stove', isRequired: propertyDetails.stove },
    { id: 'gym', label: 'Gym', isRequired: propertyDetails.gym },
    { id: 'wheelAccessible', label: 'Wheel Accessible', isRequired: propertyDetails.wheelAccessible },
    { id: 'fencedInYard', label: 'Fenced in yard', isRequired: propertyDetails.fencedInYard },
    { id: 'doorman', label: 'Doorman', isRequired: propertyDetails.doorman },
    { id: 'secureLobby', label: 'Secure lobby', isRequired: propertyDetails.secureLobby },
    { id: 'keylessEntry', label: 'Keyless entry', isRequired: propertyDetails.keylessEntry },
    { id: 'alarmSystem', label: 'Alarm system', isRequired: propertyDetails.alarmSystem },
    { id: 'storageShed', label: 'Storage Shed', isRequired: propertyDetails.storageShed },
    { id: 'airConditioning', label: 'Air conditioning', isRequired: propertyDetails.airConditioning },
    { id: 'heating', label: 'Heating', isRequired: propertyDetails.heating },
    { id: 'evCharging', label: 'EV Charging', isRequired: propertyDetails.evCharging },
  ]

  const kitchenOptions = [
    { id: 'kitchen', label: 'Kitchen', isRequired: propertyDetails.kitchen },
    { id: 'garbageDisposal', label: 'Garbage disposal', isRequired: propertyDetails.garbageDisposal },
    { id: 'dishwasher', label: 'Dishwasher', isRequired: propertyDetails.dishwasher },
  ]

  const furnishedOptions = [
    { id: 'tv', label: 'TV', isRequired: propertyDetails.tv },
    { id: 'workstation', label: 'Workstation', isRequired: propertyDetails.workstation },
    { id: 'microwave', label: 'Microwave', isRequired: propertyDetails.microwave },
    { id: 'kitchenEssentails', label: 'Kitchen essentails', isRequired: propertyDetails.kitchenEssentails },
    { id: 'linens', label: 'Linens', isRequired: propertyDetails.linens },
  ]

  let generalAmenities = [

    // Utilities and Comfort
    { id: 'airConditioning', label: 'Air Conditioning', isRequired: propertyDetails.airConditioning },
    { id: 'evCharging', label: 'EV Charging', isRequired: propertyDetails.evCharging },
    { id: 'heating', label: 'Heating', isRequired: propertyDetails.heating },
    { id: 'gym', label: 'Gym', isRequired: propertyDetails.gym },
    { id: 'privateBathroom', label: 'Private Bathroom', isRequired: propertyDetails.privateBathroom },
    { id: 'wifi', label: 'Wifi', isRequired: propertyDetails.wifi },

    // Security and Accessibility
    { id: 'alarmSystem', label: 'Alarm System', isRequired: propertyDetails.alarmSystem },
    { id: 'doorman', label: 'Doorman', isRequired: propertyDetails.doorman },
    { id: 'keylessEntry', label: 'Keyless Entry', isRequired: propertyDetails.keylessEntry },
    { id: 'secureLobby', label: 'Secure Lobby', isRequired: propertyDetails.secureLobby },
    { id: 'wheelAccessible', label: 'Wheel Accessible', isRequired: propertyDetails.wheelAccessible },

    // Kitchen Appliances
    { id: 'dishwasher', label: 'Dishwasher', isRequired: propertyDetails.dishwasher },
    { id: 'garbageDisposal', label: 'Garbage Disposal', isRequired: propertyDetails.garbageDisposal },
    { id: 'oven', label: 'Oven', isRequired: propertyDetails.oven },
    { id: 'stove', label: 'Stove', isRequired: propertyDetails.stove },

    // Structural Amenities
    { id: 'balcony', label: 'Balcony', isRequired: propertyDetails.balcony },
    { id: 'fencedInYard', label: 'Fenced In Yard', isRequired: propertyDetails.fencedInYard },
    { id: 'firepit', label: 'Firepit', isRequired: propertyDetails.firepit },
    { id: 'fireplace', label: 'Fireplace', isRequired: propertyDetails.fireplace },
    { id: 'grill', label: 'Grill', isRequired: propertyDetails.grill },
    { id: 'jacuzzi', label: 'Jacuzzi', isRequired: propertyDetails.jacuzzi },
    { id: 'patio', label: 'Patio', isRequired: propertyDetails.patio },
    { id: 'pool', label: 'Pool', isRequired: propertyDetails.pool },
    { id: 'storageShed', label: 'Storage Shed', isRequired: propertyDetails.storageShed },
    { id: 'sunroom', label: 'Sunroom', isRequired: propertyDetails.sunroom },
  ];

  let generalPlusFurnished = [...generalAmenities, ...furnishedOptions];

  const washerOptions = [
    { id: 'washerInUnit', label: 'In-Unit' },
    { id: 'washerHookup', label: 'Hookup' },
    { id: 'washerNotAvailable', label: 'Not available' },
    { id: 'washerInComplex', label: 'In complex' },
  ]

  const dryerOptions = [
    { id: 'dryerInUnit', label: 'In-Unit' },
    { id: 'dryerHookup', label: 'Hookup' },
    { id: 'dryerNotAvailable', label: 'Not available' },
    { id: 'dryerInComplex', label: 'In complex' },
  ]

  const parkingCheckboxes = [
    { id: 'streetParking', label: 'Street' },
    { id: 'uncoveredParking', label: 'Uncovered' },
    { id: 'coveredParking', label: 'Covered' },
    { id: 'garageParking', label: 'Garage' },
  ]

  const parkingFreeCheckboxes = [
    { id: 'streetParkingFree', label: 'Street' },
    { id: 'uncoveredParkingFree', label: 'Uncovered' },
    { id: 'coveredParkingFree', label: 'Covered' },
    { id: 'garageParkingFree', label: 'Garage' },
  ]

  const setWasherDetails: Dispatch<SetStateAction<string>> = (washerType: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      washerInUnit: false,
      washerHookup: false,
      washerNotAvailable: false,
      washerInComplex: false,
      [washerType]: true
    }));
  }

  const setDryerDetails: Dispatch<SetStateAction<string>> = (dryerType: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      dryerInUnit: false,
      dryerHookup: false,
      dryerNotAvailable: false,
      dryerInComplex: false,
      [dryerType]: true
    }));
  }

  const handleNext = () => {
    goToNext();
  };

  const handleCheck = (id: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleParkingSelection = (id: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleParkingIsFreeSelection = (id: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>

      <h3 className="text-center text-2xl mb-5 border-b-2">Pets welcome?</h3>
      <div className="flex w-4/5 mb-2  mx-auto justify-evenly">

        <CheckboxDemo label="Dogs Allowed" handleChange={() => setPropertyDetails(prev => ({ ...prev, allowDogs: !prev.allowDogs }))} isChecked={propertyDetails.allowDogs} details={{ id: 'dogs', label: 'dogs', isRequired: propertyDetails.allowDogs }} />
        <CheckboxDemo label="Cats Allowed" checkOnLeft handleChange={() => setPropertyDetails(prev => ({ ...prev, allowCats: !prev.allowCats }))} details={{ id: 'cats', label: 'cats', isRequired: propertyDetails.allowCats }} />
      </div>


      <h3 className="text-center text-2xl mb-5 border-b-2">Laundry</h3>
      <div className="flex justify-evenly mb-5 lg:w-3/4 mx-auto">
        <BrandRadio name="washer" options={washerOptions} setSelectedValue={setWasherDetails} selectedValue={propertyDetails.washerInUnit ? 'washerInUnit' : propertyDetails.washerHookup ? 'washerHookup' : propertyDetails.washerNotAvailable ? 'washerNotAvailable' : propertyDetails.washerInComplex ? 'washerInComplex' : ''} radioLabel="Washer" vertical />
        <BrandRadio name="dryer" options={dryerOptions} circleOnLeft setSelectedValue={setDryerDetails} selectedValue={propertyDetails.dryerInUnit ? 'dryerInUnit' : propertyDetails.dryerHookup ? 'dryerHookup' : propertyDetails.dryerNotAvailable ? 'dryerNotAvailable' : propertyDetails.dryerInComplex ? 'dryerInComplex' : ''} radioLabel="Dryer" vertical />
      </div>

      <h3 className="text-center text-2xl mb-5 border-b-2">Parking</h3>
      <div className="flex w-4/5 mb-2  mx-auto justify-evenly">
        <div className="flex-col">
          <h4 className="text-center text-xl font-semibold border-b-2">Type</h4>
          {parkingCheckboxes.map((checkbox) => (
            <CheckboxDemo
              key={checkbox.id}
              isChecked={propertyDetails[checkbox.id]}
              label={checkbox.label}
              justifyDirection="end"
              handleChange={handleParkingSelection}
              details={checkbox}
            />
          ))}
        </div>
        <div className="flex-col">
          <h4 className="text-center text-xl font-semibold border-b-2">Free?</h4>
          {parkingFreeCheckboxes.map((checkbox) => (
            <CheckboxDemo
              key={checkbox.id}
              checkOnLeft
              disabled={!propertyDetails[checkbox.id.slice(0, -4)]}
              isChecked={propertyDetails[checkbox.id]}
              label={checkbox.label}
              handleChange={handleParkingIsFreeSelection}
              details={checkbox}
            />
          ))}
        </div>
      </div>

      <h3 className="text-center text-2xl my-5 border-b-2">Other Amenities</h3>
      <div className=" grid grid-cols-2 gap-x-20 gap-y-1 w-full mx-auto rounded-2xl py-2 pl-5">
        {(propertyDetails.furnished ? generalPlusFurnished : generalAmenities).map((item, idx) => (
          <CheckboxDemo
            justifyDirection={idx % 2 === 0 ? "end" : "left"}
            label={item.label}
            key={item.id}
            isChecked={item.isRequired}
            details={item}
            handleChange={handleCheck}
            checkOnLeft={idx % 2 !== 0}
          />
        ))}
      </div>
      {withButton && (
        <CarouselButtonControls
          onBack={goToPrevious}
          onNext={handleNext}
          backLabel="BACK"
          nextLabel="NEXT"
        />
      )}
    </>
  );
};

export default PropertyAmenitySelect;

