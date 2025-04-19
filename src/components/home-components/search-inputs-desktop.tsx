import React, { useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { DesktopDateRange } from "@/components/ui/custom-calendar/date-range-selector/desktop-date-range";
import { useToast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "./HeroLocationSuggest";
import { useAuth, useUser } from "@clerk/nextjs";
import GuestTypeCounter from "./GuestTypeCounter";
import { ImSpinner8 } from "react-icons/im";
import { createTrip } from "@/app/actions/trips";
import { useRouter } from "next/navigation";
import { DisabledDesktopInputs } from "./disabled-inputs";
import { cn } from "@/lib/utils";

interface SearchInputsDesktopProps {
  dateRangeContent?: React.ReactNode;
  guestsContent?: React.ReactNode;
  hasAccess: boolean;
  className?: string;
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  popoverMaxWidth?: string;
  headerText?: string;
}

// Add this type definition
type ActiveContentType = 'location' | 'date' | 'guests' | null;

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = ({
  hasAccess,
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white',
  popoverMaxWidth,
  headerText
}) => {
  const [hasBeenSelected, setHasBeenSelected] = React.useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // Replace activeContent state with new type
  const [activeContent, setActiveContent] = React.useState<ActiveContentType>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(0); // Initialize with 0 instead of null
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [guests, setGuests] = React.useState({ pets: 0, children: 0, adults: 1 })
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState('');

  const inputClasses = `w-full px-4 py-0 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-background ${inputClassName || ''}`;

  // Add this effect to update totalGuests whenever guests state changes
  React.useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  // Add click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen &&
        containerRef.current &&
        popoverRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveContent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format the dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    // Automatically switch to date selector after location is selected
    setActiveContent('date');

    // Update arrow position for the date input
    if (containerRef.current && moveInInputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = moveInInputRef.current.getBoundingClientRect();
      const inputLeft = inputRect.left;
      const inputCenter = inputLeft + (inputRect.width / 2);
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
    }
  };

  // Add new state to track the arrow position
  const [arrowPosition, setArrowPosition] = React.useState(5); // Default left position in rem

  // Add refs for each input
  const locationInputRef = useRef<HTMLInputElement>(null);
  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);

  const handleProceed = () => {
    setActiveContent('guests');

    // Update arrow position for guests input
    if (containerRef.current && guestsInputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = guestsInputRef.current.getBoundingClientRect();
      const inputLeft = inputRect.left;
      const inputCenter = inputLeft + (inputRect.width / 2);
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
    }
  };

  // Add this function to render content based on active type
  const renderActiveContent = () => {
    switch (activeContent) {
      case 'location':
        return <HeroLocationSuggest hasAccess={hasAccess} onLocationSelect={handleLocationSelect} setDisplayValue={setLocationDisplayValue} />;
      case 'date':
        return (
          <DesktopDateRange
            start={dateRange.start || null}
            end={dateRange.end || null}
            handleChange={(start, end) => setDateRange({ start, end })}
            onProceed={handleProceed}
            onClear={() => setDateRange({ start: null, end: null })}
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

    if (containerRef.current && inputRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const inputRect = inputRef.current.getBoundingClientRect();
      const inputLeft = inputRect.left;
      const inputCenter = inputLeft + (inputRect.width / 2);
      const position = ((inputCenter - containerLeft) / containerRef.current.offsetWidth) * 100;
      setArrowPosition(position);
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
      router.push(`/platform/searches/set-preferences/${response.trip.id}`);
    } else {
      toast({
        variant: "destructive",
        description: response.success === false ? response.error : "Failed to create trip",
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
      {headerText && <h3 className="hidden text-xl font-semibold mb-3 text-green-800 text-center">{headerText}</h3>}
      <div
        className={cn('flex flex-row no-wrap px-3 py-2 items-center bg-background rounded-full shadow-md overflow-hidden', className)}
      >
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Where</label>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="Chooose Location"
            value={locationDisplayValue}
            className={inputClasses}
            readOnly
            onClick={(e) => handleInputClick(e, 'location', locationInputRef)}
          />
        </div>

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move In</label>
          <input
            ref={moveInInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.start)}
            className={inputClasses}
            readOnly={!hasAccess}
            onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
          />
        </div>

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Move Out</label>
          <input
            ref={moveOutInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.end)}
            className={inputClasses}
            readOnly={!hasAccess}
            onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600">Who</label>
          <input
            ref={guestsInputRef}
            type="text"
            placeholder="Add guests"
            value={hasBeenSelected ? `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}` : ''}
            className={`${inputClasses}`}
            readOnly={!hasAccess}
            onClick={(e) => {
              setHasBeenSelected(true);
              handleInputClick(e, 'guests', guestsInputRef)
            }
            }
          />
        </div>

        <div className="flex-shrink-0 self-end">
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
              } ${searchButtonClassNames || 'bg-primaryBrand'} rounded-full`}
          >
            {locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng) ? (
              <ImSpinner8 className={`${searchIconColor} mx-auto animate-spin`} size={20} />
            ) : (
              <FaSearch className={`${searchIconColor} mx-auto`} size={20} />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div ref={popoverRef}
          className={`absolute top-[calc(100%+8px)] ${popoverMaxWidth ? 'left-1/2 transform -translate-x-1/2' : 'left-0'} w-full bg-background rounded-xl shadow-lg z-50
          before:content-[''] before:absolute before:-top-2 ${popoverMaxWidth ? 'before:left-1/2 before:-translate-x-1/2' : 'before:left-[var(--arrow-position)]'} before:w-4 before:h-4
          before:bg-background before:rotate-45 before:border-l before:border-t before:border-gray-200
          origin-top`}
          style={{
            ...(!popoverMaxWidth ? { '--arrow-position': `${arrowPosition}%` } : {}),
            ...(popoverMaxWidth ? { maxWidth: popoverMaxWidth } : {}),
            animation: 'popoverFadeIn 0.2s ease-out'
          } as React.CSSProperties}>
          <style jsx>{`
            @keyframes popoverFadeIn {
              from {
                opacity: 0;
                transform: ${popoverMaxWidth ? 'translate(-50%, -8px)' : 'translateY(-8px)'};
              }
              to {
                opacity: 1;
                transform: ${popoverMaxWidth ? 'translate(-50%, 0)' : 'translateY(0)'};
              }
            }
          `}</style>
          {renderActiveContent()}
        </div>
      )}
    </div>
  );
};

export default SearchInputsDesktop;


