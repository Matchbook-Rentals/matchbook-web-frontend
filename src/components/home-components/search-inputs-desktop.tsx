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
import { BrandDialog } from "@/components/brandDialog";
import { BrandButton } from "@/components/ui/brandButton";
import { Input } from "@/components/ui/input";

interface SearchInputsDesktopProps {
  dateRangeContent?: React.ReactNode;
  guestsContent?: React.ReactNode;
  hasAccess: boolean;
  className?: string;
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  headerText?: string;
  headerClassName?: string;
}

// Add this type definition
type ActiveContentType = 'location' | 'date' | 'guests' | null;

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = ({
  hasAccess,
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white',
  headerText,
  headerClassName
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
  const [selectedLocation, setSelectedLocation] = React.useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [locationDisplayValue, setLocationDisplayValue] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const inputClasses = `w-full px-4 py-0 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-background ${inputClassName || ''}`;

  // Add this effect to update totalGuests whenever guests state changes
  React.useEffect(() => {
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
    if (currentStep === 1) {
      setActiveContent('date');
    } else if (currentStep === 2) {
      setActiveContent('guests');
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setActiveContent('location');
    } else if (currentStep === 3) {
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

  // Create all content components for the carousel
  const locationContent = (
    <>
      {selectedLocation.description && (
        <div className="mb-4 text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="font-semibold text-gray-800">Selected Location:</p>
          <p className="text-gray-600">{selectedLocation.description}</p>
        </div>
      )}
      <HeroLocationSuggest
        hasAccess={hasAccess}
        onLocationSelect={handleLocationSelect}
        setDisplayValue={setLocationDisplayValue}
        placeholder={
          selectedLocation.description
            ? "Wrong place? Begin typing and select another"
            : "Enter an address or city"
        }
      />
    </>
  );

  const dateContent = (
    <DesktopDateRange
      start={dateRange.start || null}
      end={dateRange.end || null}
      handleChange={(start, end) => setDateRange({ start, end })}
      minimumDateRange={{ months: 1 }}
      maximumDateRange={{ months: 12 }}
    />
  );

  const guestsContent = <GuestTypeCounter guests={guests} setGuests={setGuests} />;

  const carouselContent = [locationContent, dateContent, guestsContent];

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

  // Render different versions based on hasAccess
  if (!hasAccess) {
    return (
      <DisabledDesktopInputs />
    );
  }

  const currentStep = activeContent === 'location' ? 1 : activeContent === 'date' ? 2 : 3;

  return (
    <div ref={containerRef} className="relative">
      {headerText && <h3 className={cn("hidden text-xl font-semibold mb-3 text-green-800 text-center", headerClassName)}>{headerText}</h3>}
      <div
        className={cn('flex flex-row no-wrap px-3 py-2 items-center bg-background rounded-full shadow-md overflow-hidden', className)}
      >
        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
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

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}>Move In</label>
          <input
            ref={moveInInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.start)}
            className={inputClasses}
            readOnly // Always readOnly
            onClick={(e) => handleInputClick(e, 'date', moveInInputRef)}
          />
        </div>

        <div className="flex-1 flex flex-col sm:border-r border-gray-300">
          <label className="text-xs font-medium pl-4 pt-0.5 text-gray-600 cursor-pointer" onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}>Move Out</label>
          <input
            ref={moveOutInputRef}
            type="text"
            placeholder="Select dates"
            value={formatDate(dateRange.end)}
            className={inputClasses}
            readOnly // Always readOnly
            onClick={(e) => handleInputClick(e, 'date', moveOutInputRef)}
          />
        </div>

        <div className="flex-1 flex flex-col">
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
            readOnly // Always readOnly
            onClick={(e) => {
              setHasBeenSelected(true);
              handleInputClick(e, 'guests', guestsInputRef)
            }
            }
          />
        </div>

        <div className="flex-shrink-0 self-end">
          <button
            disabled={!hasAccess || isSubmitting}
            onClick={(e) => {
              e.stopPropagation();
              // Only run handleSubmit if we're not in a loading state
              if (!(locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng))) {
                handleSubmit();
              }
            }}
            className={cn(
              'w-auto p-3 rounded-full',
              searchButtonClassNames || 'bg-primaryBrand',
              !hasAccess || isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            )}
          >
            {isSubmitting || (locationDisplayValue && (!selectedLocation?.lat || !selectedLocation?.lng)) ? (
              <ImSpinner8 className={`animate-spin ${searchIconColor}`} />
            ) : (
              <FaSearch className={searchIconColor} />
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
        carouselContent={carouselContent}
        footerComponent={renderFooter()}
        currentStep={currentStep}
        totalSteps={3}
      />
    </div>
  );
};

export default SearchInputsDesktop;
