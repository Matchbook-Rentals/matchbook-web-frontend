'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { ListingAndImages } from '@/types';
import { FilterOptions, matchesFilters } from '@/lib/listing-filters';
import { calculateRent } from '@/lib/calculate-rent';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import BrandModal from '@/components/BrandModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronUp, Minus, Plus, Wifi } from 'lucide-react';
import {
  UpdatedSingleFamilyIcon,
  UpdatedApartmentIcon,
  UpdatedTownhouseIcon,
  UpdatedSingleRoomIcon,
  UpdatedFurnishedIcon,
  UpdatedUnfurnishedIcon,
  UpdatedUtilitiesIncludedIcon,
  UpdatedUtilitiesNotIncludedIcon,
  UpdatedPetFriendlyIcon,
  UpdatedPetUnfriendlyIcon,
  UpdatedAirConditioningIcon,
  UpdatedHeaterIcon,
  UpdatedDedicatedWorkspaceIcon,
  UpdatedSaunaIcon,
  UpdatedGymIcon,
  UpdatedSunroomIcon,
  UpdatedKitchenEssentialsIcon,
  UpdatedGarbageDisposalIcon,
  UpdatedDishwasherIcon,
  UpdatedFridgeIcon,
  UpdatedOvenIcon,
  UpdatedBalconyIcon,
  UpdatedPoolIcon,
  UpdatedHotTubIcon,
  UpdatedFireplaceIcon,
  UpdatedFencedYardIcon,
  UpdatedGatedEntryIcon,
  UpdatedParkingIcon,
  UpdatedEvChargingIcon,
  UpdatedGarageIcon,
  UpdatedWheelchairAccessibleIcon,
  UpdatedKeylessEntryIcon,
  UpdatedCarbonMonoxideDetectorIcon,
  UpdatedSmokeDetectorIcon,
  UpdatedSecurityIcon,
  UpdatedMountainViewIcon,
  UpdatedCityViewIcon,
  UpdatedWaterfrontIcon,
  UpdatedWaterViewIcon,
} from '@/components/icons/amenities';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchFiltersModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  listings: ListingAndImages[];
  totalCount: number;
  tripData?: { startDate?: string | null; endDate?: string | null; [key: string]: any } | null;
}

