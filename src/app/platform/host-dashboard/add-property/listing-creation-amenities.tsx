import React, { useState } from "react";
import Tile from "@/components/ui/tile";
import * as AmenitiesIcons from '@/components/icons/amenities';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Amenity options grouped by category
const AMENITY_GROUPS = [
  {
    group: 'Accessibility & Safety',
    items: [
      { value: 'wheelchairAccess', label: 'Wheelchair Accessible', icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-1 mt-0" /> },
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
      { value: 'evCharging', label: 'EV Charging', icon: <AmenitiesIcons.UpdatedEvChargingIcon className="p-1 mt-0 ml-3" /> },
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
      { value: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: <AmenitiesIcons.UpdatedDedicatedWorkspaceIcon className="p-1 mt-0" /> },
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

interface ListingAmenitiesProps {
  value: string[];
  onChange: (selected: string[]) => void;
  onContinue?: () => void;
  isLoading?: boolean;
}

const ListingAmenities: React.FC<ListingAmenitiesProps> = ({ value, onChange, onContinue, isLoading }) => {
  const [selected, setSelected] = useState<string[]>(value || []);
  
  // Reusable section styles
  const sectionStyles = "space-y-4 border-b-2 py-6 mb-0";

  const toggleAmenity = (val: string) => {
    let updated: string[];
    if (selected.includes(val)) {
      updated = selected.filter((v) => v !== val);
    } else {
      updated = [...selected, val];
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
    let updated: string[] = [];
    switch (value) {
      case 'washerInUnit':
        updated = ['washerInUnit'];
        break;
      case 'washerInComplex':
        updated = ['washerInComplex'];
        break;
      case 'washerNotAvailable':
        updated = ['washerNotAvailable'];
        break;
      default:
        updated = [];
    }
    setSelected(updated);
    onChange(updated);
  };

  // Helper to check which radio is selected
  const getLaundrySelection = () => {
    if (selected.length === 1 && selected[0] === 'washerInUnit') return 'washerInUnit';
    if (selected.length === 1 && selected[0] === 'washerInComplex') return 'washerInComplex';
    if (selected.length === 1 && selected[0] === 'washerNotAvailable') return 'washerNotAvailable';
    return '';
  };


  return (
    <div className="flex flex-col gap-0">
      <h2 className="text-2xl font-semibold mb-0 test">What amenities does your property offer?</h2>

      {/* Laundry Section */}
      <div className={sectionStyles}>
        <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
        <div className="flex items-center gap-4">
          <div className="flex-col border-black space-y-[3px]">
            <AmenitiesIcons.DryerIcon className="w-[70px] h-[70px]" />
            <AmenitiesIcons.WasherIcon className="w-[70px] h-[70px]" />
          </div>
          <div className="flex flex-col justify-between space-y-3">
            {laundryOptions.map((option) => (
              <div key={option.id} className='flex items-center gap-x-2'>
                <input
                  type="radio"
                  id={option.id}
                  name="laundry"
                  checked={getLaundrySelection() === option.value}
                  className='appearance-none w-[35px] h-[35px] border-[#70707045] border rounded-full cursor-pointer
                    relative flex items-center justify-center before:content-[""] before:w-[15px] before:h-[15px] before:rounded-full
                    checked:before:bg-[#4F4F4F] checked:border-[#4F4F4F] hover:border-[#4F4F4F] transition-colors'
                  onChange={() => handleLaundryChange(option.value)}
                />
                <label htmlFor={option.id} className="text-base cursor-pointer select-none">{option.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-[400px]">
        <div className="flex flex-col gap-0">
          {AMENITY_GROUPS.map((group) => (
            <div key={group.group} className={sectionStyles}>
              <h3 className="text-[18px] font-medium text-[#404040]">{group.group}</h3>
              <div className="flex flex-wrap gap-4">
                {group.items.map((amenity) => (
                  <Tile
                    key={amenity.value}
                    label={amenity.label}
                    icon={amenity.icon}
                    className={`cursor-pointer border-2 ${selected.includes(amenity.value) ? 'border-primary shadow-lg' : 'border-[#E3E3E3]'}`}
                    onClick={() => toggleAmenity(amenity.value)}
                  />
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
