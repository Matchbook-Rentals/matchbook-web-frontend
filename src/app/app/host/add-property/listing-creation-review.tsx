import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { Badge } from "../../../../components/ui/badge";
import { PencilIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import * as AmenitiesIcons from '@/components/icons/amenities';
import InComplexIcon from '@/lib/icons/in-complex';
import NotAvailableIcon from '@/lib/icons/not-available';
import { MonthlyPricing } from "./listing-creation-pricing";

// Reusable text styles
const questionTextStyles = "font-['Poppins'] font-medium text-[#484a54] text-[16px]";

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
  { value: 'washerInComplex', label: 'Laundry In Complex', icon: <InComplexIcon className="w-6 h-6" /> },
  { value: 'washerNotAvailable', label: 'No Laundry', icon: <NotAvailableIcon className="w-6 h-6" /> },
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
    rentDueAtBooking: string;
    petDeposit: string;
    petRent: string;
  };
  onEditHighlights?: () => void;
  onEditLocation?: () => void;
  onEditRooms?: () => void;
  onEditBasics?: () => void;
  onEditAmenities?: () => void;
  onEditPricing?: () => void;
  onEditDeposits?: () => void;
  showPricingStructureTitle?: boolean;
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
  onEditPricing = () => {},
  onEditDeposits = () => {},
  showPricingStructureTitle = true
}: ListingReviewProps): JSX.Element => {
  
  // Property feature data for mapping
  const propertyFeatures = [
    {
      icon: propertyTypes.find(type => type.name === listingHighlights?.category)?.icon 
        ? React.cloneElement(
            propertyTypes.find(type => type.name === listingHighlights?.category)?.icon as React.ReactElement,
            { className: "w-4 h-4" }
          )
        : React.cloneElement(propertyTypes[0].icon as React.ReactElement, { className: "w-4 h-4" }),
      label: listingHighlights?.category || "Single Family",
    },
    {
      icon: React.cloneElement(
        (listingHighlights?.furnished 
          ? furnishingOptions[0].icon 
          : furnishingOptions[1].icon) as React.ReactElement,
        { className: "w-4 h-4" }
      ),
      label: listingHighlights?.furnished ? "Furnished" : "Unfurnished",
    },
    {
      icon: React.cloneElement(
        (listingHighlights?.petsAllowed 
          ? petsOptions[0].icon 
          : petsOptions[1].icon) as React.ReactElement,
        { className: "w-4 h-4" }
      ),
      label: listingHighlights?.petsAllowed ? "Pets allowed" : "No pets",
    },
  ];

  // Basic features data for mapping
  const basicFeatures = [
    {
      icon: null,
      label: `${listingRooms?.bedrooms || 0} Bed${(listingRooms?.bedrooms || 0) !== 1 ? 's' : ''}`,
    },
    {
      icon: null,
      label: `${listingRooms?.bathrooms || 0} Bath${(listingRooms?.bathrooms || 0) !== 1 ? 's' : ''}`,
    },
    ...(listingRooms?.squareFeet ? [{
      icon: null,
      label: `${listingRooms.squareFeet} Sqft`,
    }] : []),
  ];

  // Amenity features data for mapping
  const amenityFeatures = listingAmenities?.map(amenityValue => {
    const amenity = getAmenityByValue(amenityValue);
    return {
      icon: React.cloneElement(amenity.icon as React.ReactElement, { 
        className: "w-4 h-4" 
      }),
      label: amenity.label,
    };
  }) || [];
  
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
    <div className="relative w-full md:max-w-[1188px] mx-auto">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xl font-normal text-[#3f3f3f]">
            Review Listing
          </div>
        </div>

        {/* Basics Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Basics
                </h2>
                <button 
                  onClick={onEditRooms}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit basics section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-5 self-stretch w-full overflow-x-auto">
                <div className="inline-flex items-center gap-5">
                  {basicFeatures.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                    >
                      <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                        {feature.label}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Highlights Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Highlights
                </h2>
                <button 
                  onClick={onEditHighlights}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit highlights section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-5 self-stretch w-full overflow-x-auto">
                <div className="inline-flex items-center gap-5 flex-wrap">
                  {propertyFeatures.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                    >
                      {feature.icon}
                      <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                        {feature.label}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Title Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Title
                </h2>
                <button 
                  onClick={onEditBasics}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit title section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className={`${questionTextStyles} self-stretch w-full`}>
                {listingBasics?.title || "Untitled Property"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Description
                </h2>
                <button 
                  onClick={onEditBasics}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit description section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className={`${questionTextStyles} self-stretch w-full`}>
                {listingBasics?.description || "No description provided"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Amenities
                </h2>
                <button 
                  onClick={onEditAmenities}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit amenities section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-5 self-stretch w-full overflow-x-auto">
                <div className="inline-flex items-center gap-5 flex-wrap">
                  {amenityFeatures.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                    >
                      {feature.icon}
                      <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                        {feature.label}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Location
                </h2>
                <button 
                  onClick={onEditLocation}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit location section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className={`${questionTextStyles} self-stretch w-full`}>
                {listingLocation?.streetAddress1} {listingLocation?.city} {listingLocation?.state} {listingLocation?.postalCode}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing and Lease Terms Section */}
        <Card className="bg-neutral-50 rounded-xl mb-6">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-4 self-stretch w-full">
              <div className="flex items-center justify-between self-stretch w-full">
                <h2 className="font-medium text-xl tracking-[-0.40px] text-gray-800 font-['Poppins',Helvetica]">
                  Pricing and Lease Terms
                </h2>
                <button 
                  onClick={onEditPricing}
                  className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Edit pricing and lease terms section"
                  type="button"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Pricing Chart */}
              {chartData.length > 0 && (
                <div className="self-stretch w-full">
                  {showPricingStructureTitle && (
                    <h3 className="text-lg font-medium text-[#222222] mb-4">
                      Pricing Structure
                    </h3>
                  )}
                  {/* Desktop Chart */}
                  <div className="w-full h-64 hidden md:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          interval={0}
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
                          label={{
                            position: 'top',
                            fontSize: 12,
                            fill: '#222222',
                            formatter: (value: number) => `$${value}`
                          }}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Mobile Chart */}
                  <div className="w-full h-64 md:hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData}
                        margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          fontSize={10}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
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
                            <div className="flex justify-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded" style={{ backgroundColor: '#0B6E6E' }}></div>
                                <span className="text-xs font-medium text-[#222222]">Utils Inc.</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded" style={{ backgroundColor: '#5DA5A5' }}></div>
                                <span className="text-xs font-medium text-[#222222]">Not Inc.</span>
                              </div>
                            </div>
                          )}
                        />
                        <Bar 
                          dataKey="price" 
                          name="Monthly Rent" 
                          radius={[2, 2, 0, 0]}
                          isAnimationActive={true}
                          label={(props: any) => {
                            const { x, y, width, value, index } = props;
                            // Show dollar amount on every other bar if more than 8 months
                            if (chartData.length > 8 && index % 2 !== 0) {
                              return null;
                            }
                            return (
                              <text 
                                x={x + width / 2} 
                                y={y - 5} 
                                fill="#222222" 
                                textAnchor="middle" 
                                dy={-6} 
                                fontSize={10}
                              >
                                ${value}
                              </text>
                            );
                          }}
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

              <div className="flex items-center gap-5 self-stretch w-full overflow-x-auto">
                <div className="inline-flex items-center gap-5 flex-wrap">
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Min Lease:</strong> {listingPricing?.shortestStay || 0} months
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Max Lease:</strong> {listingPricing?.longestStay || 0} months
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Average Rent:</strong> ${(() => {
                        if (!chartData || chartData.length === 0) return '0';
                        const validPrices = chartData.map(d => d.price).filter(p => p > 0 && !isNaN(p));
                        if (validPrices.length === 0) return '0';
                        const avgPrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
                        return Math.round(avgPrice);
                      })()}
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Deposit:</strong> ${listingPricing?.deposit || 0}
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Rent Due At Booking:</strong> ${listingPricing?.rentDueAtBooking || 0}
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Pet Rent:</strong> ${listingPricing?.petRent || 0}/mo
                    </span>
                  </Badge>
                  
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1.5 pl-3 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                  >
                    <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                      <strong>Pet Deposit:</strong> ${listingPricing?.petDeposit || 0}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
