import React, { useState, useEffect, useRef } from "react";
import { DisabledMobileInputs } from "./disabled-inputs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createTrip } from "@/app/actions/trips";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import GuestTypeCounter from "./GuestTypeCounter";
import { cn } from "@/lib/utils";
import { BrandDialog } from "@/components/brandDialog";
import { BrandButton } from "@/components/ui/brandButton";
import { Input } from "@/components/ui/input";
import { ImSpinner8 } from "react-icons/im";
import HeroLocationSuggest from "./HeroLocationSuggest";

interface SearchInputsMobileProps {
  hasAccess: boolean;
  className?: string;
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  headerText?: string;
  headerClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Add this type definition
type ActiveContentType = 'location' | 'date' | 'guests' | null;

const SearchInputsMobile: React.FC<SearchInputsMobileProps> = ({
  hasAccess,
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white',
  headerText,
  headerClassName,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}) => {
  const [hasBeenSelected, setHasBeenSelected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Replace activeInput state with new type
  const [activeContent, setActiveContent] = useState<ActiveContentType>(null);
  const [totalGuests, setTotalGuests] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [guests, setGuests] = useState({ pets: 0, children: 0, adults: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use external dialog control if provided, otherwise use internal
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  const inputClasses = `w-full px-4 py-0 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-background ${inputClassName || ''}`;

  // Add this effect to update totalGuests whenever guests state changes
  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  // Format the dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFooterDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    // Auto-advance to the next step upon selection
    setActiveContent('date');
  };

  // Add refs for each input
  const locationInputRef = useRef<HTMLInputElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedLocation.lat || !selectedLocation.lng || !selectedLocation.description) {
      setIsOpen(true);
      setActiveContent('location');
      toast({
        variant: "destructive",
        description: `No lat/lng found for destination`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createTrip({
        locationString: selectedLocation.description,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (response.success && response.trip) {
        router.push(`/platform/searches/set-preferences/${response.trip.id}`);
      } else {
        toast({
          variant: "destructive",
          description: response.success === false ? response.error : "Failed to create trip",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "An unexpected error occurred while creating the trip.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeContent === 'location') {
      setActiveContent('date');
    } else if (activeContent === 'date') {
      setActiveContent('guests');
    } else if (activeContent === 'guests') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (activeContent === 'date') {
      setActiveContent('location');
    } else if (activeContent === 'guests') {
      setActiveContent('date');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveContent(null);
  };

  const getTitle = () => {
    switch (activeContent) {
      case 'location':
        return 'Select Location';
      case 'date':
        return 'Select Dates';
      case 'guests':
        return 'Add Guests';
      default:
        return 'Find your next home';
    }
  };

  const renderFooter = () => {
    const isFirstStep = activeContent === 'location';
    const isLastStep = activeContent === 'guests';
    const isDateStep = activeContent === 'date';
    const areDatesSelected = dateRange.start || dateRange.end;

    return (
      <div className="flex justify-between items-center w-full">
        {isDateStep ? (
          <div className="flex items-center gap-3">
            <Input
              className="w-[136px]"
              value={formatFooterDate(dateRange.start)}
              placeholder="Start Date"
              readOnly
            />
            <span className="text-gray-600">–</span>
            <Input
              className="w-[136px]"
              value={formatFooterDate(dateRange.end)}
              placeholder="End Date"
              readOnly
            />
          </div>
        ) : (
          <BrandButton variant="outline" onClick={isFirstStep ? handleClose : handleBack} size="sm">
            {isFirstStep ? 'Close' : 'Back'}
          </BrandButton>
        )}

        <div className="flex items-center gap-3">
          {isDateStep && (
            <BrandButton
              variant="outline"
              onClick={areDatesSelected ? () => setDateRange({ start: null, end: null }) : handleBack}
              size="sm"
            >
              {areDatesSelected ? 'Clear' : 'Back'}
            </BrandButton>
          )}
          <BrandButton
            variant="default"
            onClick={handleNext}
            size="sm"
            disabled={isSubmitting && isLastStep}
            className={cn({ 'opacity-75': isSubmitting && isLastStep })}
          >
            {isSubmitting && isLastStep && <ImSpinner8 className="animate-spin mr-2 h-4 w-4" />}
            {isLastStep ? 'Start Search' : 'Next'}
          </BrandButton>
        </div>
      </div>
    );
  };

  // Mobile-specific location component with preset cities
  const MobileLocationSuggest = () => {
    const [inputValue, setInputValue] = useState("");
    const [apiSuggestions, setApiSuggestions] = useState<any[]>([]);
    const [showingPresets, setShowingPresets] = useState(true);

    const PRESET_CITIES = [
      { place_id: "preset_nyc", description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
      { place_id: "preset_la", description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
      { place_id: "preset_chicago", description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
      { place_id: "preset_houston", description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
      { place_id: "preset_miami", description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
    ];

    const suggestions = showingPresets ? PRESET_CITIES : apiSuggestions;

    const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      if (newValue.length > 0) {
        setShowingPresets(false);
        try {
          const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(newValue)}`);
          const data = await response.json();
          setApiSuggestions(data.predictions || []);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setApiSuggestions([]);
        }
      } else {
        setShowingPresets(true);
        setApiSuggestions([]);
      }
    };

    const handleSelect = async (description: string, place_id: string) => {
      const isPreset = place_id.startsWith('preset_');
      const trimmedDescription = isPreset ? description : description.slice(0, -5);
      
      setLocationDisplayValue(trimmedDescription);
      setInputValue("");
      setApiSuggestions([]);
      setShowingPresets(true);

      if (isPreset) {
        const presetCity = PRESET_CITIES.find(city => city.place_id === place_id);
        if (presetCity) {
          handleLocationSelect({ 
            description: presetCity.description, 
            lat: presetCity.lat, 
            lng: presetCity.lng 
          });
        }
      } else {
        try {
          const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            handleLocationSelect({ description: trimmedDescription, lat, lng });
          }
        } catch (error) {
          console.error("Error fetching geocode:", error);
        }
      }
    };

    return (
      <div className="p-4">
        <input
          value={inputValue}
          onChange={handleInput}
          placeholder={
            selectedLocation.description
              ? "Wrong place? Begin typing and select another"
              : "Enter an address or city"
          }
          type="text"
          className="w-full h-full text-sm focus:outline-none min-w-0 mb-4"
          autoFocus={true}
        />
        <div 
          className="transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            maxHeight: suggestions.length >= 5 ? '320px' : `${suggestions.length * 64}px`,
            opacity: suggestions.length > 0 ? 1 : 0
          }}
        >
          <ul>
            {suggestions.map((suggestion) => (
              <li
                className={`hover:bg-gray-100 p-3 cursor-pointer text-sm rounded-md transition-colors duration-150 ${
                  showingPresets ? 'text-gray-500' : 'text-gray-900'
                }`}
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
              >
                {showingPresets ? suggestion.description : suggestion.description.slice(0, -5)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Add this function to render content based on active type
  const renderActiveContent = () => {
    switch (activeContent) {
      case 'location':
        return (
          <>
            {selectedLocation.description && (
              <div className="mb-4 text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-semibold text-gray-800">Selected Location:</p>
                <p className="text-gray-600">{selectedLocation.description}</p>
              </div>
            )}
            <MobileLocationSuggest />
          </>
        );
      case 'date':
        return (
          <MobileDateRange
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClose={() => setActiveContent(null)}
            onProceed={() => setActiveContent('guests')}
            minimumDateRange={{ months: 1 }}
            maximumDateRange={{ months: 12 }}
          />
        );
      case 'guests':
        return <GuestTypeCounter guests={guests} setGuests={setGuests} />;
      default:
        return null;
    }
  };

  // Update handleInputClick to use string types
  const handleInputClick = (e: React.MouseEvent, content: ActiveContentType, inputRef: React.RefObject<HTMLInputElement>) => {
    e.stopPropagation();

    // If clicking the same input that's already active, close the popover
    if (activeContent === content && isOpen) {
      setIsOpen(false);
      setActiveContent(null);
      return;
    }

    // Otherwise, open the popover with the new content
    setActiveContent(content);
    setIsOpen(true);
  };

  const currentStep = activeContent === 'location' ? 1 : activeContent === 'date' ? 2 : 3;

  // When used externally (from hero), start with location step
  useEffect(() => {
    if (externalIsOpen && !activeContent) {
      setActiveContent('location');
    }
  }, [externalIsOpen, activeContent]);

  // Render different versions based on hasAccess
  if (!hasAccess) {
    return (
      <DisabledMobileInputs headerText={headerText} />
    );
  }

  // If external dialog control is provided, only render the BrandDialog
  if (externalIsOpen !== undefined) {
    return (
      <BrandDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setActiveContent(null);
          }
        }}
        titleComponent={
          <h2 className="text-lg font-semibold text-center flex-grow">
            {getTitle()}
          </h2>
        }
        contentComponent={renderActiveContent()}
        footerComponent={renderFooter()}
        currentStep={currentStep}
        totalSteps={3}
      />
    );
  }

  // Original component rendering for standalone usage
  return (
    <div ref={containerRef} className="relative">
      {headerText && <h3 className={cn("text-xl font-semibold mb-3 text-green-800 text-center", headerClassName)}>{headerText}</h3>}
      <div
        className={cn('flex flex-col gap-3 px-3 py-2 items-center bg-background rounded-3xl shadow-md overflow-hidden', className)}
      >
        <div className="w-full flex flex-col border-b border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => handleInputClick(e, 'location', locationInputRef)}>Where</label>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="Choose Location"
            value={locationDisplayValue}
            className={inputClasses}
            readOnly
            onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
          />
        </div>

        <div className="w-full flex flex-col border-b border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}>Move In</label>
          <input
            ref={moveInInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.start)}
            className={inputClasses}
            readOnly
            onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
          />
        </div>

        <div className="w-full flex flex-col border-b border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}>Move Out</label>
          <input
            ref={moveOutInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.end)}
            className={inputClasses}
            readOnly
            onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
          />
        </div>

        <div className="w-full flex flex-col">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => {
              setHasBeenSelected(true);
              handleInputClick(e, 'guests', guestsInputRef)
            }}>Who</label>
          <input
            ref={guestsInputRef}
            type="text"
            placeholder="Add renters"
            value={hasBeenSelected ? `${totalGuests} Renter${totalGuests !== 1 ? 's' : ''}` : ''}
            className={`${inputClasses}`}
            readOnly
            onClick={(e) => {
              setHasBeenSelected(true);
              handleInputClick(e, 'guests', guestsInputRef)
            }}
          />
        </div>

        <div className="w-full">
          <button
            disabled={!hasAccess || isSubmitting}
            onClick={(e) => {
              e.stopPropagation();
              if (!(locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng))) {
                handleSubmit();
              }
            }}
            className={cn(
              'w-full p-3 rounded-full',
              searchButtonClassNames || 'bg-primaryBrand',
              !hasAccess || isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            )}
          >
            {isSubmitting || (locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng)) ? (
              <ImSpinner8 className={`animate-spin ${searchIconColor}`} />
            ) : (
              <span className={searchIconColor}>Search</span>
            )}
          </button>
        </div>
      </div>

      <BrandDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setActiveContent(null);
          }
        }}
        titleComponent={
          <h2 className="text-lg font-semibold text-center flex-grow">
            {getTitle()}
          </h2>
        }
        contentComponent={renderActiveContent()}
        footerComponent={renderFooter()}
        currentStep={currentStep}
        totalSteps={3}
      />
    </div>
  );
};

export default SearchInputsMobile;