interface PillOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function FilterPill({ icon, label, selected, onClick }: {
  icon?: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
        selected
          ? 'border-gray-900 bg-gray-100 text-gray-900 hover:bg-gray-200'
          : 'border-[#d9dadf] bg-gray-50 text-[#344054] hover:bg-gray-100',
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b py-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ChevronUp className={cn('w-5 h-5 transition-transform', !open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CounterRow({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
          disabled={value === 0}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{value === 0 ? 'Any' : value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pill data constants
// ---------------------------------------------------------------------------

const ICON_CLASS = 'w-4 h-4';

const PROPERTY_TYPE_OPTIONS: PillOption[] = [
  { label: 'Single Family', value: 'singleFamily', icon: <UpdatedSingleFamilyIcon className={ICON_CLASS} /> },
  { label: 'Apartment', value: 'apartment', icon: <UpdatedApartmentIcon className={ICON_CLASS} /> },
  { label: 'Town House', value: 'townhouse', icon: <UpdatedTownhouseIcon className={ICON_CLASS} /> },
  { label: 'Private Room', value: 'privateRoom', icon: <UpdatedSingleRoomIcon className={ICON_CLASS} /> },
];

const UTILITY_OPTIONS: PillOption[] = [
  { label: 'Utilities Included', value: 'utilitiesIncluded', icon: <UpdatedUtilitiesIncludedIcon className={ICON_CLASS} /> },
  { label: 'Utilities Not Included', value: 'utilitiesNotIncluded', icon: <UpdatedUtilitiesNotIncludedIcon className={ICON_CLASS} /> },
];

const FURNITURE_OPTIONS: PillOption[] = [
  { label: 'Furnished', value: 'furnished', icon: <UpdatedFurnishedIcon className={ICON_CLASS} /> },
  { label: 'Unfurnished', value: 'unfurnished', icon: <UpdatedUnfurnishedIcon className={ICON_CLASS} /> },
];

const PET_OPTIONS: PillOption[] = [
  { label: 'Pets Welcome', value: 'petsAllowed', icon: <UpdatedPetFriendlyIcon className={ICON_CLASS} /> },
  { label: 'No Pets', value: 'petsNotAllowed', icon: <UpdatedPetUnfriendlyIcon className={ICON_CLASS} /> },
];

const LAUNDRY_OPTIONS: PillOption[] = [
  { label: 'In Unit', value: 'washerInUnit' },
  { label: 'In Complex', value: 'washerInComplex' },
];

const INSIDE_AMENITIES: PillOption[] = [
  { label: 'Air Conditioning', value: 'airConditioner', icon: <UpdatedAirConditioningIcon className={ICON_CLASS} /> },
  { label: 'Heating', value: 'heater', icon: <UpdatedHeaterIcon className={ICON_CLASS} /> },
  { label: 'Wifi', value: 'wifi', icon: <Wifi className={ICON_CLASS} /> },
  { label: 'Sauna', value: 'sauna', icon: <UpdatedSaunaIcon className={ICON_CLASS} /> },
  { label: 'Gym', value: 'gym', icon: <UpdatedGymIcon className={ICON_CLASS} /> },
  { label: 'Dedicated Workspace', value: 'dedicatedWorkspace', icon: <UpdatedDedicatedWorkspaceIcon className={ICON_CLASS} /> },
  { label: 'Sun Room', value: 'sunroom', icon: <UpdatedSunroomIcon className={ICON_CLASS} /> },
  { label: 'Kitchen Essentials', value: 'kitchenEssentials', icon: <UpdatedKitchenEssentialsIcon className={ICON_CLASS} /> },
  { label: 'Garbage Disposal', value: 'garbageDisposal', icon: <UpdatedGarbageDisposalIcon className={ICON_CLASS} /> },
  { label: 'Dishwasher', value: 'dishwasher', icon: <UpdatedDishwasherIcon className={ICON_CLASS} /> },
  { label: 'Refrigerator', value: 'fridge', icon: <UpdatedFridgeIcon className={ICON_CLASS} /> },
  { label: 'Oven/Stove', value: 'oven', icon: <UpdatedOvenIcon className={ICON_CLASS} /> },
  { label: 'Fire Place', value: 'fireplace', icon: <UpdatedFireplaceIcon className={ICON_CLASS} /> },
];

const OUTSIDE_AMENITIES: PillOption[] = [
  { label: 'Balcony', value: 'balcony', icon: <UpdatedBalconyIcon className={ICON_CLASS} /> },
  { label: 'Pool', value: 'pool', icon: <UpdatedPoolIcon className={ICON_CLASS} /> },
  { label: 'Hot Tub', value: 'hotTub', icon: <UpdatedHotTubIcon className={ICON_CLASS} /> },
  { label: 'Fenced Yard', value: 'fencedInYard', icon: <UpdatedFencedYardIcon className={ICON_CLASS} /> },
  { label: 'Gated Entry', value: 'gatedEntry', icon: <UpdatedGatedEntryIcon className={ICON_CLASS} /> },
];

const PARKING_AMENITIES: PillOption[] = [
  { label: 'Parking Available', value: 'offStreetParking', icon: <UpdatedParkingIcon className={ICON_CLASS} /> },
  { label: 'EV Charging', value: 'evCharging', icon: <UpdatedEvChargingIcon className={ICON_CLASS} /> },
  { label: 'Garage', value: 'garageParking', icon: <UpdatedGarageIcon className={ICON_CLASS} /> },
];

const ACCESSIBILITY_AMENITIES: PillOption[] = [
  { label: 'Wheelchair', value: 'wheelchairAccess', icon: <UpdatedWheelchairAccessibleIcon className={ICON_CLASS} /> },
  { label: 'Keyless Entry', value: 'keylessEntry', icon: <UpdatedKeylessEntryIcon className={ICON_CLASS} /> },
  { label: 'CO Detector', value: 'carbonMonoxide', icon: <UpdatedCarbonMonoxideDetectorIcon className={ICON_CLASS} /> },
  { label: 'Smoke Detector', value: 'smokeDetector', icon: <UpdatedSmokeDetectorIcon className={ICON_CLASS} /> },
  { label: 'Security System', value: 'security', icon: <UpdatedSecurityIcon className={ICON_CLASS} /> },
];

const LOCATION_AMENITIES: PillOption[] = [
  { label: 'Mountain View', value: 'mountainView', icon: <UpdatedMountainViewIcon className={ICON_CLASS} /> },
  { label: 'City View', value: 'cityView', icon: <UpdatedCityViewIcon className={ICON_CLASS} /> },
  { label: 'Waterfront', value: 'waterfront', icon: <UpdatedWaterfrontIcon className={ICON_CLASS} /> },
  { label: 'Water View', value: 'waterView', icon: <UpdatedWaterViewIcon className={ICON_CLASS} /> },
];

// ---------------------------------------------------------------------------
// Mapping helpers: amenity value → filter category key
// ---------------------------------------------------------------------------

const AMENITY_TO_FILTER_KEY: Record<string, keyof FilterOptions> = {
  // basics
  airConditioner: 'basics', heater: 'basics', wifi: 'basics', dedicatedWorkspace: 'basics',
  // kitchen
  kitchenEssentials: 'kitchen', garbageDisposal: 'kitchen', dishwasher: 'kitchen', fridge: 'kitchen', oven: 'kitchen',
  // luxury
  sauna: 'luxury', gym: 'luxury', sunroom: 'luxury', balcony: 'luxury', pool: 'luxury', hotTub: 'luxury', fireplace: 'luxury',
  // accessibility
  fencedInYard: 'accessibility', gatedEntry: 'accessibility', wheelchairAccess: 'accessibility',
  keylessEntry: 'accessibility', carbonMonoxide: 'accessibility', smokeDetector: 'accessibility', security: 'accessibility',
  // parking
  offStreetParking: 'parking', evCharging: 'parking', garageParking: 'parking',
  // location
  mountainView: 'location', cityView: 'location', waterfront: 'location', waterView: 'location',
};

// ---------------------------------------------------------------------------
// Toggle helpers
// ---------------------------------------------------------------------------

const toggleArrayValue = (arr: string[], value: string): string[] =>
  arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SearchFiltersModal({
  isOpen,
  onOpenChange,
  filters,
  onApplyFilters,
  listings,
  tripData,
}: SearchFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) setLocalFilters(filters);
  }, [isOpen, filters]);

  const filteredCount = useMemo(
    () => listings.filter(l => {
      const prices = l.monthlyPricing?.map((p: any) => p.price) || [];
      const minP = prices.length ? Math.min(...prices) : (l.shortestLeasePrice || 0);
      const maxP = prices.length ? Math.max(...prices) : minP;
      return matchesFilters({ ...l, calculatedPrice: l.price, calculatedPriceMin: minP, calculatedPriceMax: maxP }, localFilters, false, null);
    }).length,
    [listings, localFilters],
  );

  // ------ update helpers ------

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) =>
    setLocalFilters(prev => ({ ...prev, [key]: value }));

  const togglePropertyType = (value: string) =>
    updateFilter('propertyTypes', toggleArrayValue(localFilters.propertyTypes, value));

  const toggleUtility = (value: string) =>
    updateFilter('utilities', toggleArrayValue(localFilters.utilities, value));

  const togglePet = (value: string) =>
    updateFilter('pets', toggleArrayValue(localFilters.pets, value));

  const toggleLaundry = (value: string) =>
    updateFilter('laundry', toggleArrayValue(localFilters.laundry, value));

  const toggleFurniture = (value: string) => {
    if (value === 'furnished') updateFilter('furnished', !localFilters.furnished);
    if (value === 'unfurnished') updateFilter('unfurnished', !localFilters.unfurnished);
  };

  const toggleAmenity = (value: string) => {
    const key = AMENITY_TO_FILTER_KEY[value];
    if (!key) return;
    const current = localFilters[key];
    if (Array.isArray(current)) {
      updateFilter(key, toggleArrayValue(current as string[], value) as any);
    }
  };

  const isAmenitySelected = (value: string): boolean => {
    const key = AMENITY_TO_FILTER_KEY[value];
    if (!key) return false;
    const current = localFilters[key];
    return Array.isArray(current) && (current as string[]).includes(value);
  };

  const clearFilters = () => setLocalFilters({ ...DEFAULT_FILTER_OPTIONS });

  const applyFilters = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const cancel = () => onOpenChange(false);

  // ------ render helpers ------

  const renderPillGrid = (options: PillOption[], isSelected: (v: string) => boolean, onToggle: (v: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <FilterPill
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          selected={isSelected(opt.value)}
          onClick={() => onToggle(opt.value)}
        />
      ))}
    </div>
  );

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="max-w-2xl !p-0 !gap-0"
      heightStyle="!top-[10vh] md:!top-[25vh]"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* ---- Header ---- */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b bg-background z-10">
          <h2 className="text-xl font-semibold">Filters</h2>
          <button onClick={clearFilters} className="text-sm font-medium text-[#3c8787] hover:underline">
            Clear Filters
          </button>
        </div>

        {/* ---- Scrollable body ---- */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6">
            {/* Price Range */}
            <CollapsibleSection title="Price Range">
              <PriceRangeInputs
                minPrice={localFilters.minPrice}
                maxPrice={localFilters.maxPrice}
                onMinChange={v => updateFilter('minPrice', v)}
                onMaxChange={v => updateFilter('maxPrice', v)}
              />
            </CollapsibleSection>

            {/* Property Type */}
            <CollapsibleSection title="Property Type">
              {renderPillGrid(
                PROPERTY_TYPE_OPTIONS,
                v => localFilters.propertyTypes.includes(v),
                togglePropertyType,
              )}
            </CollapsibleSection>

            {/* Rooms & Beds */}
            <CollapsibleSection title="Rooms & Beds">
              <CounterRow label="Bedrooms" value={localFilters.minBedrooms} onChange={v => updateFilter('minBedrooms', v)} />
              <CounterRow label="Bathrooms" value={localFilters.minBathrooms} onChange={v => updateFilter('minBathrooms', v)} />
            </CollapsibleSection>

            {/* Utilities */}
            <CollapsibleSection title="Utilities">
              {renderPillGrid(
                UTILITY_OPTIONS,
                v => localFilters.utilities.includes(v),
                toggleUtility,
              )}
            </CollapsibleSection>

            {/* Furniture */}
            <CollapsibleSection title="Furniture" defaultOpen={false}>
              {renderPillGrid(
                FURNITURE_OPTIONS,
                v => (v === 'furnished' ? localFilters.furnished : localFilters.unfurnished),
                toggleFurniture,
              )}
            </CollapsibleSection>

            {/* Pets */}
            <CollapsibleSection title="Pets" defaultOpen={false}>
              {renderPillGrid(
                PET_OPTIONS,
                v => localFilters.pets.includes(v),
                togglePet,
              )}
            </CollapsibleSection>

            {/* Laundry */}
            <CollapsibleSection title="Laundry" defaultOpen={false}>
              {renderPillGrid(
                LAUNDRY_OPTIONS,
                v => localFilters.laundry.includes(v),
                toggleLaundry,
              )}
            </CollapsibleSection>

            {/* Other Amenities */}
            <CollapsibleSection title="Other Amenities" defaultOpen={false}>
              <div className="space-y-4">
                <AmenitySubGroup title="Inside" options={INSIDE_AMENITIES} isSelected={isAmenitySelected} onToggle={toggleAmenity} />
                <AmenitySubGroup title="Outside" options={OUTSIDE_AMENITIES} isSelected={isAmenitySelected} onToggle={toggleAmenity} />
                <AmenitySubGroup title="Parking" options={PARKING_AMENITIES} isSelected={isAmenitySelected} onToggle={toggleAmenity} />
                <AmenitySubGroup title="Accessibility and Safety" options={ACCESSIBILITY_AMENITIES} isSelected={isAmenitySelected} onToggle={toggleAmenity} />
                <AmenitySubGroup title="Location" options={LOCATION_AMENITIES} isSelected={isAmenitySelected} onToggle={toggleAmenity} />
              </div>
            </CollapsibleSection>
          </div>
        </ScrollArea>

        {/* ---- Footer ---- */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-t bg-background z-10">
          <Button variant="outline" onClick={cancel} className="px-6">
            Cancel
          </Button>
          <Button onClick={applyFilters} className="px-6 bg-[#3c8787] hover:bg-[#2d6b6b] text-white">
            Show {filteredCount} Listing{filteredCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </BrandModal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriceRangeInputs({ minPrice, maxPrice, onMinChange, onMaxChange }: {
  minPrice: number | null;
  maxPrice: number | null;
  onMinChange: (v: number | null) => void;
  onMaxChange: (v: number | null) => void;
}) {
  const parsePrice = (raw: string): number | null => {
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? null : num;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="No min"
            value={minPrice ?? ''}
            onChange={e => onMinChange(parsePrice(e.target.value))}
            className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3c8787]"
          />
        </div>
      </div>
      <span className="text-gray-400 pt-5">—</span>
      <div className="flex-1">
        <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="No max"
            value={maxPrice ?? ''}
            onChange={e => onMaxChange(parsePrice(e.target.value))}
            className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3c8787]"
          />
        </div>
      </div>
    </div>
  );
}

function AmenitySubGroup({ title, options, isSelected, onToggle }: {
  title: string;
  options: PillOption[];
  isSelected: (v: string) => boolean;
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <FilterPill
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            selected={isSelected(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
