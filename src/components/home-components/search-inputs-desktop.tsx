import React, { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import HeroDateRange from "@/components/ui/custom-calendar/date-range-selector/hero-date-range";
import { useToast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "./HeroLocationSuggest";
import { useAuth, useUser } from "@clerk/nextjs";
import GuestTypeCounter from "./GuestTypeCounter";
import { ImSpinner8 } from "react-icons/im";
import { createTrip } from "@/app/actions/trips";
import { useRouter } from "next/navigation";
import { DisabledDesktopInputs } from "./disabled-inputs";

interface SearchInputsDesktopProps {
  dateRangeContent?: React.ReactNode;
  guestsContent?: React.ReactNode;
}

// Add this type definition
type ActiveContentType = 'location' | 'date' | 'guests' | null;

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = ({
}) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      } else {
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, user]);

  // Replace activeContent state with new type
  const [activeContent, setActiveContent] = React.useState<ActiveContentType>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(null);
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [guests, setGuests] = React.useState({ pets: 0, children: 0, adults: 0 })
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState('');

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-transparent`;

  // Add this effect to update totalGuests whenever guests state changes
  React.useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  // Format the dates for display
  const formatDate = (date: Date) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  // Add new state to track the arrow position
  const [arrowPosition, setArrowPosition] = React.useState(5); // Default left position in rem

  // Add refs for each input
  const locationInputRef = useRef<HTMLInputElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);

  // Add this function to render content based on active type
  const renderActiveContent = () => {
    switch (activeContent) {
      case 'location':
        return <HeroLocationSuggest hasAccess={hasAccess} onLocationSelect={handleLocationSelect} setDisplayValue={setLocationDisplayValue} />;
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

  // Update handleInputClick to use string types
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

  const handleSubmit = async () => {
    if (!selectedLocation.lat || !selectedLocation.lng || !selectedLocation.description) {
      setIsOpen(true);
      setActiveContent('location');
      toast({
        variant: "destructive",
        description: `No lat/lng found for destination`,
      });
      return;
    }

    const response = await createTrip({
      locationString: selectedLocation.description,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
    });

    if (response.success && response.trip) {
      router.push(`/platform/trips/${response.trip.id}`);
    } else {
      toast({
        variant: "destructive",
        description: response?.message || "Failed to create trip",
      });
    }
  };

  // Render different versions based on hasAccess
  if (!hasAccess) {
    return (
      <DisabledDesktopInputs />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-row no-wrap p-3 items-center bg-gray-100 rounded-full shadow-md overflow-hidden"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <input
          ref={locationInputRef}
          type="text"
          placeholder="Where to?"
          value={locationDisplayValue}
          className={inputClasses}
          readOnly
          onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
        />
        <input
          ref={moveInInputRef}
          type="text"
          placeholder="Move in:"
          value={formatDate(dateRange.start)}
          className={inputClasses}
          readOnly={!hasAccess}
          onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
        />
        <input
          ref={moveOutInputRef}
          type="text"
          placeholder="Move out:"
          value={formatDate(dateRange.end)}
          className={inputClasses}
          readOnly={!hasAccess}
          onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
        />
        <input
          ref={guestsInputRef}
          type="text"
          placeholder="Who?"
          value={totalGuests ? `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}` : ''}
          className={`${inputClasses} sm:border-r-0`}
          readOnly={!hasAccess}
          onClick={(e) => handleInputClick(e, 'guests', guestsInputRef)}
        />
        <div className="flex-shrink-0">
          <button
            disabled={!hasAccess}
            onClick={(e) => {
              e.stopPropagation();
              // Only run handleSubmit if we're not in a loading state
              if (!(locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng))) {
                handleSubmit();
              }
            }}
            className={`w-auto p-3 ${hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              } bg-primaryBrand rounded-full`}
          >
            {locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng) ? (
              <ImSpinner8 className="text-white mx-auto animate-spin" size={20} />
            ) : (
              <FaSearch className="text-white mx-auto" size={20} />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-lg z-50
          before:content-[''] before:absolute before:-top-2 before:left-[var(--arrow-position)] before:w-4 before:h-4
          before:bg-white before:rotate-45 before:border-l before:border-t before:border-gray-200
          transform origin-top transition-all duration-200 ease-out
          animate-in fade-in slide-in-from-top-2"
          style={{ '--arrow-position': `${arrowPosition}%` } as React.CSSProperties}>
          {renderActiveContent()}
        </div>
      )}
    </div>
  );
};

export default SearchInputsDesktop;


