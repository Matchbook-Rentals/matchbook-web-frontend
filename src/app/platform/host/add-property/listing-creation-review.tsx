import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { MonthlyPricing } from "./listing-creation-pricing";

// Import the AMENITY_GROUPS constant from the amenities file
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

// Laundry options
const LAUNDRY_OPTIONS = [
  { value: 'washerInUnit', label: 'In Unit Laundry', icon: <AmenitiesIcons.WasherIcon className="w-6 h-6" /> },
  { value: 'washerInComplex', label: 'Laundry In Complex', icon: <AmenitiesIcons.WasherIcon className="w-6 h-6" /> },
  { value: 'washerUnavailable', label: 'No Laundry', icon: <AmenitiesIcons.WasherIcon className="w-6 h-6" /> },
];

// Helper function to get amenity info by value
const getAmenityByValue = (value: string) => {
  // Check in AMENITY_GROUPS
  for (const group of AMENITY_GROUPS) {
    for (const item of group.items) {
      if (item.value === value) {
        return item;
      }
    }
  }
  
  // Check in LAUNDRY_OPTIONS
  for (const item of LAUNDRY_OPTIONS) {
    if (item.value === value) {
      return item;
    }
  }
  
  // Default fallback if not found
  return { value, label: value, icon: <AmenitiesIcons.UpdatedAirConditioningIcon className="w-6 h-6" /> };
};

interface ListingReviewProps {
  listingHighlights?: {
    category: string | null;
    petsAllowed: boolean | null;
    furnished: boolean | null;
    utilitiesIncluded: boolean | null;
  };
  listingLocation?: {
    locationString: string | null;
    streetAddress1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  listingRooms?: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: string;
  };
  listingBasics?: {
    title: string;
    description: string;
  };
  listingAmenities?: string[];
  listingPricing?: {
    shortestStay: number;
    longestStay: number;
    monthlyPricing: MonthlyPricing[];
    shortTermRent: string;
    longTermRent: string;
    deposit: string;
    petDeposit: string;
    petRent: string;
  };
  onEditHighlights?: () => void;
  onEditLocation?: () => void;
  onEditRooms?: () => void;
  onEditBasics?: () => void;
  onEditAmenities?: () => void;
  onEditPricing?: () => void;
}

// Property type options
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

// Furnishing options
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

// Utilities options
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

// Pets options
const petsOptions = [
  {
    id: "pets-welcome",
    name: "Pets welcome",
    icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" /> // Placeholder
  },
  {
    id: "no-pets",
    name: "No pets",
    icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" /> // Placeholder
  },
];

