'use client';

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandDialog } from "@/components/brandDialog";
import { BrandButton } from "@/components/ui/brandButton";
import { Input } from "@/components/ui/input";
import { ImSpinner8 } from "react-icons/im";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import GuestTypeCounter from "./GuestTypeCounter";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createTrip } from "@/app/actions/trips";
import { ScrollArea } from "@/components/ui/scroll-area";
import MobileLocationSuggest from "./MobileLocationSuggest";

interface MobileSearchTriggerProps {
  hasAccess: boolean;
  onTrigger: () => void;
}

type ActiveContentType = 'location' | 'date' | 'guests' | null;

const MobileSearchTrigger: React.FC<MobileSearchTriggerProps> = ({ 
  hasAccess, 
  onTrigger 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeContent, setActiveContent] = useState<ActiveContentType>(null);
  const [hasBeenSelected, setHasBeenSelected] = useState(false);
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
  
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    if (hasAccess) {
      setIsOpen(true);
      setActiveContent('location');
    }
  };

  // Add this effect to update totalGuests whenever guests state changes
  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

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

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedLocation?.lat || !selectedLocation?.lng || !selectedLocation?.description) {
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
        locationString: selectedLocation?.description || '',
        latitude: selectedLocation?.lat || 0,
        longitude: selectedLocation?.lng || 0,
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

    if (isDateStep) {
      return (
        <div className="flex flex-col items-start gap-3 p-4 relative w-full border-t border-[#eaecf0]">
          <div className="flex justify-between items-center w-full max-w-80">
            <div className="flex flex-col w-[136px] items-start gap-1.5 relative">
              <Input
                className="h-10 border border-solid border-[#d0d5dd] rounded-md px-3 py-2.5"
                value={formatFooterDate(dateRange.start)}
                placeholder="Start Date"
                readOnly
              />
            </div>
            <div className="font-text-md-regular text-[#667085] w-fit whitespace-nowrap">
              –
            </div>
            <div className="flex flex-col w-[136px] items-start gap-1.5 relative">
              <Input
                className="h-10 border border-solid border-[#d0d5dd] rounded-md px-3 py-2.5"
                value={formatFooterDate(dateRange.end)}
                placeholder="End Date"
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-between items-center w-full">
            <BrandButton
              variant="outline"
              className="px-4 py-2.5 h-10 rounded-md border border-solid border-[#d0d5dd] text-[#384250]"
              onClick={areDatesSelected ? () => setDateRange({ start: null, end: null }) : handleBack}
              size="sm"
            >
              {areDatesSelected ? 'Clear' : 'Back'}
            </BrandButton>
            <BrandButton
              className="px-4 py-2.5 h-10 rounded-md bg-[#0b6969] text-white"
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

  // Create all content components for the carousel
  const locationContent = (
    <div className="h-auto w-full overflow-y-auto">
      {selectedLocation?.description && (
        <div className="mb-4 text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg relative">
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
          <p className="font-semibold text-gray-800">Selected Location:</p>
          <p className="text-gray-600 pr-8">{selectedLocation.description}</p>
        </div>
      )}
      <MobileLocationSuggest 
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        setLocationDisplayValue={setLocationDisplayValue}
      />
    </div>
  );

  const dateContent = (
    <div className="h-auto max-h-[50vh] w-full overflow-y-auto">
      <MobileDateRange
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClose={() => setActiveContent(null)}
        onProceed={() => setActiveContent('guests')}
        minimumDateRange={{ months: 1 }}
        maximumDateRange={{ months: 12 }}
      />
    </div>
  );

  const guestsContent = (
    <div className="h-auto w-full overflow-y-auto">
      <GuestTypeCounter guests={guests} setGuests={setGuests} />
    </div>
  );

  const carouselContent = [locationContent, dateContent, guestsContent];
  const currentStep = activeContent === 'location' ? 1 : activeContent === 'date' ? 2 : 3;

  return (
    <div className="block sm:hidden pt-6 w-full z-10 flex justify-center">
      <div className="relative">
        <Card className="w-[397px] rounded-xl overflow-hidden cursor-pointer" onClick={handleClick}>
          <CardContent className="p-3 flex flex-col gap-2">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex flex-col gap-4 w-full">
                {/* Where field */}
                <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                  <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal cursor-pointer">
                    Where
                  </label>
                  <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                    Choose Location
                  </span>
                </div>

                {/* Move in/out date fields */}
                <div className="flex items-center gap-5 w-full">
                  {/* Move in field */}
                  <div className="flex flex-col flex-1 pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                      Move in
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                      Select Dates
                    </span>
                  </div>

                  {/* Move out field */}
                  <div className="flex flex-col flex-1 pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                      Move out
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                      Select Dates
                    </span>
                  </div>
                </div>

                {/* Who field */}
                <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da] cursor-pointer" onClick={handleClick}>
                  <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px] cursor-pointer">
                    Who
                  </label>
                  <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal cursor-pointer">
                    Add Renters
                  </span>
                </div>
              </div>

              {/* Button */}
              <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white cursor-pointer" onClick={handleClick}>
                Start Search
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Gray overlay when no access */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-gray-200/80 rounded-xl cursor-not-allowed"></div>
        )}
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

export default MobileSearchTrigger;
