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

  const initAmenities = [
    { id: "airConditioning", label: "Air Conditioning", isRequired: false },
    { id: "fitnessCenter", label: "Fitness Center", isRequired: false },
    { id: "pool", label: "Pool", isRequired: false },
    { id: "dishwasher", label: "Dishwasher", isRequired: false },
    { id: "elevator", label: "Elevator", isRequired: false },
    { id: "wheelchairAccess", label: "Wheelchair Access", isRequired: false },
    { id: "doorman", label: "Doorman", isRequired: false },
    { id: "fireplace", label: "Fireplace", isRequired: false },
    { id: "wifi", label: "Wifi", isRequired: false },
    { id: "kitchen", label: "Kitchen", isRequired: false },
    { id: "dedicatedWorkspace", label: "Dedicated Workspace", isRequired: false },
    { id: "tv", label: "TV", isRequired: false },
    { id: "hairDryer", label: "Hair Dryer", isRequired: false },
    { id: "iron", label: "Iron", isRequired: false },
  ];

  const amenitiesOptions = [
    { id: 'airConditioning', label: 'Air Conditioning', isRequired: propertyDetails.airConditioning },
    { id: 'fitnessCenter', label: 'Fitness Center', isRequired: propertyDetails.fitnessCenter },
    { id: 'pool', label: 'Pool', isRequired: propertyDetails.pool },
    { id: 'dishwasher', label: 'Dishwasher', isRequired: propertyDetails.dishwasher },
    { id: 'elevator', label: 'Elevator', isRequired: propertyDetails.elevator },
    { id: 'wheelchairAccess', label: 'Wheelchair Access', isRequired: propertyDetails.wheelchairAccess },
    { id: 'doorman', label: 'Doorman', isRequired: propertyDetails.doorman },
    { id: 'parking', label: 'Parking', isRequired: propertyDetails.parking },
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

  const parkingOptions = [
    { id: 'street', label: 'Street' },
    { id: 'uncovered', label: 'Uncovered' },
    { id: 'Covered', label: 'Covered' },
    { id: 'Garage', label: 'Garage' },
  ]

  const parkingFreeOptions = [
    { id: 'street', label: '' },
    { id: 'uncovered', label: '' },
    { id: 'Covered', label: '' },
    { id: 'Garage', label: '' },
  ]

  const [amenities, setAmenities] = useState(initAmenities);
  const [allowDogs, setAllowDogs] = useState(false);
  const [allowCats, setAllowCats] = useState(false);
  const [washerType, setWasherType] = useState('');
  const [dryerType, setDryerType] = useState('');
  const [parkingType, setParkingType] = useState<string[]>([]);
  const [parkingIsFree, setParkingIsFree] = useState<string[]>([]);
  const { user } = useUser();

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
    // setPropertyDetails(prev => {
    //   const newState = { ...prev };

    //   if (washerType) {
    //     newState[washerType] = true;
    //   }
    //   if (dryerType) {
    //     newState[dryerType] = true;
    //   }
    //   if (allowDogs) {
    //     newState['allowDogs'] = true;
    //   }
    //   if (allowCats) {
    //     newState['allowCats'] = true;
    //   }


    //   amenities.forEach(item => {
    //     if (item.isRequired) {
    //       newState[item.id] = item.isRequired;
    //     }
    //   });

    //   // Add each parking type to the newState object with a value of true
    //   parkingType.forEach(type => {
    //     newState[type] = true;
    //   });

    //   // Add each free parking type to the newState object with a value of true
    //   parkingIsFree.forEach(type => {
    //     newState[type] = true;
    //   });

    //   return newState;
    // });

    goToNext();
  };

  const handleCheck = (id: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleParkingSelection = (id: string) => {
    setParkingType((prevParkingType) => {
      if (prevParkingType.includes(id)) {
        // If the id exists, remove it from the array
        return prevParkingType.filter((type) => type !== id);
      } else {
        // If the id does not exist, add it to the array
        return [...prevParkingType, id];
      }
    });
    setPropertyDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleParkingIsFreeSelection = (id: string) => {
    setParkingIsFree((prevParkingIsFree) => {
      if (prevParkingIsFree.includes(id)) {
        // If the id exists, remove it from the array
        return prevParkingIsFree.filter((type) => type !== id);
      } else {
        // If the id does not exist, add it to the array
        return [...prevParkingIsFree, id];
      }
    });
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
      <div className="flex justify-evenly mb-5">
        <BrandRadio name="washer" options={washerOptions} setSelectedValue={setWasherDetails} selectedValue={propertyDetails.washerInUnit ? 'washerInUnit' : propertyDetails.washerHookup ? 'washerHookup' : propertyDetails.washerNotAvailable ? 'washerNotAvailable' : propertyDetails.washerInComplex ? 'washerInComplex' : ''} radioLabel="Washer" vertical />
        <BrandRadio name="dryer" options={dryerOptions} setSelectedValue={setDryerDetails} selectedValue={propertyDetails.dryerInUnit ? 'dryerInUnit' : propertyDetails.dryerHookup ? 'dryerHookup' : propertyDetails.dryerNotAvailable ? 'dryerNotAvailable' : propertyDetails.dryerInComplex ? 'dryerInComplex' : ''} radioLabel="Dryer" vertical />
      </div>

      <h3 className="text-center text-2xl mb-5 border-b-2">Parking</h3>
      <div className="flex w-4/5 mb-2  mx-auto justify-evenly">
        <div className="flex-col">
          <h4 className="text-center text-xl font-semibold border-b-2">Type</h4>
          <CheckboxDemo
            isChecked={propertyDetails.streetParking}
            justifyDirection="end"
            label="Street"
            handleChange={handleParkingSelection}
            details={{ id: 'streetParking', label: 'Street', isRequired: propertyDetails.streetParking }}
          />
          <CheckboxDemo
            isChecked={propertyDetails.coveredParking}
            justifyDirection="end"
            label="Covered"
            handleChange={handleParkingSelection}
            details={{ id: 'coveredParking', label: 'Covered', isRequired: propertyDetails.coveredParking }}
          />
          <CheckboxDemo
            isChecked={propertyDetails.uncoveredParking}
            justifyDirection="end"
            label="Uncovered"
            handleChange={handleParkingSelection}
            details={{ id: 'uncoveredParking', label: 'Uncovered', isRequired: propertyDetails.uncoveredParking }}
          />
          <CheckboxDemo
            isChecked={propertyDetails.garageParking}
            justifyDirection="end"
            label="Garage"
            handleChange={handleParkingSelection}
            details={{ id: 'garageParking', label: 'Garage', isRequired: propertyDetails.garageParking }}
          />
        </div>
        <div className="flex-col">
          <h4 className="text-center text-xl font-semibold border-b-2">Free?</h4>
          <CheckboxDemo
            label="Street Free"
            checkOnLeft
            isChecked={propertyDetails.streetFree}
            handleChange={handleParkingIsFreeSelection}
            details={{ id: 'streetFree', label: 'Street Free', isRequired: propertyDetails.streetFree }}
            disabled={!propertyDetails.streetParking}
          />
          <CheckboxDemo
            label="Covered Free"
            checkOnLeft
            isChecked={propertyDetails.coveredFree}
            handleChange={handleParkingIsFreeSelection}
            details={{ id: 'coveredFree', label: 'Covered Free', isRequired: propertyDetails.coveredFree }}
            disabled={!propertyDetails.coveredParking}
          />
          <CheckboxDemo
            label="Uncovered Free"
            checkOnLeft
            isChecked={propertyDetails.uncoveredFree}
            handleChange={handleParkingIsFreeSelection}
            details={{ id: 'uncoveredFree', label: 'Uncovered Free', isRequired: propertyDetails.uncoveredFree }}
            disabled={!propertyDetails.uncoveredParking}
          />
          <CheckboxDemo
            label="Garage Free"
            checkOnLeft
            isChecked={propertyDetails.garageFree}
            handleChange={handleParkingIsFreeSelection}
            details={{ id: 'garageFree', label: 'Garage Free', isRequired: propertyDetails.garageFree }}
            disabled={!propertyDetails.garageParking}
          />
        </div>
      </div>

      <h3 className="text-center text-2xl my-5 border-b-2">Other Amenities</h3>
      <div className="card  grid grid-cols-2 w-full mx-auto rounded-2xl py-2 pl-5">
        {amenitiesOptions.map((item, idx) => (
          <CheckboxDemo
            justifyDirection="left"
            label={item.label}
            key={item.id}
            isChecked={item.isRequired}
            details={item}
            handleChange={handleCheck}
            checkOnLeft
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

