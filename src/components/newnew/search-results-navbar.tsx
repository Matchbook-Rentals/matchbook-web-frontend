'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import DesktopSearchPopover from '@/components/newnew/desktop-search-popover';

import MobileSearchOverlay from '@/components/newnew/mobile-search-overlay';
import { UpdatedFilterIcon } from '@/components/icons';
import { createTrip, editTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { updateGuestSession } from '@/app/actions/guest-session-db';
import { GuestSessionService } from '@/utils/guest-session';
import { buildSearchUrl } from '@/app/search/search-page-client';
import { useSearchBarPopovers } from '@/hooks/useSearchBarPopovers';
import { formatDateDisplay, formatGuestDisplay } from '@/lib/search-display-utils';

import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { ImSpinner8 } from 'react-icons/im';
import type { TripData } from '@/app/search/page';
import type { RecentSearch, SuggestedLocationItem } from './search-navbar';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface SearchResultsNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  hasListings?: boolean;
  locationString: string;
  tripId?: string;
  sessionId?: string;
  currentCenter?: { lat: number; lng: number };
  tripData?: TripData | null;
  onSearchUpdate?: (newTripId?: string, newSessionId?: string) => void;
  onSaveDates?: (start: Date | null, end: Date | null) => Promise<{ success: boolean; error?: string }>;
  onSaveGuests?: (adults: number, children: number, pets: number) => Promise<{ success: boolean; error?: string }>;
  onFiltersClick?: () => void;
  recentSearches?: RecentSearch[];
  suggestedLocations?: SuggestedLocationItem[];
}

const LOCATION_CHANGE_THRESHOLD = 0.001;

const hasLocationChanged = (
  selected: { lat: number; lng: number },
  current: { lat: number; lng: number }
): boolean => {
  return (
    Math.abs(selected.lat - current.lat) > LOCATION_CHANGE_THRESHOLD ||
    Math.abs(selected.lng - current.lng) > LOCATION_CHANGE_THRESHOLD
  );
};

