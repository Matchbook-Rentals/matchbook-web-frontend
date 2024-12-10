import React, { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import HeroDateRange from "@/components/ui/custom-calendar/date-range-selector/hero-date-range";
import { useToast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "@/components/home-components/HeroLocationSuggest";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";
import { ImSpinner8 } from "react-icons/im";
import { useTripContext } from "@/contexts/trip-context-provider";

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
    if (activeContent !== content) {
      setActiveContent(content);
      setIsOpen(true);

      if (containerRef.current && inputRef.current) {
        const containerLeft = containerRef.current.getBoundingClientRect().left;
        const inputRect = inputRef.current.getBoundingClientRect();
        const inputLeft = inputRect.left;
        const inputCenter = inputLeft + (inputRect.width / 2);
        const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
        setArrowPosition(position);
      }
    } else {
      setIsOpen(false);
      setActiveContent(null);
    }
  };

  const renderActiveContent = () => {
    switch (activeContent) {
      case 'location':
        return <HeroLocationSuggest hasAccess={true} onLocationSelect={handleLocationSelect} setDisplayValue={setLocationDisplayValue} />;
      case 'date':
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

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-row no-wrap items-center bg-background rounded-full shadow-md overflow-hidden">
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-3">
          <div className="absolute top-1 left-4 text-xs text-gray-500">Location</div>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="Where to?"
            value={locationDisplayValue}
            className="w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent"
            readOnly
            onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
          />
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-3">
          <div className="absolute top-1 left-4 text-xs text-gray-500">Move In</div>
          <input
            ref={moveInInputRef}
            type="text"
            placeholder="Move in:"
            value={formatDate(dateRange.start)}
            className="w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent"
            readOnly
            onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
          />
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-3">
          <div className="absolute top-1 left-4 text-xs text-gray-500">Move Out</div>
          <input
            ref={moveOutInputRef}
            type="text"
            placeholder="Move out:"
            value={formatDate(dateRange.end)}
            className="w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent"
            readOnly
            onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
          />
        </div>
        <div className="flex-1 relative hover:bg-gray-100 transition-colors p-3">
          <div className="absolute top-1 left-4 text-xs text-gray-500">Guests</div>
          <input
            ref={guestsInputRef}
            type="text"
            placeholder="Who?"
            value={totalGuests ? `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}` : ''}
            className="w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent"
            readOnly
            onClick={(e) => handleInputClick(e, 'guests', guestsInputRef)}
          />
        </div>
        <div className="flex-shrink-0 p-3">
          <button
            className="w-auto p-3 bg-primaryBrand rounded-full hover:bg-primaryBrand/90 transition-colors"
          >
            <FaSearch className="text-white mx-auto" size={20} />
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