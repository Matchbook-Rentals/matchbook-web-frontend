"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - AMENITIES SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * 
 * GENERAL AMENITIES:
 * - airConditioner: Boolean @default(false)
 * - laundryFacilities: Boolean @default(false)
 * - fitnessCenter: Boolean @default(false)
 * - elevator: Boolean @default(false)
 * - wheelchairAccess: Boolean @default(false)
 * - doorman: Boolean @default(false)
 * - parking: Boolean @default(false)
 * - wifi: Boolean @default(false)
 * - kitchen: Boolean @default(false)
 * - dedicatedWorkspace: Boolean @default(false)
 * - hairDryer: Boolean @default(false)
 * - iron: Boolean @default(false)
 * - heater: Boolean @default(false)
 * - hotTub: Boolean @default(false)
 * - smokingAllowed: Boolean @default(false)
 * - eventsAllowed: Boolean @default(false)
 * - privateEntrance: Boolean @default(false)
 * - security: Boolean @default(false)
 * - waterfront: Boolean @default(false)
 * - beachfront: Boolean @default(false)
 * - mountainView: Boolean @default(false)
 * - cityView: Boolean @default(false)
 * - waterView: Boolean @default(false)
 * 
 * WASHER/DRYER OPTIONS:
 * - washerInUnit: Boolean @default(false)
 * - washerHookup: Boolean @default(false)
 * - washerNotAvailable: Boolean @default(false)
 * - washerInComplex: Boolean @default(false)
 * - dryerInUnit: Boolean @default(false)
 * - dryerHookup: Boolean @default(false)
 * - dryerNotAvailable: Boolean @default(false)
 * - dryerInComplex: Boolean @default(false)
 * 
 * PARKING OPTIONS:
 * - offStreetParking: Boolean @default(false)
 * - streetParking: Boolean @default(false)
 * - streetParkingFree: Boolean @default(false)
 * - coveredParking: Boolean @default(false)
 * - coveredParkingFree: Boolean @default(false)
 * - uncoveredParking: Boolean @default(false)
 * - uncoveredParkingFree: Boolean @default(false)
 * - garageParking: Boolean @default(false)
 * - garageParkingFree: Boolean @default(false)
 * - evCharging: Boolean @default(false)
 * 
 * PET POLICIES:
 * - allowDogs: Boolean @default(false)
 * - allowCats: Boolean @default(false)
 * 
 * STRUCTURAL AMENITIES:
 * - gym: Boolean @default(false)
 * - balcony: Boolean @default(false)
 * - patio: Boolean @default(false)
 * - sunroom: Boolean @default(false)
 * - fireplace: Boolean @default(false)
 * - firepit: Boolean @default(false)
 * - pool: Boolean @default(false)
 * - sauna: Boolean @default(false)
 * - jacuzzi: Boolean @default(false)
 * - grill: Boolean @default(false)
 * - oven: Boolean @default(false)
 * - stove: Boolean @default(false)
 * - wheelAccessible: Boolean @default(false)
 * - fencedInYard: Boolean @default(false)
 * - secureLobby: Boolean @default(false)
 * - keylessEntry: Boolean @default(false)
 * - alarmSystem: Boolean @default(false)
 * - storageShed: Boolean @default(false)
 * - gatedEntry: Boolean @default(false)
 * - smokeDetector: Boolean @default(false)
 * - carbonMonoxide: Boolean @default(false)
 * 
 * KITCHEN:
 * - garbageDisposal: Boolean @default(false)
 * - dishwasher: Boolean @default(false)
 * - fridge: Boolean @default(false)
 * 
 * FURNISHED:
 * - tv: Boolean @default(false)
 * - workstation: Boolean @default(false)
 * - microwave: Boolean @default(false)
 * - kitchenEssentials: Boolean @default(false)
 * - linens: Boolean @default(false)
 * - privateBathroom: Boolean @default(false)
 */
interface ListingAmenitiesSchema {
  // General Amenities
  airConditioner: boolean;
  laundryFacilities: boolean;
  fitnessCenter: boolean;
  elevator: boolean;
  wheelchairAccess: boolean;
  doorman: boolean;
  parking: boolean;
  wifi: boolean;
  kitchen: boolean;
  dedicatedWorkspace: boolean;
  hairDryer: boolean;
  iron: boolean;
  heater: boolean;
  hotTub: boolean;
  smokingAllowed: boolean;
  eventsAllowed: boolean;
  privateEntrance: boolean;
  security: boolean;
  waterfront: boolean;
  beachfront: boolean;
  mountainView: boolean;
  cityView: boolean;
  waterView: boolean;
  
