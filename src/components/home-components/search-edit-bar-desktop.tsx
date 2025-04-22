import React from "react";
// import { useParams } from "next/navigation"; // Removed
import { Trip } from "@prisma/client";
import { editTrip } from "@/app/actions/trips";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { DesktopDateRange } from "@/components/ui/custom-calendar/date-range-selector/desktop-date-range";
import HeroLocationSuggest from "@/components/home-components/HeroLocationSuggest";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchEditBarDesktopProps {
  className?: string;
  trip: Trip; // Receive the full trip object
}

const SearchEditBarDesktop: React.FC<SearchEditBarDesktopProps> = ({ className, trip }) => {
  const { toast } = useToast();
  // Initialize state directly from the trip prop
  const [activeContent, setActiveContent] = React.useState<'location' | 'date' | 'guests' | null>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(
    (trip.numAdults || 0) + (trip.numChildren || 0) + (trip.numPets || 0)
  );
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: trip.startDate ? new Date(trip.startDate) : null,
    end: trip.endDate ? new Date(trip.endDate) : null,
  });
  const [guests, setGuests] = React.useState({
    adults: trip.numAdults || 0,
    children: trip.numChildren || 0,
    pets: trip.numPets || 0
  });
  const [flexibility, setFlexibility] = React.useState<{ start: "exact" | number | null; end: "exact" | number | null }>({
    start: trip.flexibleStart === 0 ? "exact" : trip.flexibleStart,
    end: trip.flexibleEnd === 0 ? "exact" : trip.flexibleEnd,
  });
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: trip.locationString || '', // Use destination for consistency if needed, or just description
    description: trip.locationString || '',
    lat: trip.latitude || null,
    lng: trip.longitude || null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState(trip.locationString || '');
  const [arrowPosition, setArrowPosition] = React.useState(5);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const locationInputRef = React.useRef<HTMLInputElement>(null);
  const moveInInputRef = React.useRef<HTMLInputElement>(null);
  const moveOutInputRef = React.useRef<HTMLInputElement>(null);
  const guestsInputRef = React.useRef<HTMLInputElement>(null);

  // Effect to focus the container on mount to prevent text selection in input
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus({ preventScroll: true }); // Focus container, prevent scrolling
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  React.useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLocationSelect = (location: any) => {
    if (!location) return;
    setSelectedLocation(location);
    setLocationDisplayValue(location?.description || location?.destination || '');
    setActiveContent('date');
    if (containerRef.current && moveInInputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = moveInInputRef.current.getBoundingClientRect();
      const inputCenter = inputRect.left + inputRect.width / 2;
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
    }
  };

  const handleInputClick = (e: React.MouseEvent, content: 'location' | 'date' | 'guests' | null, inputRef: React.RefObject<HTMLInputElement>) => {
    e.stopPropagation();

    if (activeContent === content) {
      setIsOpen(false);
      setActiveContent(null);
      return;
    }

    if (containerRef.current && inputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = inputRef.current.getBoundingClientRect();
      const inputLeft = inputRect.left;
      const inputCenter = inputLeft + (inputRect.width / 2);
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
    }

    setActiveContent(content);
    setIsOpen(true);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveContent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderActiveContent = () => {
    switch (activeContent) {
      case 'location':
        // Assuming HeroLocationSuggest needs hasAccess prop, default to true for edit bar
        return <HeroLocationSuggest hasAccess={true} onLocationSelect={handleLocationSelect} setDisplayValue={setLocationDisplayValue} />;
      case 'date':
        return (
          <DesktopDateRange
            start={dateRange.start}
            end={dateRange.end}
            handleChange={(start, end) => setDateRange({ start, end })}
            onProceed={handleProceed}
            onClear={() => setDateRange({ start: null, end: null })}
            onFlexibilityChange={(newFlexibility) => setFlexibility(newFlexibility)}
            initialFlexibility={flexibility}
            minimumDateRange={{months: 1}}
            maximumDateRange={{months: 12}}
          />
        );
      case 'guests':
        return <GuestTypeCounter guests={guests} setGuests={setGuests} />;
      default:
        return null;
    }
  };

  const hasChanges = () => {
    // Trip prop is guaranteed to exist
    const locationChanged = locationDisplayValue !== trip.locationString;

    // Compare dates carefully, handling nulls and potential time zone differences if necessary
    const currentStartDateStr = dateRange.start ? dateRange.start.toISOString().split('T')[0] : null;
    const tripStartDateStr = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : null;
    const currentEndDateStr = dateRange.end ? dateRange.end.toISOString().split('T')[0] : null;
    const tripEndDateStr = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : null;

    const startDateChanged = currentStartDateStr !== tripStartDateStr;
    const endDateChanged = currentEndDateStr !== tripEndDateStr;

    const guestsChanged =
      guests.adults !== trip.numAdults ||
      guests.children !== trip.numChildren ||
      guests.pets !== trip.numPets;

    const normalizedFlexibleStart = flexibility.start === 0 ? 'exact' : flexibility.start;
    const normalizedTripFlexibleStart = trip.flexibleStart === 0 ? 'exact' : trip.flexibleStart;
    const normalizedFlexibleEnd = flexibility.end === 0 ? 'exact' : flexibility.end;
    const normalizedTripFlexibleEnd = trip.flexibleEnd === 0 ? 'exact' : trip.flexibleEnd;

    const flexibleStartChanged = normalizedFlexibleStart !== normalizedTripFlexibleStart;
    const flexibleEndChanged = normalizedFlexibleEnd !== normalizedTripFlexibleEnd;

    return locationChanged ||
      startDateChanged ||
      endDateChanged ||
      guestsChanged ||
      flexibleStartChanged ||
      flexibleEndChanged;
  };

  const handleReset = () => {
    // Trip prop is guaranteed to exist
    setLocationDisplayValue(trip.locationString || '');
    setSelectedLocation({
      destination: trip.locationString || '', // Reset destination as well if used
      description: trip.locationString || '',
      lat: trip.latitude || null,
      lng: trip.longitude || null
    });
    setDateRange({
      start: trip.startDate ? new Date(trip.startDate) : null,
      end: trip.endDate ? new Date(trip.endDate) : null,
    });
    setGuests({
      adults: trip.numAdults || 0,
      children: trip.numChildren || 0,
      pets: trip.numPets || 0
    });
    setFlexibility({
      start: trip.flexibleStart === 0 ? "exact" : trip.flexibleStart,
      end: trip.flexibleEnd === 0 ? "exact" : trip.flexibleEnd,
    });
    // Close popover on reset
    setIsOpen(false);
    setActiveContent(null);
  };

  const handleSave = async () => {
    // Use trip.id directly
    if (!trip.id) {
      toast({
        variant: "destructive",
        description: "Trip ID is missing",
      });
      return;
    }

    // Ensure location has lat/lng if it was changed
    if (locationDisplayValue !== trip?.locationString && (!selectedLocation.lat || !selectedLocation.lng)) {
       toast({
         variant: "destructive",
         description: "Please select a valid location with coordinates.",
       });
       setActiveContent('location');
       setIsOpen(true);
       return;
    }

    const response = await editTrip(trip.id, { // Use trip.id
      locationString: locationDisplayValue,
      // Ensure lat/lng are passed correctly, potentially using selectedLocation state
      latitude: selectedLocation.lat || undefined,
      longitude: selectedLocation.lng || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
      flexibleStart: flexibility.start === "exact" ? 0 : flexibility.start,
      flexibleEnd: flexibility.end === "exact" ? 0 : flexibility.end,
    });

    if (response.success) {
      toast({
        description: "Trip updated successfully. Page will refresh...",
      });
      setIsOpen(false); // Close popover on successful save
      setActiveContent(null);

      // Wait 1.5 seconds then do a full page reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast({
        variant: "destructive",
        description: response.error || "Failed to update trip",
      });
    }
  };

  // Add escape key handler
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveContent(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Removed loading state rendering

  const handleProceed = () => {
    setActiveContent('guests');
    if (containerRef.current && guestsInputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = guestsInputRef.current.getBoundingClientRect();
      const inputCenter = inputRect.left + inputRect.width / 2;
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
    }
  };
  return (
    <div ref={containerRef} className={`relative ${className}`} tabIndex={-1} style={{ outline: 'none' }}> {/* Add tabIndex and remove focus outline */}
      <div className="flex flex-row no-wrap items-center bg-background rounded-lg border border-black overflow-hidden">
        <div
          className="flex-1 relative hover:bg-gray-100 transition-colors p-2 border-r border-gray-300 cursor-pointer"
          onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Where</span>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Where to?"
              value={locationDisplayValue}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
              autoComplete="off"
            />
          </div>
        </div>
        <div
          className="flex-1 relative max-w-[100px] xl:max-w-[1000px] hover:bg-gray-100 transition-colors p-2 border-r border-gray-300 cursor-pointer"
          onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Move In</span>
            <input
              ref={moveInInputRef}
              type="text"
              placeholder="Move in:"
              value={formatDate(dateRange.start)}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
            />
          </div>
        </div>
        <div
          className="flex-1 relative max-w-[100px] xl:max-w-[1000px] hover:bg-gray-100 transition-colors p-2 border-r border-gray-300 cursor-pointer"
          onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Move Out</span>
            <input
              ref={moveOutInputRef}
              type="text"
              placeholder="Move out:"
              value={formatDate(dateRange.end)}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
            />
          </div>
        </div>
        <div
          className="flex-1 relative hover:bg-gray-100 transition-colors p-2 cursor-pointer"
          onClick={(e) => handleInputClick(e, 'guests', guestsInputRef)}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Who</span>
            <input
              ref={guestsInputRef}
              type="text"
              placeholder="Renters"
              value={totalGuests ? `${totalGuests} Renter${totalGuests !== 1 ? 's' : ''}` : ''}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
            />
          </div>
        </div>
        <TooltipProvider delayDuration={100}>
          <div className="flex-shrink-0 p-2 flex gap-2">
            {hasChanges() ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges()}
                    className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-300'
              }`}
                    aria-label="Reset changes"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel changes</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleReset}
                disabled={!hasChanges()}
                className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-300'
              }`}
                aria-label="Reset changes"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {hasChanges() ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges()}
                    className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-green-500 hover:bg-green-50'
                : 'text-gray-300'
              }`}
                    aria-label="Save changes"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save trip</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleSave}
                disabled={!hasChanges()}
                className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-300'
              }`}
                aria-label="Save changes"
              >
                <Check className="h-5 w-5" />
              </button>
            )}
          </div>
        </TooltipProvider>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-background rounded-xl shadow-lg z-50
          before:content-[''] before:absolute before:-top-2 before:left-[var(--arrow-position)] before:w-4 before:h-4
          before:bg-background before:rotate-45 before:border-l before:border-t before:border-gray-200
          transform origin-top transition-all duration-200 ease-out
          animate-in fade-in slide-in-from-top-2"
          style={{ '--arrow-position': `${arrowPosition}%` } as React.CSSProperties}>
          {renderActiveContent()}
        </div>
      )}
    </div>
  );
};

export default SearchEditBarDesktop;
