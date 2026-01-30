'use client'
import React, { useState, useTransition, useEffect } from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/ui/brandButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { applyToListingFromSearch } from '@/app/actions/housing-requests';
import { getOrCreateListingConversation } from '@/app/actions/housing-requests';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import SearchDateRange from '@/components/newnew/search-date-range';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';

interface PublicListingDetailsBoxProps {
  listing: ListingAndImages;
  isAuthenticated?: boolean;
  tripContext?: {
    tripId?: string;
    startDate: Date;
    endDate: Date;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  } | null;
  calculatedPrice?: number | null;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
  onApplyClick?: () => void;
  showDatePopover?: boolean;
  onDatePopoverChange?: (open: boolean) => void;
  onDatesSelected?: (start: Date, end: Date, guests: { adults: number; children: number; pets: number }) => void;
}

const PublicListingDetailsBox: React.FC<PublicListingDetailsBoxProps> = ({
  listing,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
  onApplyClick,
  showDatePopover = false,
  onDatePopoverChange,
  onDatesSelected,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(listingState?.hasApplied ?? false);
  const [isMatched, setIsMatched] = useState(listingState?.isMatched ?? false);
  const [error, setError] = useState<string | null>(null);

  const [popoverStart, setPopoverStart] = useState<Date | null>(null);
  const [popoverEnd, setPopoverEnd] = useState<Date | null>(null);
  const [popoverStep, setPopoverStep] = useState<'dates' | 'who'>('dates');
  const [guests, setGuests] = useState({
    adults: tripContext?.numAdults ?? 0,
    children: tripContext?.numChildren ?? 0,
    pets: tripContext?.numPets ?? 0,
  });
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const host = listing.user;

  const handleApplyClick = () => {
    if (onApplyClick) {
      onApplyClick();
      return;
    }
    handleApplyNow();
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setPopoverStart(start);
    setPopoverEnd(end);
  };

  const handlePopoverContinue = () => {
    if (popoverStep === 'dates' && popoverStart && popoverEnd) {
      setPopoverStep('who');
    } else if (popoverStep === 'who' && onDatesSelected) {
      // Use tripContext dates if available, otherwise use popover dates
      const startDate = tripContext?.startDate || popoverStart;
      const endDate = tripContext?.endDate || popoverEnd;
      if (startDate && endDate) {
        onDatesSelected(startDate, endDate, guests);
      }
    }
  };

  const handlePopoverBack = () => {
    if (popoverStep === 'who') {
      setPopoverStep('dates');
    }
  };

  const hasDates = !!(tripContext?.startDate && tripContext?.endDate);
  const hasRenterInfo = (tripContext?.numAdults ?? 0) > 0;
  const displayStart = tripContext?.startDate || popoverStart;
  const displayEnd = tripContext?.endDate || popoverEnd;
  const displayGuests = hasRenterInfo
    ? { adults: tripContext!.numAdults!, children: tripContext!.numChildren ?? 0, pets: tripContext!.numPets ?? 0 }
    : guests;

  // Determine initial popover step based on what data is missing
  const getInitialPopoverStep = (): 'dates' | 'who' => {
    if (!hasDates) return 'dates';
    if (!hasRenterInfo) return 'who';
    return 'dates'; // fallback
  };
  const totalRenters = displayGuests.adults + displayGuests.children;

  const getPriceRange = () => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      return { min: listing.price || 0, max: listing.price || 0, hasRange: false };
    }

    const prices = listing.monthlyPricing.map(pricing => pricing.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      min: minPrice,
      max: maxPrice,
      hasRange: minPrice !== maxPrice
    };
  };

  const priceRange = getPriceRange();

  const handleGetStarted = () => {
    const redirectPath = window.location.pathname + window.location.search;
    window.location.href = '/sign-up?redirect=' + encodeURIComponent(redirectPath);
  };

  const handleApplyNow = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyToListingFromSearch(listing.id, {
        tripId: tripContext?.tripId,
        startDate: tripContext?.startDate,
        endDate: tripContext?.endDate,
      });

      if (result.success) {
        setHasApplied(true);
        // Optionally navigate to the trip page
        // router.push(`/app/rent/searches/${result.tripId}`);
      } else {
        setError(result.error || 'Failed to apply');
      }
    });
  };

  const handleMessageHost = () => {
    if (!host?.id) return;

    startTransition(async () => {
      const result = await getOrCreateListingConversation(listing.id, host.id);
      if (result.success && result.conversationId) {
        router.push(`/app/messages?conversationId=${result.conversationId}`);
      }
    });
  };

  const getApplyButtonText = () => {
    if (isMatched) return 'Matched';
    if (hasApplied) return 'Applied';
    return 'Apply Now';
  };

  const isApplyButtonDisabled = hasApplied || isMatched || isPending;

  return (
    <Card className="w-full border border-[#0000001a] rounded-xl">
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage
              src={host?.imageUrl || ''}
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-[#3c8787] text-white font-medium text-xl">
              {((host?.firstName?.charAt(0) || '') + (host?.lastName?.charAt(0) || '')) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm font-['Poppins']">
              Hosted by {host?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="font-normal text-[#717680] text-sm font-['Poppins']">
                {listing?.averageRating
                  ? `${listing.averageRating.toFixed(1)} (${listing?.numberOfStays || 0})`
                  : <span className="italic">No reviews yet</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
        >
          <Image
            src="/svg/verified-badge.svg"
            alt="Verified"
            width={16}
            height={16}
          />
          <span className="font-normal text-xs text-[#717680] font-['Poppins']">
            Verified
          </span>
        </Badge>

        <Separator className="w-full" />

        {/* Pricing information */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
              {calculatedPrice
                ? `$${calculatedPrice.toLocaleString()}`
                : priceRange.hasRange
                  ? `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}`
                  : `$${priceRange.min.toLocaleString()}`
              }
            </div>
            <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Month</div>
          </div>

          {listing.depositSize && (
            <div className="flex flex-col gap-1 items-end">
              <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
                ${listing.depositSize?.toLocaleString()}
              </div>
              <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Deposit</div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm font-['Poppins']">
            {error}
          </div>
        )}

        {/* CTA Buttons */}
        {!isAuthenticated ? (
          // Not signed in: Show "Get Started" button
          <BrandButton
            variant="outline"
            className="w-full min-w-0 mt-1 border-[#3c8787] text-[#3c8787] font-semibold hover:bg-[#3c8787] hover:text-white transition-colors"
            onClick={handleGetStarted}
          >
            Get Started
          </BrandButton>
        ) : (
          // Signed in
          <div className="flex flex-col gap-2 w-full mt-1">
            {/* Show Apply button when dates AND renter info are filled, otherwise show popover */}
            {hasDates && hasRenterInfo ? (
              <BrandButton
                variant={hasApplied || isMatched ? "secondary" : "outline"}
                className={`w-full min-w-0 font-semibold transition-colors ${
                  hasApplied || isMatched
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white'
                }`}
                onClick={handleApplyClick}
                disabled={isApplyButtonDisabled}
              >
                {isPending ? 'Applying...' : getApplyButtonText()}
              </BrandButton>
            ) : onApplyClick ? (
              <Popover open={showDatePopover} onOpenChange={(open) => {
                if (open) {
                  setPopoverStep(getInitialPopoverStep());
                }
                onDatePopoverChange?.(open);
              }}>
                <PopoverTrigger asChild>
                  <div className="w-full border border-gray-300 rounded-xl cursor-pointer hover:border-[#3c8787] transition-colors">
                    <div className="flex divide-x divide-gray-300">
                      <div className="flex-1 px-4 py-3">
                        <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-In</div>
                        <div className={`text-sm font-['Poppins'] ${displayStart ? 'text-[#373940]' : 'text-gray-400'}`}>
                          {displayStart ? format(displayStart, 'MMM d, yyyy') : 'Add Date'}
                        </div>
                      </div>
                      <div className="flex-1 px-4 py-3">
                        <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-Out</div>
                        <div className={`text-sm font-['Poppins'] ${displayEnd ? 'text-[#373940]' : 'text-gray-400'}`}>
                          {displayEnd ? format(displayEnd, 'MMM d, yyyy') : 'Add Date'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300">
                      <div>
                        <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Renters</div>
                        <div className={`text-sm font-['Poppins'] ${totalRenters > 0 ? 'text-[#373940]' : 'text-gray-400'}`}>
                          {totalRenters === 0 && displayGuests.pets === 0
                            ? 'Add Renters'
                            : `${totalRenters} renter${totalRenters !== 1 ? 's' : ''}${displayGuests.pets > 0 ? `, ${displayGuests.pets} pet${displayGuests.pets !== 1 ? 's' : ''}` : ''}`}
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-4 shadow-xl"
                  side="bottom"
                  align="start"
                  alignOffset={popoverStep === 'dates' ? (isLargeScreen ? -450 : -150) : -50}
                  sideOffset={-100}
                >
                  <div className="flex flex-col gap-3">
                    {popoverStep === 'dates' ? (
                      <SearchDateRange
                        start={popoverStart}
                        end={popoverEnd}
                        handleChange={handleDateChange}
                        minimumDateRange={{ months: 1 }}
                        singleMonth={!isLargeScreen}
                        hideFlexibility
                      />
                    ) : (
                      <div className="min-w-[280px]">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Only show back button if dates were entered via popover (not from tripContext) */}
                          {!hasDates && (
                            <button
                              onClick={handlePopoverBack}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                          )}
                          <h3 className="font-semibold text-[#373940] font-['Poppins']">Who&apos;s coming?</h3>
                        </div>
                        <GuestTypeCounter guests={guests} setGuests={setGuests} />
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (popoverStep === 'dates') {
                            setPopoverStart(null);
                            setPopoverEnd(null);
                          } else {
                            setGuests({ adults: 0, children: 0, pets: 0 });
                          }
                        }}
                        className="text-sm font-medium text-[#2A7F7A] hover:text-[#236663] underline"
                      >
                        {popoverStep === 'dates' ? 'Clear dates' : 'Clear'}
                      </button>
                      <Button
                        onClick={handlePopoverContinue}
                        disabled={
                          (popoverStep === 'dates' && (!popoverStart || !popoverEnd)) ||
                          (popoverStep === 'who' && guests.adults < 1)
                        }
                        className="px-6 bg-[#2A7F7A] hover:bg-[#236663] text-white font-medium rounded-lg"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <BrandButton
                variant={hasApplied || isMatched ? "secondary" : "outline"}
                className={`w-full min-w-0 font-semibold transition-colors ${
                  hasApplied || isMatched
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white'
                }`}
                onClick={handleApplyClick}
                disabled={isApplyButtonDisabled}
              >
                {isPending ? 'Applying...' : getApplyButtonText()}
              </BrandButton>
            )}

            <BrandButton
              variant="ghost"
              className="w-full min-w-0 text-[#3c8787] font-medium hover:bg-[#3c8787]/10"
              onClick={handleMessageHost}
              disabled={isPending}
            >
              Message Host
            </BrandButton>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default PublicListingDetailsBox;
