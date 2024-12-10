import React, { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import HeroDateRange from "@/components/ui/custom-calendar/date-range-selector/hero-date-range";
import { useToast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "@/components/home-components/HeroLocationSuggest";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";
import { ImSpinner8 } from "react-icons/im";
import { useTripContext } from "@/contexts/trip-context-provider";
import { Check, X } from "lucide-react";

type ActiveContentType = 'location' | 'dateStart' | 'dateEnd' | 'guests' | null;

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

  const inputClasses = "w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent hover:bg-gray-100 transition-colors group";

  React.useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const formatDate = (date: Date) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
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
      case 'dateStart':
      case 'dateEnd':
        return (
          <HeroDateRange
            start={dateRange.start || new Date()}
            end={dateRange.end || new Date()}
            handleChange={(start, end) => setDateRange({ start, end })}
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

    return locationChanged || startDateChanged || endDateChanged || guestsChanged;
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
  };

  const handleSave = () => {
    alert('placeholder');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-row no-wrap items-center bg-background rounded-full shadow-md overflow-hidden">
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-2 border-r border-gray-300">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Location</span>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Where to?"
              value={locationDisplayValue}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
              readOnly
              onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
            />
          </div>
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-2 border-r border-gray-300">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Move In</span>
            <input
              ref={moveInInputRef}
              type="text"
              placeholder="Move in:"
              value={formatDate(dateRange.start)}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
              readOnly
              onClick={(e) => handleInputClick(e, 'dateStart', moveInInputRef)}
            />
          </div>
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-2 border-r border-gray-300">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Move Out</span>
            <input
              ref={moveOutInputRef}
              type="text"
              placeholder="Move out:"
              value={formatDate(dateRange.end)}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
              readOnly
              onClick={(e) => handleInputClick(e, 'dateEnd', moveOutInputRef)}
            />
          </div>
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-2">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 px-3">Guests</span>
            <input
              ref={guestsInputRef}
              type="text"
              placeholder="Who?"
              value={totalGuests ? `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}` : ''}
              className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
              readOnly
              onClick={(e) => handleInputClick(e, 'guests', guestsInputRef)}
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