export const Box = ({
  listingHighlights,
  listingLocation,
  listingRooms,
  listingBasics,
  listingAmenities,
  listingPricing,
  onEditHighlights = () => {},
  onEditLocation = () => {},
  onEditRooms = () => {},
  onEditBasics = () => {},
  onEditAmenities = () => {},
  onEditPricing = () => {}
}: ListingReviewProps): JSX.Element => {
  
  // Chart functions (copied from confirm pricing component)
  const generateChartData = () => {
    if (!listingPricing?.monthlyPricing) return [];
    
    return listingPricing.monthlyPricing.map(pricing => {
      const price = pricing.price ? parseFloat(pricing.price) : 0;
      const monthLabel = pricing.months === 1 ? `${pricing.months} Month` : `${pricing.months} Months`;
      const isUtilitiesIncluded = pricing.utilitiesIncluded;
      
      return {
        month: monthLabel,
        price: price,
        utilitiesIncluded: isUtilitiesIncluded,
        color: isUtilitiesIncluded ? '#0B6E6E' : '#5DA5A5', // secondaryBrand for utilities, lighter for no utilities
      };
    });
  };

  const getMaxChartValue = () => {
    if (!listingPricing?.monthlyPricing) return 2000;
    
    const prices = listingPricing.monthlyPricing.map(p => p.price ? parseFloat(p.price) : 0).filter(p => p > 0);
    if (prices.length === 0) return 2000;
    const maxPrice = Math.max(...prices);
    return Math.ceil(maxPrice / 100) * 100 * 1.2; // 20% higher than the highest value, rounded up to nearest 100
  };

  const generateYAxisTicks = (maxValue: number) => {
    const ticks = [];
    const step = maxValue <= 1000 ? 200 : 500;
    for (let i = 0; i <= maxValue; i += step) {
      ticks.push(i);
    }
    return ticks;
  };

  const chartData = generateChartData();
  const maxChartValue = getMaxChartValue();
  const yAxisTicks = generateYAxisTicks(maxChartValue);
  
  // Use highlights directly from props
  return (
    <div className="relative max-w-[1188px] mx-auto">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xl font-normal text-[#3f3f3f]">
            Review Listing
          </div>
        </div>

        {/* Basics Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-black">Basics</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditRooms}
            >
              Edit
            </Button>
          </div>

          <div className="text-2xl font-normal text-[#3f3f3f] mb-4">
            {listingBasics?.title || "Untitled Property"}
          </div>

          <div className="flex justify-between mb-4">
            <div className="text-2xl font-normal text-[#3f3f3f]">
              {listingRooms.bedrooms} Bed{listingRooms.bedrooms !== 1 ? 's' : ''} | {listingRooms.bathrooms} Bath{listingRooms.bathrooms !== 1 ? 's' : ''}
            </div>
            <div className="text-2xl font-normal text-[#3f3f3f]">
              {listingRooms.squareFeet ? `${listingRooms.squareFeet} Sqft` : ""}
            </div>
          </div>

          <Separator className="my-4" />
        </div>

        {/* Highlights Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-[#3f3f3f]">Highlights</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditHighlights}
            >
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-[30px] h-[30px] flex items-center justify-center">
                {propertyTypes.find(type => type.name === listingHighlights.category)?.icon 
                  ? React.cloneElement(
                      propertyTypes.find(type => type.name === listingHighlights.category)?.icon as React.ReactElement,
                      { className: "w-6 h-6" }
                    )
                  : React.cloneElement(propertyTypes[0].icon as React.ReactElement, { className: "w-6 h-6" })
                }
              </div>
              <span className="text-xl font-normal text-black">
                {listingHighlights.category || "Single Family"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[30px] h-[30px] flex items-center justify-center">
                {React.cloneElement(
                  (listingHighlights.furnished 
                    ? furnishingOptions[0].icon 
                    : furnishingOptions[1].icon) as React.ReactElement,
                  { className: "w-6 h-6" }
                )}
              </div>
              <span className="text-xl font-normal text-black">
                {listingHighlights.furnished ? "Furnished" : "Unfurnished"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[30px] h-[30px] flex items-center justify-center">
                {React.cloneElement(
                  (listingHighlights.utilitiesIncluded 
                    ? utilitiesOptions[0].icon 
                    : utilitiesOptions[1].icon) as React.ReactElement,
                  { className: "w-6 h-6" }
                )}
              </div>
              <span className="text-xl font-normal text-black">
                {listingHighlights.utilitiesIncluded ? "Utilities included" : "Utilities not included"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[30px] h-[30px] flex items-center justify-center">
                {React.cloneElement(
                  (listingHighlights.petsAllowed 
                    ? petsOptions[0].icon 
                    : petsOptions[1].icon) as React.ReactElement,
                  { className: "w-6 h-6" }
                )}
              </div>
              <span className="text-xl font-normal text-black">
                {listingHighlights.petsAllowed ? "Pets welcome" : "No pets"}
              </span>
            </div>
          </div>

          <Separator className="my-4" />
        </div>

        {/* Title Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-black">Title</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditBasics}
            >
              Edit
            </Button>
          </div>

          <div className="text-xl font-normal text-black mb-4">
            {listingBasics.title}
          </div>

          <Separator className="my-4" />
        </div>

        {/* Description Section */}
        <Card className="border-none shadow-none mb-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-medium text-black">Description</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-[15px] text-[#3f3f3f] font-normal"
                onClick={onEditBasics}
              >
                Edit
              </Button>
            </div>

            <p className="text-xl font-normal text-black mb-4">
              {listingBasics.description}
            </p>

            <Separator className="my-4" />
          </CardContent>
        </Card>

        {/* Amenities Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-black">Amenities</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditAmenities}
            >
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-y-6 mb-4">
            {listingAmenities.map((amenityValue, index) => {
              const amenity = getAmenityByValue(amenityValue);
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-[30px] h-[30px] flex items-center justify-center">
                    {React.cloneElement(amenity.icon as React.ReactElement, { 
                      className: "w-6 h-6" 
                    })}
                  </div>
                  <span className="text-xl font-normal text-black">
                    {amenity.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator className="my-4" />
        </div>

        {/* Location Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-[#3f3f3f]">Location</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditLocation}
            >
              Edit
            </Button>
          </div>

          <div className="text-2xl font-normal text-[#3f3f3f] mb-4">
            {listingLocation.streetAddress1} {listingLocation.city} {listingLocation.state} {listingLocation.postalCode}
          </div>

          <Separator className="my-4" />
        </div>

        {/* Pricing and Lease Terms Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-[#3f3f3f]">
              Pricing and Lease Terms
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] text-[#3f3f3f] font-normal"
              onClick={onEditPricing}
            >
              Edit
            </Button>
          </div>

          {/* Pricing Chart */}
          {chartData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[#222222] mb-4">
                Pricing Structure
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, maxChartValue]} 
                      ticks={yAxisTicks}
                      tickFormatter={(value) => `$${value}`}
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const entry = props.payload;
                        return [`$${value}${entry.utilitiesIncluded ? ' (utilities included)' : ''}`, 'Monthly Rent'];
                      }}
                      labelFormatter={(label) => `Stay Length: ${label}`}
                    />
                    <Legend 
                      content={() => (
                        <div className="flex justify-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0B6E6E' }}></div>
                            <span className="text-xs font-medium text-[#222222]">Utilities Included</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#5DA5A5' }}></div>
                            <span className="text-xs font-medium text-[#222222]">Not included</span>
                          </div>
                        </div>
                      )}
                    />
                    <Bar 
                      dataKey="price" 
                      name="Monthly Rent" 
                      radius={[2, 2, 0, 0]}
                      isAnimationActive={true}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex">
              <div className="w-[312px] text-xl font-light text-black">
                Min Lease: {listingPricing.shortestStay || 1} Month{listingPricing.shortestStay > 1 ? 's' : ''}
              </div>
              <div className="text-xl font-light text-black">
                Price Range: ${Math.min(...chartData.map(d => d.price).filter(p => p > 0) || [0])} - ${Math.max(...chartData.map(d => d.price) || [0])}
              </div>
            </div>
            <div className="flex">
              <div className="w-[312px] text-xl font-light text-black">
                Max Lease: {listingPricing.longestStay || 0} Month{listingPricing.longestStay > 1 ? 's' : ''}
              </div>
              <div className="text-xl font-light text-black">
                Utilities: {chartData.some(d => d.utilitiesIncluded) ? 'Included for some lengths' : 'Not included'}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="text-xl font-light text-black">
              Deposit: ${listingPricing.deposit || 0}
            </div>
            <div className="text-xl font-light text-black">
              Pet Rent: ${listingPricing.petRent || 0} / month
            </div>
            <div className="text-xl font-light text-black">
              Pet Deposit: ${listingPricing.petDeposit || 0} / pet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