  // Washer/Dryer
  washerInUnit: boolean;
  washerHookup: boolean;
  washerNotAvailable: boolean;
  washerInComplex: boolean;
  dryerInUnit: boolean;
  dryerHookup: boolean;
  dryerNotAvailable: boolean;
  dryerInComplex: boolean;
  
  // Parking
  offStreetParking: boolean;
  streetParking: boolean;
  streetParkingFree: boolean;
  coveredParking: boolean;
  coveredParkingFree: boolean;
  uncoveredParking: boolean;
  uncoveredParkingFree: boolean;
  garageParking: boolean;
  garageParkingFree: boolean;
  evCharging: boolean;
  
  // Pet Policies
  allowDogs: boolean;
  allowCats: boolean;
  
  // Structural
  gym: boolean;
  balcony: boolean;
  patio: boolean;
  sunroom: boolean;
  fireplace: boolean;
  firepit: boolean;
  pool: boolean;
  sauna: boolean;
  jacuzzi: boolean;
  grill: boolean;
  oven: boolean;
  stove: boolean;
  wheelAccessible: boolean;
  fencedInYard: boolean;
  secureLobby: boolean;
  keylessEntry: boolean;
  alarmSystem: boolean;
  storageShed: boolean;
  gatedEntry: boolean;
  smokeDetector: boolean;
  carbonMonoxide: boolean;
  
  // Kitchen
  garbageDisposal: boolean;
  dishwasher: boolean;
  fridge: boolean;
  
  // Furnished
  tv: boolean;
  workstation: boolean;
  microwave: boolean;
  kitchenEssentials: boolean;
  linens: boolean;
  privateBathroom: boolean;
}

import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, PencilIcon } from 'lucide-react';
import { ListingCreationCard } from '@/app/app/host/add-property/listing-creation-card';
import * as AmenitiesIcons from '@/components/icons/amenities';
import InComplexIcon from '@/lib/icons/in-complex';
import NotAvailableIcon from '@/lib/icons/not-available';
import { iconAmenities } from '@/lib/amenities-list';

interface ListingSummaryAmenitiesProps {
  listing: ListingAndImages;
  formData: any;
  isEditing: boolean;
  buttonState: 'saving' | 'success' | 'failed' | null;
  isSaving: boolean;
  hasChanges: boolean;
  isValid: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleAmenity: (amenityValue: string) => void;
  onHandleLaundryChange: (value: string) => void;
  getLaundrySelection: () => string;
}

