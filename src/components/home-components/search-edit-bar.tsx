import React from "react";
import { useParams } from "next/navigation";
import { Trip } from "@prisma/client";
import { editTrip } from "@/app/actions/trips";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { DesktopDateRange } from "@/components/ui/custom-calendar/date-range-selector/desktop-date-range";
import HeroLocationSuggest from "@/components/home-components/HeroLocationSuggest";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";

interface SearchEditBarProps {
  className?: string;
  tripId?: string;
}

const SearchEditBar: React.FC<SearchEditBarProps> = ({ className, tripId }) => {
  const params = useParams();
  const { toast } = useToast();
  // Use provided tripId or get it from the URL params
  const effectiveTripId = tripId || (params?.tripId as string);
  
  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // States for the edit form
  const [activeContent, setActiveContent] = React.useState<'location' | 'date' | 'guests' | null>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(0);
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [guests, setGuests] = React.useState({
    adults: 0,
    children: 0,
    pets: 0
  });
  const [flexibility, setFlexibility] = React.useState<{ start: "exact" | number | null; end: "exact" | number | null }>({
    start: "exact",
    end: "exact",
  });
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState('');
  const [arrowPosition, setArrowPosition] = React.useState(5);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const locationInputRef = React.useRef<HTMLInputElement>(null);
  const moveInInputRef = React.useRef<HTMLInputElement>(null);
  const moveOutInputRef = React.useRef<HTMLInputElement>(null);
  const guestsInputRef = React.useRef<HTMLInputElement>(null);
  
  // Fetch trip data when component mounts
  React.useEffect(() => {
    const fetchTripData = async () => {
      if (!effectiveTripId) {
        setLoading(false);
        return;
      }
      
      try {
        // Directly use fetch API to avoid TripContext dependency
        const response = await fetch(`/api/trips/${effectiveTripId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trip data');
        }
        
        const tripData = await response.json();
        
        // Populate form with trip data
        setTrip(tripData);
        setLocationDisplayValue(tripData.locationString || '');
        setSelectedLocation({
          destination: tripData.locationString || '',
          description: tripData.locationString || '',
          lat: tripData.latitude || null,
          lng: tripData.longitude || null
        });
        
        setDateRange({
          start: tripData.startDate ? new Date(tripData.startDate) : null,
          end: tripData.endDate ? new Date(tripData.endDate) : null,
        });
        
        setGuests({
          adults: tripData.numAdults || 0,
          children: tripData.numChildren || 0,
          pets: tripData.numPets || 0
        });
        
        setFlexibility({
          start: tripData.flexibleStart === 0 ? "exact" : tripData.flexibleStart,
          end: tripData.flexibleEnd === 0 ? "exact" : tripData.flexibleEnd,
        });
        
      } catch (error) {
        console.error('Error fetching trip data:', error);
        toast({
          variant: "destructive",
          description: "Failed to load trip data. Using default values.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripData();
  }, [effectiveTripId, toast]);
  
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
          />
        );
      case 'guests':
        return <GuestTypeCounter guests={guests} setGuests={setGuests} />;
      default:
        return null;
    }
  };
  
  const hasChanges = () => {
    if (!trip) return false;
    
    const locationChanged = locationDisplayValue !== trip.locationString;
    const startDateChanged = dateRange.start?.toISOString() !== 
      (trip.startDate ? new Date(trip.startDate).toISOString() : null);
    const endDateChanged = dateRange.end?.toISOString() !== 
      (trip.endDate ? new Date(trip.endDate).toISOString() : null);
    
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
    if (!trip) return;
    
    setLocationDisplayValue(trip.locationString || '');
    setSelectedLocation({
      destination: trip.locationString || '',
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
  };
  
  const handleSave = async () => {
    if (!effectiveTripId) {
      toast({
        variant: "destructive",
        description: "No trip ID found",
      });
      return;
    }

    const response = await editTrip(effectiveTripId, {
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
  }, []);
  
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
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
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

export default SearchEditBar;