export default function SearchResultsNavbar({
  userId,
  user,
  isSignedIn,
  hasListings: hasListingsProp,
  locationString,
  tripId,
  sessionId,
  currentCenter,
  tripData,
  onSearchUpdate,
  onSaveDates,
  onSaveGuests,
  onFiltersClick,
  recentSearches = [],
  suggestedLocations = [],
}: SearchResultsNavbarProps) {
  const hasListings = hasListingsProp;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [isSavingGuests, setIsSavingGuests] = useState(false);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

  // Track if we had dates when component mounted (for detecting "first time adding dates")
  const hadDatesInitially = useRef(Boolean(tripData?.startDate && tripData?.endDate));
  const initialDates = useRef({
    start: tripData?.startDate || null,
    end: tripData?.endDate || null,
  });
  const initialGuests = useRef({
    adults: tripData?.numAdults ?? 0,
    children: tripData?.numChildren ?? 0,
    pets: tripData?.numPets ?? 0,
  });

  const { isSignedIn: isClerkSignedIn } = useAuth();
  const { toast } = useToast();

  // Check if dates have changed from initial values
  const haveDatesChanged = (dates: { start: Date | null; end: Date | null }) => {
    const startChanged = dates.start?.toISOString() !== initialDates.current.start;
    const endChanged = dates.end?.toISOString() !== initialDates.current.end;
    return startChanged || endChanged;
  };

  // Check if guests have changed from initial values
  const haveGuestsChanged = (guestValues: { adults: number; children: number; pets: number }) => {
    return (
      guestValues.adults !== initialGuests.current.adults ||
      guestValues.children !== initialGuests.current.children ||
      guestValues.pets !== initialGuests.current.pets
    );
  };

  // Save dates on blur when the date popover closes
  const saveDatesOnBlur = async (overrideDates?: { start: Date | null; end: Date | null }) => {
    const dates = overrideDates ?? search.dateRange;
    if (!overrideDates && !haveDatesChanged(dates)) return;
    if (isSavingDates) return;

    const hasBothDates = dates.start && dates.end;
    const isClearingDates = !dates.start && !dates.end;

    if (!hasBothDates && !isClearingDates) return;
    if (isClearingDates && !hadDatesInitially.current) return;
    if (!onSaveDates) return;

    setIsSavingDates(true);

    try {
      const result = await onSaveDates(dates.start ?? null, dates.end ?? null);
      if (!result.success) {
        toast({ variant: 'destructive', description: result.error || 'Failed to save dates' });
        return;
      }

      initialDates.current = {
        start: dates.start?.toISOString() ?? null,
        end: dates.end?.toISOString() ?? null,
      };
      hadDatesInitially.current = hasBothDates ? true : false;
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save dates' });
    } finally {
      setIsSavingDates(false);
    }
  };

  // Save guests on blur when the guest popover closes
  const saveGuestsOnBlur = async () => {
    const guestValues = search.guests;
    if (!haveGuestsChanged(guestValues)) return;
    if (isSavingGuests) return;
    if (!onSaveGuests) return;

    setIsSavingGuests(true);

    try {
      const result = await onSaveGuests(guestValues.adults, guestValues.children, guestValues.pets);
      if (!result.success) {
        toast({ variant: 'destructive', description: result.error || 'Failed to save guests' });
        return;
      }

      initialGuests.current = { ...guestValues };
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save guests' });
    } finally {
      setIsSavingGuests(false);
    }
  };

  const search = useSearchBarPopovers({
    initialLocationDisplay: locationString,
    initialDates: {
      start: tripData?.startDate ? new Date(tripData.startDate) : null,
      end: tripData?.endDate ? new Date(tripData.endDate) : null,
    },
    initialGuests: {
      adults: tripData?.numAdults ?? 0,
      children: tripData?.numChildren ?? 0,
      pets: tripData?.numPets ?? 0,
    },
    onPopoverClosing: (closing) => {
      if (closing === 'when') saveDatesOnBlur();
      if (closing === 'who') saveGuestsOnBlur();
    },
    onDateAutoAdvance: (dates) => saveDatesOnBlur(dates),
    getOpenDelay: () => {
      if (!isExpanded) {
        setIsExpanded(true);
        return 152;
      }
      return 0;
    },
  });

  // Collapse bar back to header when no popover is active
  useEffect(() => {
    if (search.activePopover === null) {
      setIsExpanded(false);
    }
  }, [search.activePopover]);

  const handleWhereClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      e.stopPropagation();
      setIsMobileOverlayOpen(true);
      return;
    }
    search.togglePopover('where');
  };

  // TODO: handle rapid double-press — isSubmitting guard prevents duplicate calls,
  // but if the first call completes and navigation starts before the second press,
  // the user could trigger a second trip creation. Consider disabling the button
  // via ref or debouncing at the UI level.
  const handleSubmit = async () => {
    if (isSubmitting) return;
    search.closeAllPopovers();

    const submitLat = search.selectedLocation?.lat ?? currentCenter?.lat;
    const submitLng = search.selectedLocation?.lng ?? currentCenter?.lng;

    if (!submitLat || !submitLng) {
      search.setActivePopover('where');
      toast({ variant: 'destructive', description: 'Please select a location' });
      return;
    }

    setIsSubmitting(true);

    const locationChanged = search.selectedLocation && currentCenter
      ? hasLocationChanged(
          { lat: search.selectedLocation.lat!, lng: search.selectedLocation.lng! },
          currentCenter
        )
      : false;

    const hasExistingTrip = !!tripId || !!sessionId;
    const shouldUpdate = hasExistingTrip && !locationChanged;

    const tripPayload = {
      locationString: search.selectedLocation?.description || locationString,
      latitude: submitLat,
      longitude: submitLng,
      startDate: search.dateRange.start ?? undefined,
      endDate: search.dateRange.end ?? undefined,
      numAdults: search.guests.adults,
      numChildren: search.guests.children,
      numPets: search.guests.pets,
    };

    const navigate = (url: string) => { window.location.href = url; };

    try {
      if (isClerkSignedIn) {
        if (shouldUpdate && tripId) {
          const response = await editTrip(tripId, tripPayload);
          if (response.success) {
            navigate(buildSearchUrl({ tripId }));
          } else {
            toast({ variant: 'destructive', description: response.error || 'Failed to update trip' });
          }
        } else {
          const response = await createTrip(tripPayload);
          if (response.success && response.trip) {
            navigate(buildSearchUrl({ tripId: response.trip.id }));
          } else {
            toast({ variant: 'destructive', description: (response as any).error || 'Failed to create trip' });
          }
        }
      } else {
        if (shouldUpdate && sessionId) {
          const response = await updateGuestSession(sessionId, {
            startDate: search.dateRange.start,
            endDate: search.dateRange.end,
            numAdults: search.guests.adults,
            numChildren: search.guests.children,
            numPets: search.guests.pets,
          });
          if (response.success) {
            navigate(buildSearchUrl({ sessionId }));
          } else {
            toast({ variant: 'destructive', description: response.error || 'Failed to update session' });
          }
        } else {
          const response = await createGuestTrip(tripPayload);
          if (response.success && response.sessionId) {
            const sessionData = GuestSessionService.createGuestSessionData(tripPayload, response.sessionId);
            GuestSessionService.storeSession(sessionData);
            navigate(buildSearchUrl({ sessionId: response.sessionId }));
          } else {
            toast({ variant: 'destructive', description: (response as any).error || 'Failed to create search' });
          }
        }
      }
    } catch {
      toast({ variant: 'destructive', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateDisplay = formatDateDisplay(search.dateRange);
  const guestDisplay = formatGuestDisplay(search.guests);

  const searchBarContent = () => (
    <>
      <div className="flex items-center flex-1 min-w-0">
        {/* WHERE trigger */}
        <button
          className="flex flex-col flex-1 min-w-0 md:border-r md:border-gray-300 text-left md:pr-3 lg:pr-5"
          onClick={handleWhereClick}
        >
          {/* Mobile: single-line pill text */}
          <span className="md:hidden text-xs font-medium text-gray-500 truncate flex items-center justify-center gap-1.5 w-full">
            {search.locationDisplayValue || 'Begin Your Search'}
            {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
          </span>
          {/* Desktop: two-line Where / Choose Location */}
          <span className="hidden md:inline text-[11px] lg:text-xs font-medium leading-tight text-gray-600">Where</span>
          <span className={`hidden md:flex text-[11px] lg:text-xs truncate leading-tight items-center gap-1.5 ${search.locationDisplayValue ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {search.locationDisplayValue || 'Choose Location'}
            {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
          </span>
        </button>

        {/* WHEN trigger */}
        <button
          className="hidden md:flex flex-col flex-1 min-w-0 border-r border-gray-300 text-left px-3 lg:px-5"
          onClick={() => search.togglePopover('when')}
        >
          <span className="text-[11px] lg:text-xs font-medium leading-tight text-gray-600">When</span>
          <span className={`text-[11px] lg:text-xs truncate leading-tight ${dateDisplay ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {dateDisplay || 'Add Dates'}
          </span>
        </button>

        {/* WHO trigger */}
        <button
          className="hidden md:flex flex-col flex-1 min-w-0 text-left pl-3 lg:pl-5"
          onClick={() => search.togglePopover('who')}
        >
          <span className="text-[11px] lg:text-xs font-medium leading-tight text-gray-600">Who</span>
          <span className={`text-[11px] lg:text-xs truncate leading-tight ${guestDisplay ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {guestDisplay || 'Add Renters'}
          </span>
        </button>
      </div>

      <Button
        size="icon"
        className="hidden md:flex w-9 h-9 lg:w-10 lg:h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-2 lg:ml-3"
        onClick={handleSubmit}
        disabled={isSubmitting || search.isGeocoding}
      >
        {isSubmitting || search.isGeocoding ? (
          <ImSpinner8 className="animate-spin w-3.5 h-3.5 lg:w-4 lg:h-4" />
        ) : (
          <SearchIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        )}
      </Button>
    </>
  );

  return (
    <>
    <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10">
      {/* Header row */}
      <header className="relative z-30 flex items-center justify-between md:justify-start gap-4 px-4 sm:px-6 h-[76px]">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img className="w-[160px] md:w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        {/* Desktop: Compact search bar in header (when not expanded) */}
        <motion.div
          className="hidden md:flex flex-1 items-center justify-center min-w-0"
          initial={false}
          animate={{ 
            opacity: isExpanded ? 0 : 1,
            pointerEvents: isExpanded ? 'none' : 'auto'
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex items-center w-full h-[50px] bg-background rounded-full"
            initial={false}
            animate={{
              maxWidth: 700,
              paddingLeft: 20,
              paddingRight: 8,
              boxShadow: '0px 4px 10px rgba(0,0,0,0.12)',
            }}
          >
            {searchBarContent()}
          </motion.div>
        </motion.div>

        {/* User Menu */}
        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
          <UserMenu
            color="white"
            mode="header"
            userId={userId}
            user={user}
            isSignedIn={isSignedIn}
            hasListings={hasListings}
          />
        </div>
      </header>

      {/* Mobile: search pill + filter button row below header */}
      <div className="md:hidden flex items-center w-full px-4 sm:px-6 pb-4 pt-1 gap-2">
        <button
          className="flex items-center justify-center flex-1 min-w-0 h-[50px] px-5 py-3 bg-background rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.12)] text-center"
          onClick={handleWhereClick}
        >
          <div className="flex flex-col items-center min-w-0 flex-1">
            <span className="text-xs font-medium text-[#384250] truncate font-poppins">
              {search.locationDisplayValue || 'Begin Your Search'}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {[dateDisplay || 'No dates', guestDisplay || '1 Renter'].join(' · ')}
            </span>
          </div>
          {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0 ml-2" />}
        </button>
        {onFiltersClick && (
          <button
            className="flex items-center justify-center w-[50px] h-[50px] rounded-xl border border-gray-300 bg-background shadow-[0px_4px_10px_rgba(0,0,0,0.12)] flex-shrink-0"
            onClick={onFiltersClick}
            aria-label="Open filters"
          >
            <UpdatedFilterIcon className="w-5 h-5 text-primaryBrand" />
          </button>
        )}
      </div>

      {/* Desktop: Height spacer — pushes content below navbar down when expanded */}
      <motion.div
        className="hidden md:block flex-shrink-0"
        initial={false}
        animate={{ height: isExpanded ? 86 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Desktop: Expanded search bar — absolutely positioned below header when expanded */}
      <motion.div
        className="hidden md:flex absolute inset-x-0 z-50 flex-col items-center px-4 lg:px-6 pointer-events-none"
        initial={false}
        animate={{ 
          top: 88,
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Search bar */}
        <motion.div
          className="flex items-center w-full h-[50px] bg-background rounded-full pointer-events-auto mx-auto"
          initial={false}
          animate={{
            maxWidth: 860,
            paddingLeft: 24,
            paddingRight: 12,
            boxShadow: '0px 6px 12px rgba(0,0,0,0.15)',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {searchBarContent()}
        </motion.div>

        {/* Animated dropdown popover */}
        <div className="w-full max-w-[860px] mt-3 pointer-events-auto mx-auto px-2 lg:px-0">
          <DesktopSearchPopover
            activePopover={search.activePopover}
            search={search}
            recentSearches={recentSearches}
            suggestedLocations={suggestedLocations}
          />
        </div>
      </motion.div>
    </div>

    {/* Desktop popover backdrop */}
    {search.activePopover && (
      <div
        className="fixed inset-0 z-40 bg-gray-800/40 hidden md:block"
        onClick={() => search.closePopover()}
      />
    )}

    <MobileSearchOverlay
      isOpen={isMobileOverlayOpen}
      onClose={() => setIsMobileOverlayOpen(false)}
      onSubmit={() => {
        setIsMobileOverlayOpen(false);
        handleSubmit();
      }}
      isSubmitting={isSubmitting}
      search={search}
      recentSearches={recentSearches}
      suggestedLocations={suggestedLocations}
    />
    </>
  );
}
