'use client'
import React, { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star as StarIcon, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerifiedIcon } from '@/components/icons-v3';
import { ListingAndImages } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import SearchDateRange from '@/components/newnew/search-date-range';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { BrandButton } from '@/components/ui/brandButton';
import GuestAuthModal from '@/components/guest-auth-modal';
import { useRouter } from 'next/navigation';
import { applyToListingFromSearch, getOrCreateListingConversation } from '@/app/actions/housing-requests';

interface HostInformationProps {
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
  onDatesSelected?: (start: Date, end: Date, guests: { adults: number; children: number; pets: number }) => void;
}

const HostInformation: React.FC<HostInformationProps> = ({
  listing,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
  onApplyClick,
  onDatesSelected,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(listingState?.hasApplied ?? false);
  const [isMatched, setIsMatched] = useState(listingState?.isMatched ?? false);
  const [error, setError] = useState<string | null>(null);

  const [popoverStart, setPopoverStart] = useState<Date | null>(tripContext?.startDate ?? null);
  const [popoverEnd, setPopoverEnd] = useState<Date | null>(tripContext?.endDate ?? null);
  const [showDatesPopover, setShowDatesPopover] = useState(false);
  const [showRentersPopover, setShowRentersPopover] = useState(false);
  const [guests, setGuests] = useState({
    adults: tripContext?.numAdults ?? 0,
    children: tripContext?.numChildren ?? 0,
    pets: tripContext?.numPets ?? 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const host = listing.user;

  const handleApplyClick = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (onApplyClick) {
      if (onDatesSelected && popoverStart && popoverEnd) {
        onDatesSelected(popoverStart, popoverEnd, guests);
      }
      onApplyClick();
      return;
    }
    handleApplyNow();
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setPopoverStart(start);
    setPopoverEnd(end);
  };

  const handleDatesConfirm = () => { setShowDatesPopover(false); handleRentersOpen(true); };
  const handleRentersOpen = (open: boolean) => {
    setShowRentersPopover(open);
    if (open && guests.adults === 0) {
      setGuests(prev => ({ ...prev, adults: 1 }));
    }
  };
  const handleRentersConfirm = () => setShowRentersPopover(false);
  const handleClearDates = () => { setPopoverStart(null); setPopoverEnd(null); };
  const handleClearRenters = () => setGuests({ adults: 0, children: 0, pets: 0 });

  const hasDates = !!(popoverStart && popoverEnd);
  const hasRenterInfo = guests.adults > 0;
  const totalRenters = guests.adults + guests.children;

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
      } else {
        setError(result.error || 'Failed to apply');
      }
    });
  };

  const handleMessageHost = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
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
    <Card className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
      <CardContent className="flex flex-col items-start gap-5 py-4 px-0">
        {/* Trip details: dates + renters + apply */}
        <div className="flex flex-col gap-2 w-full">
          <div className="w-full border border-gray-300 rounded-xl">
            {/* Dates Section */}
            <Popover open={showDatesPopover} onOpenChange={setShowDatesPopover}>
              <PopoverTrigger asChild>
                <div className="flex divide-x divide-gray-300 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl">
                  <div className="flex-1 px-4 py-3">
                    <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-In</div>
                    <div className={`text-sm font-['Poppins'] ${popoverStart ? 'text-[#373940]' : 'text-gray-400'}`}>
                      {popoverStart ? format(popoverStart, 'MMM d, yyyy') : 'Add Date'}
                    </div>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-Out</div>
                    <div className={`text-sm font-['Poppins'] ${popoverEnd ? 'text-[#373940]' : 'text-gray-400'}`}>
                      {popoverEnd ? format(popoverEnd, 'MMM d, yyyy') : 'Add Date'}
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-4 shadow-xl"
                side="bottom"
                align="center"
                sideOffset={4}
              >
                <div className="flex flex-col gap-3">
                  <SearchDateRange
                    start={popoverStart}
                    end={popoverEnd}
                    handleChange={handleDateChange}
                    minimumDateRange={{ months: 1 }}
                    singleMonth
                    hideFlexibility
                  />
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 mt-2">
                    <button
                      type="button"
                      onClick={handleClearDates}
                      className="text-sm font-medium text-[#2A7F7A] hover:text-[#236663] underline"
                    >
                      Clear dates
                    </button>
                    <Button
                      onClick={handleDatesConfirm}
                      disabled={!popoverStart || !popoverEnd}
                      className="px-6 bg-[#2A7F7A] hover:bg-[#236663] text-white font-medium rounded-lg"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Renters Section */}
            <Popover open={showRentersPopover} onOpenChange={handleRentersOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors rounded-b-xl">
                  <div>
                    <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Renters</div>
                    <div className={`text-sm font-['Poppins'] ${totalRenters > 0 ? 'text-[#373940]' : 'text-gray-400'}`}>
                      {totalRenters === 0 && guests.pets === 0
                        ? 'Add Renters'
                        : `${totalRenters} renter${totalRenters !== 1 ? 's' : ''}${guests.pets > 0 ? `, ${guests.pets} pet${guests.pets !== 1 ? 's' : ''}` : ''}`}
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-4 shadow-xl"
                side="bottom"
                align="center"
                sideOffset={4}
              >
                <div className="flex flex-col gap-3">
                  <div className="min-w-[280px]">
                    <h3 className="font-semibold text-[#373940] font-['Poppins'] mb-2">Who&apos;s coming?</h3>
                    <GuestTypeCounter guests={guests} setGuests={setGuests} />
                  </div>
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 mt-2">
                    <button
                      type="button"
                      onClick={handleClearRenters}
                      className="text-sm font-medium text-[#2A7F7A] hover:text-[#236663] underline"
                    >
                      Clear
                    </button>
                    <Button
                      onClick={handleRentersConfirm}
                      disabled={guests.adults < 1}
                      className="px-6 bg-[#2A7F7A] hover:bg-[#236663] text-white font-medium rounded-lg"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Apply button - visible when both dates and renters are filled */}
          {hasDates && hasRenterInfo && (
            <BrandButton
              variant={hasApplied || isMatched ? "secondary" : "default"}
              className={`w-full min-w-0 font-semibold transition-colors ${
                hasApplied || isMatched
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : ''
              }`}
              onClick={handleApplyClick}
              disabled={isApplyButtonDisabled}
            >
              {isPending ? 'Applying...' : getApplyButtonText()}
            </BrandButton>
          )}

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm font-['Poppins']">
              {error}
            </div>
          )}
        </div>

        {/* Verified badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
        >
          <VerifiedIcon className="w-[21px] h-[21px]" />
          <span className="font-normal text-xs text-[#0B6E6E] font-['Poppins'] leading-normal">
            Verified Host
          </span>
        </Badge>

        {/* Host information */}
        <div className="flex items-center gap-3 w-full pb-6">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage
              src={host?.imageUrl || ''}
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
              {(host?.firstName?.charAt(0) + host?.lastName?.charAt(0)) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm">
              Hosted by {host?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
              <span className="text-[#717680] text-sm">
                Be {host?.firstName || 'Host'}&apos;s first booking
              </span>
            </div>
          </div>
        </div>

        <BrandButton
          variant="outline"
          size="lg"
          className="w-full min-w-0 text-[#3c8787] font-medium"
          onClick={handleMessageHost}
          disabled={isPending}
        >
          Message Host
        </BrandButton>

        <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
      </CardContent>
    </Card>
  );
};

export default HostInformation;
