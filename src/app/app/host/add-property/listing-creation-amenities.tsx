// TODO: upgrade amenity icons to icons v3
import React, { useState } from "react";
import { ListingCreationCard } from './listing-creation-card';
import { Badge } from "@/components/ui/badge";
import * as AmenitiesIcons from '@/components/icons/amenities';
import InComplexIcon from '@/lib/icons/in-complex';
import NotAvailableIcon from '@/lib/icons/not-available';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Amenity options grouped by category
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
      { value: 'pool', label: 'Pool', icon: <AmenitiesIcons.PoolIcon className="p-0 mt-0" /> },
      { value: 'hotTub', label: 'Hot Tub', icon: <AmenitiesIcons.UpdatedHotTubIcon className="p-1 mt-0" /> },
      { value: 'patio', label: 'Patio', icon: <AmenitiesIcons.UpdatedPatioIcon className="p-1 mt-0" /> },
      { value: 'sunroom', label: 'Sunroom', icon: <AmenitiesIcons.UpdatedSunroomIcon className="p-1 mt-0" /> },
    ]
  },
];

interface ListingAmenitiesProps {
  value: string[];
  onChange: (selected: string[]) => void;
  onContinue?: () => void;
  isLoading?: boolean;
}

const ListingAmenities: React.FC<ListingAmenitiesProps> = ({ value, onChange, onContinue, isLoading }) => {
  const [selected, setSelected] = useState<string[]>(value || []);
  
  // Reusable section styles
  const sectionStyles = "space-y-4 pt-0 pb-10 mb-0";
  
  // Selected badge styling
  const selectedBadgeStyles = "bg-gray-100 border-[#4f4f4f] border-2";
  const unselectedBadgeStyles = "bg-gray-50 border-[#d9dadf]";

  const toggleAmenity = (val: string) => {
    // Check if this is a laundry option
    const laundryValues = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
    
    let updated: string[];
    if (selected.includes(val)) {
      updated = selected.filter((v) => v !== val);
    } else {
      if (laundryValues.includes(val)) {
        // If toggling a laundry option, remove other laundry options first
        updated = selected.filter(item => !laundryValues.includes(item));
        updated.push(val);
      } else {
        updated = [...selected, val];
      }
    }
    setSelected(updated);
    onChange(updated);
  };

  // Laundry options (aligned with Prisma schema)
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

  // Helper for laundry radio selection
  const handleLaundryChange = (value: string) => {
    // Remove all existing laundry options first
    const laundryValues = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
    let updated = selected.filter(item => !laundryValues.includes(item));
    
    // Add the new laundry option
    updated.push(value);
    
    setSelected(updated);
    onChange(updated);
  };

  // Helper to check which radio is selected
  const getLaundrySelection = () => {
    if (selected.includes('washerInUnit')) return 'washerInUnit';
    if (selected.includes('washerInComplex')) return 'washerInComplex';
    if (selected.includes('washerNotAvailable')) return 'washerNotAvailable';
    return '';
  };


  return (
    <div className="flex flex-col gap-0">

      {/* Laundry Section - Badges (mobile only) */}
      <div className={`md:hidden ${sectionStyles}`}>
        <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
        <div className="flex flex-wrap gap-4">
          {laundryOptions.map((option) => (
            <Badge
              key={option.id}
              variant="outline"
              className={`inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                getLaundrySelection() === option.value
                  ? selectedBadgeStyles
                  : unselectedBadgeStyles
              }`}
              onClick={() => handleLaundryChange(option.value)}
            >
              {React.cloneElement(
                option.value === 'washerInComplex' ? <InComplexIcon className="w-4 h-4" /> : 
                option.value === 'washerNotAvailable' ? <NotAvailableIcon className="w-4 h-4" /> :
                <AmenitiesIcons.WasherIcon className="w-4 h-4" />,
                { className: "w-4 h-4" }
              )}
              <span className={`font-['Poppins',Helvetica] font-medium text-sm text-center leading-5 ${
                getLaundrySelection() === option.value ? "text-[#344054]" : "text-[#344054]"
              }`}>
                {option.label}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Laundry Section - Cards (medium and above) */}
      <div className={` hidden sm:block ${sectionStyles}`}>
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
              onClick={() => handleLaundryChange(option.value)}
            />
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-[400px]">
        <div className="flex flex-col gap-0">
          {AMENITY_GROUPS.map((group) => (
            <div key={group.group} className={sectionStyles}>
              <h3 className="text-[18px] font-medium text-[#404040]">{group.group}</h3>
              <div className="flex flex-wrap gap-4">
                {group.items.map((amenity) => (
                  <React.Fragment key={amenity.value}>
                    {/* Badge for mobile (< md) */}
                    <Badge
                      variant="outline"
                      className={`md:hidden inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                        selected.includes(amenity.value)
                          ? selectedBadgeStyles
                          : unselectedBadgeStyles
                      }`}
                      onClick={() => toggleAmenity(amenity.value)}
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
                        isSelected={selected.includes(amenity.value)}
                        onClick={() => toggleAmenity(amenity.value)}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ListingAmenities;