const ListingSummaryAmenities: React.FC<ListingSummaryAmenitiesProps> = ({
  listing,
  formData,
  isEditing,
  buttonState,
  isSaving,
  hasChanges,
  isValid,
  onToggleEdit,
  onSave,
  onCancel,
  onToggleAmenity,
  onHandleLaundryChange,
  getLaundrySelection,
}) => {
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";

  // Amenity groups (from your existing code)
  const AMENITY_GROUPS = [
    {
      group: 'Accessibility & Safety',
      items: [
        { value: 'wheelchairAccess', label: 'Accessible', icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-1 mt-0" /> },
        { value: 'fencedInYard', label: 'Fenced Yard', icon: <AmenitiesIcons.UpdatedFencedYardIcon className="p-1 mt-0" /> },
        { value: 'keylessEntry', label: 'Keyless Entry', icon: <AmenitiesIcons.UpdatedKeylessEntryIcon className="p-1 mt-0" /> },
        { value: 'alarmSystem', label: 'Alarm System', icon: <AmenitiesIcons.UpdatedAlarmSystemIcon className="p-1 mt-0" /> },
        { value: 'gatedEntry', label: 'Gated Entry', icon: <AmenitiesIcons.UpdatedGatedEntryIcon className="p-1 mt-0" /> },
        { value: 'smokeDetector', label: 'Smoke Detector', icon: <AmenitiesIcons.UpdatedSmokeDetectorIcon className="p-1 mt-0" /> },
        { value: 'carbonMonoxide', label: 'CO Detector', icon: <AmenitiesIcons.UpdatedCarbonMonoxideDetectorIcon className="p-1 mt-0" /> },
        { value: 'security', label: 'Security System', icon: <AmenitiesIcons.UpdatedSecurityIcon className="p-1 mt-0" /> },
      ]
    },
    {
      group: 'Location & Views',
      items: [
        { value: 'mountainView', label: 'Mountain View', icon: <AmenitiesIcons.UpdatedMountainViewIcon className="p-1 mt-0" /> },
        { value: 'cityView', label: 'City View', icon: <AmenitiesIcons.UpdatedCityViewIcon className="p-1 mt-0" /> },
        { value: 'waterfront', label: 'Waterfront', icon: <AmenitiesIcons.UpdatedWaterfrontIcon className="p-0 mt-1" /> },
        { value: 'waterView', label: 'Water View', icon: <AmenitiesIcons.UpdatedWaterViewIcon className="p-1 mt-0" /> },
      ]
    },
    {
      group: 'Parking',
      items: [
        { value: 'offStreetParking', label: 'Off Street Parking', icon: <AmenitiesIcons.UpdatedParkingIcon className="p-1 mt-0" /> },
        { value: 'evCharging', label: 'EV Charging', icon: <AmenitiesIcons.UpdatedEvChargingIcon className="p-1 mt-0 ml-0" /> },
        { value: 'garageParking', label: 'Garage Parking', icon: <AmenitiesIcons.UpdatedGarageIcon className="p-1 mt-0" /> },
      ]
    },
    {
      group: 'Kitchen',
      items: [
        { value: 'garbageDisposal', label: 'Garbage Disposal', icon: <AmenitiesIcons.UpdatedGarbageDisposalIcon className="p-1 my-0" /> },
        { value: 'dishwasher', label: 'Dishwasher', icon: <AmenitiesIcons.UpdatedDishwasherIcon className="p-1 mt-0" /> },
        { value: 'fridge', label: 'Refrigerator', icon: <AmenitiesIcons.UpdatedFridgeIcon className="p-1 mt-0 " /> },
        { value: 'oven', label: 'Oven/Stove', icon: <AmenitiesIcons.UpdatedOvenIcon className="p-1 mt-0" /> },
        { value: 'grill', label: 'Grill', icon: <AmenitiesIcons.UpdatedGrillIcon className="p-1" /> },
        { value: 'kitchenEssentials', label: 'Kitchen Essentials', icon: <AmenitiesIcons.UpdatedKitchenEssentialsIcon className="p-1 mt-0" /> },
      ]
    },
    {
      group: 'Climate Control & Workspace',
      items: [
        { value: 'fireplace', label: 'Fireplace', icon: <AmenitiesIcons.UpdatedFireplaceIcon className="p-1 mt-0" /> },
        { value: 'heater', label: 'Heater', icon: <AmenitiesIcons.UpdatedHeaterIcon className="p-1 mt-0" /> },
        { value: 'dedicatedWorkspace', label: 'Workspace', icon: <AmenitiesIcons.UpdatedDedicatedWorkspaceIcon className="p-1 mt-0" /> },
        { value: 'airConditioner', label: 'Air Conditioning', icon: <AmenitiesIcons.UpdatedAirConditioningIcon className="p-1 mt-0" /> },
      ]
    },
    {
      group: 'Luxury & Recreation',
      items: [
        { value: 'gym', label: 'Gym', icon: <AmenitiesIcons.UpdatedGymIcon className="p-1 mt-0" /> },
        { value: 'sauna', label: 'Sauna', icon: <AmenitiesIcons.UpdatedSaunaIcon className="p-1 mt-0" /> },
        { value: 'balcony', label: 'Balcony', icon: <AmenitiesIcons.UpdatedBalconyIcon className="p-1 mt-0" /> },
        { value: 'pool', label: 'Pool', icon: <AmenitiesIcons.PoolIcon className="p-0 mt-2" /> },
        { value: 'hotTub', label: 'Hot Tub', icon: <AmenitiesIcons.UpdatedHotTubIcon className="p-1 mt-0" /> },
        { value: 'patio', label: 'Patio', icon: <AmenitiesIcons.UpdatedPatioIcon className="p-1 mt-0" /> },
        { value: 'sunroom', label: 'Sunroom', icon: <AmenitiesIcons.UpdatedSunroomIcon className="p-1 mt-0" /> },
      ]
    },
  ];

  // Laundry options
  const laundryOptions = [
    {
      value: 'washerInUnit',
      label: 'In Unit',
      id: 'inUnit',
    },
    {
      value: 'washerInComplex',
      label: 'In Complex',
      id: 'inComplex',
    },
    {
      value: 'washerNotAvailable',
      label: 'Unavailable',
      id: 'unavailable',
    },
  ];

  // Get display amenities
  const getDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if ((listing as any)[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  const displayAmenities = getDisplayAmenities();

  // Render edit buttons
  const renderEditButtons = () => {
    const canSave = hasChanges && isValid;
    
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={buttonState === 'success' ? "default" : buttonState === 'failed' ? "destructive" : "default"}
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-full z-10' : ''}
              ${buttonState === 'success' ? 'bg-secondaryBrand hover:bg-secondaryBrand text-white' : 
                buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : 
                !canSave && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' : 
                canSave && !buttonState ? 'bg-secondaryBrand hover:bg-secondaryBrand/90 text-white' : ''}
            `}
            onClick={() => !buttonState && canSave && onSave()}
            disabled={isSaving || (buttonState === 'saving' || buttonState === 'failed') || (!buttonState && !canSave)}
          >
            {buttonState === 'saving' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : buttonState === 'success' ? (
              <span>Success!</span>
            ) : buttonState === 'failed' ? (
              <span>Failed!</span>
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-0 opacity-0 overflow-hidden p-0' : ''}
              ${!canSave ? 'opacity-100' : ''}
            `}
            onClick={onCancel}
            disabled={isSaving || !!buttonState}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3"
        onClick={onToggleEdit}
      >
        <PencilIcon className="w-6 h-6" />
      </Button>
    );
  };

  return (
    <Card className="p-6 rounded-xl shadow-[0px_0px_5px_#00000029]">
      <CardContent className="flex flex-col gap-8 p-0">
        <div className="flex items-center justify-between w-full">
          <h2 className={sectionHeaderStyles}>Amenities</h2>
          {renderEditButtons()}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-0">
            {/* Laundry Section - Badges (mobile only) */}
            <div className="md:hidden space-y-4 pt-0 pb-10 mb-0">
              <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
              <div className="flex flex-wrap gap-4">
                {laundryOptions.map((option) => (
                  <Badge
                    key={option.id}
                    variant="outline"
                    className={`inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                      getLaundrySelection() === option.value
                        ? 'bg-gray-100 border-[#4f4f4f] border-2'
                        : 'bg-gray-50 border-[#d9dadf]'
                    }`}
                    onClick={() => onHandleLaundryChange(option.value)}
                  >
                    {React.cloneElement(
                      option.value === 'washerInComplex' ? <InComplexIcon className="w-4 h-4" /> : 
                      option.value === 'washerNotAvailable' ? <NotAvailableIcon className="w-4 h-4" /> :
                      <AmenitiesIcons.WasherIcon className="w-4 h-4" />,
                      { className: "w-4 h-4" }
                    )}
                    <span className="font-['Poppins',Helvetica] font-medium text-sm text-center leading-5 text-[#344054]">
                      {option.label}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Laundry Section - Cards (medium and above) */}
            <div className="hidden sm:block space-y-4 pt-0 pb-10 mb-0">
              <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
              <div className="flex flex-wrap gap-4">
                {laundryOptions.map((option) => (
                  <ListingCreationCard
                    key={option.id}
                    name={option.label}
                    icon={
                      option.value === 'washerInComplex' ? <InComplexIcon className="w-8 h-8" /> : 
                      option.value === 'washerNotAvailable' ? <NotAvailableIcon className="w-8 h-8" /> :
                      <AmenitiesIcons.WasherIcon className="w-8 h-8" />
                    }
                    isSelected={getLaundrySelection() === option.value}
                    onClick={() => onHandleLaundryChange(option.value)}
                  />
                ))}
              </div>
            </div>

            {AMENITY_GROUPS.map((group) => (
              <div key={group.group} className="space-y-4 pt-0 pb-10 mb-0">
                <h3 className="text-[18px] font-medium text-[#404040]">{group.group}</h3>
                <div className="flex flex-wrap gap-4">
                  {group.items.map((amenity) => (
                    <React.Fragment key={amenity.value}>
                      {/* Badge for mobile (< md) */}
                      <Badge
                        variant="outline"
                        className={`md:hidden inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                          (formData as any)[amenity.value]
                            ? 'bg-gray-100 border-[#4f4f4f] border-2'
                            : 'bg-gray-50 border-[#d9dadf]'
                        }`}
                        onClick={() => onToggleAmenity(amenity.value)}
                      >
                        {React.cloneElement(amenity.icon as React.ReactElement, { 
                          className: "w-4 h-4" 
                        })}
                        <span className="font-['Poppins',Helvetica] font-medium text-sm text-center leading-5 text-[#344054]">
                          {amenity.label}
                        </span>
                      </Badge>
                      {/* Card for medium+ screens */}
                      <div className="hidden md:block">
                        <ListingCreationCard
                          name={amenity.label}
                          icon={amenity.icon}
                          isSelected={(formData as any)[amenity.value] || false}
                          onClick={() => onToggleAmenity(amenity.value)}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          displayAmenities.length > 0 && (
            <div className="flex items-center gap-5 w-full flex-wrap">
              {displayAmenities.map((amenity, index) => {
                const IconComponent = amenity.icon;
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      {amenity.label}
                    </span>
                  </Badge>
                );
              })}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default ListingSummaryAmenities;