'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import DesktopSearchPopover from '@/components/newnew/desktop-search-popover';
import { getHostListingsCount } from '@/app/actions/listings';
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

export interface TripDataChange {
  startDate?: string | null;
  endDate?: string | null;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
  needsRefetch?: boolean;
}

interface SearchResultsNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  locationString: string;
  tripId?: string;
  sessionId?: string;
  currentCenter?: { lat: number; lng: number };
  tripData?: TripData | null;
  onSearchUpdate?: (newTripId?: string, newSessionId?: string) => void; // kept for potential future use
  onTripDataChange?: (changes: TripDataChange) => void;
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
  locationString,
  tripId,
  sessionId,
  currentCenter,
  tripData,
  onSearchUpdate,
  onTripDataChange,
  recentSearches = [],
  suggestedLocations = [],
}: SearchResultsNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [isSavingGuests, setIsSavingGuests] = useState(false);

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

    const shouldRefetch = hadDatesInitially.current;

    setIsSavingDates(true);

    try {
      if (isClerkSignedIn && tripId) {
        const response = await editTrip(tripId, {
          startDate: dates.start ?? null,
          endDate: dates.end ?? null,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save dates' });
          return;
        }
      } else if (sessionId) {
        const response = await updateGuestSession(sessionId, {
          startDate: dates.start ?? null,
          endDate: dates.end ?? null,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save dates' });
          return;
        }
      } else {
        return;
      }

      initialDates.current = {
        start: dates.start?.toISOString() ?? null,
        end: dates.end?.toISOString() ?? null,
      };
      hadDatesInitially.current = hasBothDates ? true : false;

      onTripDataChange?.({
        startDate: dates.start?.toISOString() ?? null,
        endDate: dates.end?.toISOString() ?? null,
        needsRefetch: shouldRefetch,
      });
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

    setIsSavingGuests(true);

    try {
      if (isClerkSignedIn && tripId) {
        const response = await editTrip(tripId, {
          numAdults: guestValues.adults,
          numChildren: guestValues.children,
          numPets: guestValues.pets,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save guests' });
          return;
        }
      } else if (sessionId) {
        const response = await updateGuestSession(sessionId, {
          numAdults: guestValues.adults,
          numChildren: guestValues.children,
          numPets: guestValues.pets,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save guests' });
          return;
        }
      } else {
        return;
      }

      initialGuests.current = { ...guestValues };

      onTripDataChange?.({
        numAdults: guestValues.adults,
        numChildren: guestValues.children,
        numPets: guestValues.pets,
        needsRefetch: false,
      });
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

  useEffect(() => {
    async function checkUserListings() {
      if (isSignedIn && userId) {
        try {
          const count = await getHostListingsCount();
          setHasListings(count > 0);
        } catch {
          setHasListings(undefined);
        }
      }
    }
    checkUserListings();
  }, [isSignedIn, userId]);

  // Collapse bar back to header when no popover is active
  useEffect(() => {
    if (search.activePopover === null) {
      setIsExpanded(false);
    }
  }, [search.activePopover]);

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

  const searchBarContent = (expanded: boolean) => (
    <>
      <div className="flex items-center flex-1 min-w-0">
        {/* WHERE trigger */}
        <button
          className={`flex flex-col flex-1 min-w-0 border-r border-gray-300 text-left ${expanded ? 'pr-6' : 'pr-5'}`}
          onClick={() => search.togglePopover('where')}
        >
          <span className={`text-xs font-medium leading-tight ${expanded ? 'text-gray-700' : 'text-gray-500'}`}>Where</span>
          <span className={`text-xs truncate leading-tight flex items-center gap-1.5 ${search.locationDisplayValue ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {search.locationDisplayValue || 'Choose Location'}
            {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
          </span>
        </button>

        {/* WHEN trigger */}
        <button
          className={`flex flex-col flex-1 min-w-0 border-r border-gray-300 text-left ${expanded ? 'px-6' : 'px-5'}`}
          onClick={() => search.togglePopover('when')}
        >
          <span className={`text-xs font-medium leading-tight ${expanded ? 'text-gray-700' : 'text-gray-500'}`}>When</span>
          <span className={`text-xs truncate leading-tight ${dateDisplay ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {dateDisplay || 'Add Dates'}
          </span>
        </button>

        {/* WHO trigger */}
        <button
          className={`flex flex-col flex-1 min-w-0 text-left ${expanded ? 'pl-6' : 'pl-5'}`}
          onClick={() => search.togglePopover('who')}
        >
          <span className={`text-xs font-medium leading-tight ${expanded ? 'text-gray-700' : 'text-gray-500'}`}>Who</span>
          <span className={`text-xs truncate leading-tight ${guestDisplay ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {guestDisplay || 'Add Renters'}
          </span>
        </button>
      </div>

      <Button
        size="icon"
        className="w-10 h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-3"
        onClick={handleSubmit}
        disabled={isSubmitting || search.isGeocoding}
      >
        {isSubmitting || search.isGeocoding ? (
          <ImSpinner8 className="animate-spin w-4 h-4" />
        ) : (
          <SearchIcon className="w-4 h-4" />
        )}
      </Button>
    </>
  );

  return (
    <>
    <div className="relative z-50 w-full bg-gradient-to-b from-white to-primaryBrand/10">
      {/* Header row */}
      <header className="flex items-center justify-between px-6 h-[76px]">
        <Link href="/" className="flex-shrink-0">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        <div className="flex items-center gap-6 flex-shrink-0">
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

      {/* Height spacer — pushes content below navbar down when expanded */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 86 : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Search bar — single element, absolutely positioned, animates between header center and below header */}
      <motion.div
        className="absolute inset-x-0 z-10 flex flex-col items-center px-6 pointer-events-none"
        initial={false}
        animate={{ top: isExpanded ? 88 : 13 }}
        transition={{ duration: 0.15 }}
      >
        {/* Search bar */}
        <motion.div
          className="flex items-center w-full h-[50px] bg-white rounded-full pointer-events-auto"
          initial={false}
          animate={{
            maxWidth: isExpanded ? 860 : 700,
            paddingLeft: 24,
            paddingRight: isExpanded ? 12 : 8,
            boxShadow: isExpanded
              ? '0px 6px 12px rgba(0,0,0,0.15)'
              : '0px 4px 10px rgba(0,0,0,0.12)',
          }}
          transition={{ duration: 0.15 }}
        >
          {searchBarContent(isExpanded)}
        </motion.div>

        {/* Animated dropdown popover */}
        <div className="w-full max-w-[860px] mt-3 pointer-events-auto">
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
    </>
  );
}
