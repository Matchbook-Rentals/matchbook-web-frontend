'use client'
import React, { useState, useTransition, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star as StarIcon, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerifiedIcon } from '@/components/icons-v3';
import { ListingAndImages } from '@/types';
import { format } from 'date-fns';
import { BrandButton } from '@/components/ui/brandButton';
import GuestAuthModal from '@/components/guest-auth-modal';
import { useRouter } from 'next/navigation';
import { applyToListingFromSearch } from '@/app/actions/housing-requests';
import MobileAvailabilityOverlay from '@/components/newnew/mobile-availability-overlay';

type UnavailablePeriod = { startDate: Date; endDate: Date };

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
  requestOpenDates?: number;
  requestApply?: number;
  onMobileStateChange?: (state: { hasDates: boolean; startDate: Date | null; endDate: Date | null; guests: { adults: number; children: number; pets: number } }) => void;
}

const HostInformation: React.FC<HostInformationProps> = ({
  listing,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
  onApplyClick,
  onDatesSelected,
  requestOpenDates = 0,
  requestApply = 0,
  onMobileStateChange,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(listingState?.hasApplied ?? false);
  const [isMatched, setIsMatched] = useState(listingState?.isMatched ?? false);
  const [error, setError] = useState<string | null>(null);

  const [popoverStart, setPopoverStart] = useState<Date | null>(tripContext?.startDate ?? null);
  const [popoverEnd, setPopoverEnd] = useState<Date | null>(tripContext?.endDate ?? null);
  const [guests, setGuests] = useState({
    adults: tripContext?.numAdults ?? 0,
    children: tripContext?.numChildren ?? 0,
    pets: tripContext?.numPets ?? 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Report trip state to parent
  const hasDates = !!(popoverStart && popoverEnd);
  useEffect(() => {
    onMobileStateChange?.({ hasDates, startDate: popoverStart, endDate: popoverEnd, guests });
  }, [hasDates, popoverStart, popoverEnd, guests, onMobileStateChange]);

  // External trigger: open dates overlay on mobile
  useEffect(() => {
    if (requestOpenDates > 0) {
      setShowOverlay(true);
    }
  }, [requestOpenDates]);

  // External trigger: apply from footer
  useEffect(() => {
    if (requestApply > 0) {
      if (hasDates && guests.adults > 0) {
        handleApplyClick();
      } else {
        setShowOverlay(true);
      }
    }
  }, [requestApply]);

  const unavailablePeriods = useMemo<UnavailablePeriod[]>(() => {
    const periods: UnavailablePeriod[] = [];
    if (listing.unavailablePeriods) {
      for (const p of listing.unavailablePeriods) {
        periods.push({ startDate: new Date(p.startDate), endDate: new Date(p.endDate) });
      }
    }
    if (listing.bookings) {
      for (const b of listing.bookings) {
        if (b.startDate && b.endDate) {
          periods.push({ startDate: new Date(b.startDate), endDate: new Date(b.endDate) });
        }
      }
    }
    return periods;
  }, [listing.unavailablePeriods, listing.bookings]);

  const host = listing.user;

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      setAuthRedirectUrl(undefined);
      setShowAuthModal(true);
      return;
    }
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
    if (!isAuthenticated) {
      setAuthRedirectUrl(`/app/rent/messages?listingId=${listing.id}`);
      setShowAuthModal(true);
      return;
    }
    router.push(`/app/rent/messages?listingId=${listing.id}`);
  };

  const getApplyButtonText = () => {
    if (isMatched) return 'Matched';
    if (hasApplied) return 'Applied';
    return 'Apply Now';
  };

  const isApplyButtonDisabled = hasApplied || isMatched || isPending;

  return (
    <Card ref={cardRef} className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
      <CardContent className="flex flex-col items-start gap-5 py-4 px-0">
        {/* Trip summary — taps open the overlay */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={() => setShowOverlay(true)}
            className="w-full border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex divide-x divide-gray-300 rounded-t-xl">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 rounded-b-xl">
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
          </button>

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

        <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} redirectUrl={authRedirectUrl} />

        <MobileAvailabilityOverlay
          isOpen={showOverlay}
          onClose={() => setShowOverlay(false)}
          dateRange={{ start: popoverStart, end: popoverEnd }}
          onDateChange={handleDateChange}
          guests={guests}
          setGuests={setGuests}
          onConfirm={() => setShowOverlay(false)}
          unavailablePeriods={unavailablePeriods}
        />
      </CardContent>
    </Card>
  );
};

export default HostInformation;
