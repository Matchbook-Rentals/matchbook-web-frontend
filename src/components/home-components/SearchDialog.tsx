'use client';

import React, { useState, useEffect } from "react";
import { BrandDialog } from "@/components/brandDialog";
import { BrandButton } from "@/components/ui/brandButton";
import { Input } from "@/components/ui/input";
import { ImSpinner8 } from "react-icons/im";
import { DesktopDateRange } from "@/components/ui/custom-calendar/date-range-selector/desktop-date-range";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import GuestTypeCounter from "./GuestTypeCounter";
import HeroLocationSuggest from "./HeroLocationSuggest";
import MobileLocationSuggest from "./MobileLocationSuggest";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createTrip } from "@/app/actions/trips";
import { createGuestTrip } from "@/app/actions/guest-trips";
import { GuestSessionService } from "@/utils/guest-session";
import { useRouter } from "next/navigation";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useAuth } from "@clerk/nextjs";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasAccess: boolean;
  headerText?: string;
}

type ActiveContentType = 'location' | 'date' | 'guests' | null;

const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onOpenChange,
  hasAccess,
  headerText = 'Find your next home'
}) => {
  const [activeContent, setActiveContent] = useState<ActiveContentType>(null);
  const [totalGuests, setTotalGuests] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [guests, setGuests] = useState({ pets: 0, children: 0, adults: 1 });
  const [selectedLocation, setSelectedLocation] = useState({
    destination: '',
    description: '',
    lat: null,
    lng: null
  });
  const [locationDisplayValue, setLocationDisplayValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { width } = useWindowSize();
  const { isSignedIn } = useAuth();

  // Check if we're on mobile or tablet
  const isMobile = width ? width < 640 : false;
  const isTablet = width ? width >= 640 && width < 1200 : false;

  // Update totalGuests whenever guests state changes
  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  // Reset active content when dialog opens
  useEffect(() => {
    if (isOpen && !activeContent) {
      setActiveContent('location');
    }
  }, [isOpen, activeContent]);

  // Close dialog when switching between mobile/desktop
  useEffect(() => {
    if (isOpen) {
      onOpenChange(false);
    }
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatFooterDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setActiveContent('date');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedLocation?.lat || !selectedLocation?.lng || !selectedLocation?.description) {
      setActiveContent('location');
      toast({
        variant: "destructive",
        description: `No lat/lng found for destination`,
      });
      return;
    }

    setIsSubmitting(true);

    const tripData = {
      locationString: selectedLocation?.description || '',
      latitude: selectedLocation?.lat || 0,
      longitude: selectedLocation?.lng || 0,
      startDate: dateRange.start,
      endDate: dateRange.end,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
    };

    try {
      if (isSignedIn) {
        // Authenticated user - use existing flow
        const response = await createTrip(tripData);

        if (response.success && response.trip) {
          router.push(`/app/rent/searches/${response.trip.id}`);
        } else {
          toast({
            variant: "destructive",
            description: response.success === false ? response.error : "Failed to create trip",
          });
        }
      } else {
        // Unauthenticated user - use guest flow
        const response = await createGuestTrip(tripData);

        if (response.success && response.sessionId) {
          // Store session data client-side
          const sessionData = GuestSessionService.createGuestSessionData(tripData, response.sessionId);
          const stored = GuestSessionService.storeSession(sessionData);

          if (!stored) {
            toast({
              variant: "destructive",
              description: "Failed to store search data. Please try again.",
            });
            return;
          }

          // Close dialog and redirect to guest search page
          onOpenChange(false);
          router.push(response.redirectUrl!);
        } else {
          toast({
            variant: "destructive",
            description: response.error || "Failed to create search",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "An unexpected error occurred while creating the search.",
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
    onOpenChange(false);
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
        return headerText;
    }
  };

  const renderFooter = () => {
    const isFirstStep = activeContent === 'location';
    const isLastStep = activeContent === 'guests';
    const isDateStep = activeContent === 'date';
    const areDatesSelected = dateRange.start || dateRange.end;

    if (isDateStep) {
      return (
        <div className={cn(
          "flex gap-4 w-full",
          isMobile ? "flex-col items-start p-4 border-t border-[#eaecf0]" : "justify-between flex-wrap"
        )}>
          {/* Date boxes - only show on desktop (not mobile or tablet) */}
          {!isMobile && !isTablet && (
            <div className={cn(
              "flex items-center gap-3"
            )}>
              <div
                className={cn(
                  "w-[136px] bg-background border border-input rounded-md px-3 py-2 text-sm h-10"
                )}
              >
                {formatFooterDate(dateRange.start) || "Start Date"}
              </div>
              <span className={cn(
                "text-gray-600"
              )}>
                –
              </span>
              <div
                className={cn(
                  "w-[136px] bg-background border border-input rounded-md px-3 py-2 text-sm h-10"
                )}
              >
                {formatFooterDate(dateRange.end) || "End Date"}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={cn(
            "flex items-center gap-3",
            isMobile || isTablet ? "w-full justify-between" : ""
          )}>
            <BrandButton
              variant="outline"
              className={isMobile ? "px-4 py-2.5 h-10 rounded-md border border-solid border-[#d0d5dd] text-[#384250]" : ""}
              onClick={areDatesSelected ? () => setDateRange({ start: null, end: null }) : handleBack}
              size="sm"
            >
              {areDatesSelected ? 'Clear' : 'Back'}
            </BrandButton>
            <BrandButton
              className={isMobile ? "px-4 py-2.5 h-10 rounded-md bg-[#0b6969] text-white" : ""}
              onClick={handleNext}
              size="sm"
            >
              Next
            </BrandButton>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center w-full">
        <BrandButton variant="outline" onClick={isFirstStep ? handleClose : handleBack} size="sm">
          {isFirstStep ? 'Close' : 'Back'}
        </BrandButton>

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
    );
  };

  // Create content components for the carousel
  const locationContent = (
    <div className={cn(isMobile ? "h-auto w-full overflow-x-hidden overflow-y-auto" : "")}>
      {selectedLocation?.description && (
        <div className="mb-4 text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg relative">
          {isMobile && (
            <button
              onClick={() => {
                setSelectedLocation({
                  destination: '',
                  description: '',
                  lat: null,
                  lng: null
                });
                setLocationDisplayValue('');
              }}
              className="absolute top-2 right-2 w-6 h-6 text-red-500 flex items-center justify-center text-lg hover:text-red-600"
            >
              ✕
            </button>
          )}
          <p className="font-semibold text-gray-800">Selected Location:</p>
          <p className={cn("text-gray-600", isMobile ? "pr-8" : "")}>{selectedLocation.description}</p>
        </div>
      )}
      {isMobile ? (
        <MobileLocationSuggest 
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          setLocationDisplayValue={setLocationDisplayValue}
        />
      ) : (
        <HeroLocationSuggest
          hasAccess={hasAccess}
          onLocationSelect={handleLocationSelect}
          setDisplayValue={setLocationDisplayValue}
          placeholder={
            selectedLocation?.description
              ? "Wrong place? Begin typing and select another"
              : "Enter an address or city"
          }
        />
      )}
    </div>
  );

  const dateContent = (
    <div className="h-auto w-full overflow-x-hidden">
      {isMobile ? (
        <MobileDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClose={() => setActiveContent(null)}
          onProceed={() => setActiveContent('guests')}
          minimumDateRange={{ months: 1 }}
          maximumDateRange={{ months: 12 }}
        />
      ) : (
        <DesktopDateRange
          start={dateRange.start || null}
          end={dateRange.end || null}
          handleChange={(start, end) => setDateRange({ start, end })}
          minimumDateRange={{ months: 1 }}
          maximumDateRange={{ months: 12 }}
        />
      )}
    </div>
  );

  const guestsContent = (
    <div className={cn(isMobile ? "h-auto w-full overflow-x-hidden overflow-y-auto" : "")}>
      <GuestTypeCounter guests={guests} setGuests={setGuests} />
    </div>
  );

  const carouselContent = [locationContent, dateContent, guestsContent];
  const currentStep = activeContent === 'location' ? 1 : activeContent === 'date' ? 2 : 3;

  return (
    <BrandDialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
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
  );
};

export default SearchDialog;
