import React, { useRef } from "react";
import { DesktopDateRange } from "@/components/ui/custom-calendar/date-range-selector/desktop-date-range";
import { useToast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "@/components/home-components/HeroLocationSuggest";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";
import { useTripContext } from "@/contexts/trip-context-provider";
import { Check, X } from "lucide-react";
import { editTrip } from "@/app/actions/trips";

type ActiveContentType = 'location' | 'date' | 'guests' | null;

const EditSearchInputsDesktop: React.FC = () => {
  const { state } = useTripContext();
  const { toast } = useToast();
  const [activeContent, setActiveContent] = React.useState<ActiveContentType>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(0);
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: state.trip?.startDate ? new Date(state.trip.startDate) : null,
    end: state.trip?.endDate ? new Date(state.trip.endDate) : null,
  });
  const [guests, setGuests] = React.useState({
    adults: state.trip?.numAdults || 0,
    children: state.trip?.numChildren || 0,
    pets: state.trip?.numPets || 0
  });
  const [flexibility, setFlexibility] = React.useState<{ start: "exact" | number | null; end: "exact" | number | null }>(() => ({
    start: state.trip?.flexibleStart === 0 || state.trip?.flexibleStart == null ? "exact" : state.trip.flexibleStart,
    end: state.trip?.flexibleEnd === 0 || state.trip?.flexibleEnd == null ? "exact" : state.trip.flexibleEnd,
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: state.trip?.locationString || '',
    description: state.trip?.locationString || '',
    lat: state.trip?.latitude || null,
    lng: state.trip?.longitude || null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState(state.trip?.locationString || '');
  const [arrowPosition, setArrowPosition] = React.useState(5);

  const locationInputRef = useRef<HTMLInputElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const formatDate = (date: Date) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const handleInputClick = (e: React.MouseEvent, content: ActiveContentType, inputRef: React.RefObject<HTMLInputElement>) => {
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
        return <HeroLocationSuggest hasAccess={true} onLocationSelect={handleLocationSelect} setDisplayValue={setLocationDisplayValue} />;
      case 'date':
        return (
          <DesktopDateRange
            start={dateRange.start || null}
            end={dateRange.end || null}
            handleChange={(start, end) => setDateRange({ start, end })}
            onProceed={handleProceed}
            onClear={() => setDateRange({ start: null, end: null })}
            onFlexibilityChange={(newFlexibility) => setFlexibility(newFlexibility)}
            initialFlexibility={flexibility}
            minimumDateRange={{ months: 1 }} // Add minimum date range
          />
        );
      case 'guests':
        return <GuestTypeCounter guests={guests} setGuests={setGuests} />;
      default:
        return null;
    }
  };

  const hasChanges = () => {
    const locationChanged = locationDisplayValue !== state.trip?.locationString;
    const startDateChanged = dateRange.start?.toISOString() !== (state.trip?.startDate ? new Date(state.trip.startDate).toISOString() : null);
    const endDateChanged = dateRange.end?.toISOString() !== (state.trip?.endDate ? new Date(state.trip.endDate).toISOString() : null);
    const guestsChanged =
      guests.adults !== state.trip?.numAdults ||
      guests.children !== state.trip?.numChildren ||
      guests.pets !== state.trip?.numPets;

    const parentFlexStart = state.trip?.flexibleStart ?? 0;
    const parentFlexEnd = state.trip?.flexibleEnd ?? 0;
    const currentFlexStart = flexibility.start === "exact" ? 0 : flexibility.start;
    const currentFlexEnd = flexibility.end === "exact" ? 0 : flexibility.end;

    return locationChanged || startDateChanged || endDateChanged || guestsChanged ||
      currentFlexStart !== parentFlexStart || currentFlexEnd !== parentFlexEnd;
  };

  const handleReset = () => {
    setLocationDisplayValue(state.trip?.locationString || '');
    setSelectedLocation({
      destination: state.trip?.locationString || '',
      description: state.trip?.locationString || '',
      lat: state.trip?.latitude || null,
      lng: state.trip?.longitude || null
    });
    setDateRange({
      start: state.trip?.startDate ? new Date(state.trip.startDate) : null,
      end: state.trip?.endDate ? new Date(state.trip.endDate) : null,
    });
    setGuests({
      adults: state.trip?.numAdults || 0,
      children: state.trip?.numChildren || 0,
      pets: state.trip?.numPets || 0
    });
    setFlexibility({
      start: state.trip?.flexibleStart === 0 || state.trip?.flexibleStart == null ? "exact" : state.trip.flexibleStart,
      end: state.trip?.flexibleEnd === 0 || state.trip?.flexibleEnd == null ? "exact" : state.trip.flexibleEnd,
    });
  };

  const handleSave = async () => {
    if (!state.trip?.id) {
      toast({
        variant: "destructive",
        description: "No trip ID found",
      });
      return;
    }

    const response = await editTrip(state.trip.id, {
      locationString: locationDisplayValue,
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
  }, []); // Only re-run if isOpen changes

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
    <div ref={containerRef} className="relative">
      <div className="flex flex-row no-wrap items-center bg-background rounded-full shadow-md overflow-hidden">
        <div
          className="flex-1 relative hover:bg-gray-100 transition-colors p-2 border-r border-gray-300 cursor-pointer"
          onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Location</span>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Where to?"
              value={locationDisplayValue}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
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
            <span className="text-xs text-gray-500 px-3">Guests</span>
            <input
              ref={guestsInputRef}
              type="text"
              placeholder="Who?"
              value={totalGuests ? `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}` : ''}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent cursor-pointer"
              readOnly
            />
          </div>
        </div>
        <div className="flex-shrink-0 p-2 flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges()}
            className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-300'
              }`}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges()}
            className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed
              ${hasChanges()
                ? 'text-green-500 hover:bg-green-50'
                : 'text-gray-300'
              }`}
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
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

export default EditSearchInputsDesktop;
