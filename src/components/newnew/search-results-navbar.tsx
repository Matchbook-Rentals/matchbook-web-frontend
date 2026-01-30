'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SearchIcon, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import SearchDateRange from '@/components/newnew/search-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { getHostListingsCount } from '@/app/actions/listings';
import { createTrip, editTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { updateGuestSession } from '@/app/actions/guest-session-db';
import { GuestSessionService } from '@/utils/guest-session';
import { buildSearchUrl } from '@/app/search/search-page-client';


import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { SuggestedLocation } from '@/types';
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

type ActivePopover = 'where' | 'when' | 'who' | null;

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
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SuggestedLocation | null>(null);
  const [locationDisplayValue, setLocationDisplayValue] = useState(locationString);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => ({
    start: tripData?.startDate ? new Date(tripData.startDate) : null,
    end: tripData?.endDate ? new Date(tripData.endDate) : null,
  }));
  const [guests, setGuests] = useState(() => ({
    adults: tripData?.numAdults ?? 0,
    children: tripData?.numChildren ?? 0,
    pets: tripData?.numPets ?? 0,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
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

  const handleLocationSelect = (location: SuggestedLocation | null) => {
    setSelectedLocation(location);
    if (location?.lat && location?.lng) {
      setActivePopover('when');
    }
  };

  const handleSuggestedLocationClick = async (title: string) => {
    const locationName = title.replace(/^Monthly Rentals in\s*/i, '');
    setLocationDisplayValue(locationName);
    setActivePopover(null);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(locationName)}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setSelectedLocation({ description: locationName, lat, lng });
      }
    } catch {
      // Geocoding failed — display value is already set
    }
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  // Check if dates have changed from initial values
  const haveDatesChanged = () => {
    const startChanged = dateRange.start?.toISOString() !== initialDates.current.start;
    const endChanged = dateRange.end?.toISOString() !== initialDates.current.end;
    return startChanged || endChanged;
  };

  // Check if guests have changed from initial values
  const haveGuestsChanged = () => {
    return (
      guests.adults !== initialGuests.current.adults ||
      guests.children !== initialGuests.current.children ||
      guests.pets !== initialGuests.current.pets
    );
  };

  // Save dates on blur when the date popover closes
  const saveDatesOnBlur = async () => {
    if (!haveDatesChanged()) return;
    if (isSavingDates) return;

    const hasBothDates = dateRange.start && dateRange.end;
    const isClearingDates = !dateRange.start && !dateRange.end;

    // Only save if we have both dates OR we're clearing dates (had dates initially)
    if (!hasBothDates && !isClearingDates) return;
    // Don't clear dates if we never had them
    if (isClearingDates && !hadDatesInitially.current) return;

    // Determine if this change should trigger a refetch
    const shouldRefetch = hadDatesInitially.current;

    setIsSavingDates(true);

    try {
      // Save to database (null values to clear dates)
      if (isClerkSignedIn && tripId) {
        const response = await editTrip(tripId, {
          startDate: dateRange.start ?? null,
          endDate: dateRange.end ?? null,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save dates' });
          return;
        }
      } else if (sessionId) {
        const response = await updateGuestSession(sessionId, {
          startDate: dateRange.start ?? null,
          endDate: dateRange.end ?? null,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save dates' });
          return;
        }
      } else {
        // No trip or session yet - don't auto-save, user must click search
        return;
      }

      // Update initial refs so subsequent blurs know the new baseline
      initialDates.current = {
        start: dateRange.start?.toISOString() ?? null,
        end: dateRange.end?.toISOString() ?? null,
      };
      hadDatesInitially.current = hasBothDates ? true : false;

      // Notify parent about the change
      onTripDataChange?.({
        startDate: dateRange.start?.toISOString() ?? null,
        endDate: dateRange.end?.toISOString() ?? null,
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
    if (!haveGuestsChanged()) return;
    if (isSavingGuests) return;

    setIsSavingGuests(true);

    try {
      if (isClerkSignedIn && tripId) {
        const response = await editTrip(tripId, {
          numAdults: guests.adults,
          numChildren: guests.children,
          numPets: guests.pets,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save guests' });
          return;
        }
      } else if (sessionId) {
        const response = await updateGuestSession(sessionId, {
          numAdults: guests.adults,
          numChildren: guests.children,
          numPets: guests.pets,
        });
        if (!response.success) {
          toast({ variant: 'destructive', description: response.error || 'Failed to save guests' });
          return;
        }
      } else {
        // No trip or session yet - don't auto-save
        return;
      }

      // Update initial refs
      initialGuests.current = { ...guests };

      // Notify parent about the change (guests don't trigger refetch)
      onTripDataChange?.({
        numAdults: guests.adults,
        numChildren: guests.children,
        numPets: guests.pets,
        needsRefetch: false,
      });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to save guests' });
    } finally {
      setIsSavingGuests(false);
    }
  };

  // Handle popover open/close - triggers save on close
  const handlePopoverChange = (popover: ActivePopover, open: boolean) => {
    // When closing a popover, trigger save before changing state
    if (!open && activePopover === 'when') {
      saveDatesOnBlur();
    }
    if (!open && activePopover === 'who') {
      saveGuestsOnBlur();
    }
    setActivePopover(open ? popover : null);
  };

  const formatDateDisplay = () => {
    if (!dateRange.start && !dateRange.end) return '';
    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    if (dateRange.start && dateRange.end) return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
    if (dateRange.start) return `${fmt(dateRange.start)} – ...`;
    return '';
  };

  const formatGuestDisplay = () => {
    const renters = guests.adults + guests.children;
    // Show "Add Renters" (empty string) only when no renters are set
    if (renters === 0 && guests.pets === 0) return '';
    const parts: string[] = [];
    if (renters > 0) parts.push(`${renters} Renter${renters !== 1 ? 's' : ''}`);
    if (guests.pets > 0) parts.push(`${guests.pets} Pet${guests.pets !== 1 ? 's' : ''}`);
    return parts.join(' and ');
  };

  // TODO: handle rapid double-press — isSubmitting guard prevents duplicate calls,
  // but if the first call completes and navigation starts before the second press,
  // the user could trigger a second trip creation. Consider disabling the button
  // via ref or debouncing at the UI level.
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setActivePopover(null);

    // Determine the location to use: selected new location, or current center
    const submitLat = selectedLocation?.lat ?? currentCenter?.lat;
    const submitLng = selectedLocation?.lng ?? currentCenter?.lng;

    if (!submitLat || !submitLng) {
      setActivePopover('where');
      toast({ variant: 'destructive', description: 'Please select a location' });
      return;
    }

    setIsSubmitting(true);

    const locationChanged = selectedLocation && currentCenter
      ? hasLocationChanged(
          { lat: selectedLocation.lat!, lng: selectedLocation.lng! },
          currentCenter
        )
      : false;

    const hasExistingTrip = !!tripId || !!sessionId;
    const shouldUpdate = hasExistingTrip && !locationChanged;

    const tripPayload = {
      locationString: selectedLocation?.description || locationString,
      latitude: submitLat,
      longitude: submitLng,
      startDate: dateRange.start ?? undefined,
      endDate: dateRange.end ?? undefined,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
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
            startDate: dateRange.start,
            endDate: dateRange.end,
            numAdults: guests.adults,
            numChildren: guests.children,
            numPets: guests.pets,
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

  return (
    <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10">
      {/* Header: flex-wrap lets the pill sit inline on md+ and wrap below on mobile */}
      <header className="flex flex-wrap items-center px-6 min-h-[76px] gap-y-3 pb-3 md:pb-0 md:h-[76px]">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        {/* Right: UserMenu — on mobile stays top-right; on desktop stays at the end */}
        <div className="flex items-center gap-6 flex-shrink-0 ml-auto md:order-3">
          <UserMenu
            color="white"
            mode="header"
            userId={userId}
            user={user}
            isSignedIn={isSignedIn}
            hasListings={hasListings}
          />
        </div>

        {/* Center: Search pill — single instance, wraps to full-width row on mobile */}
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 flex justify-center">
          <div className="flex items-center w-full max-w-[700px] h-[44px] pl-5 pr-2 py-1.5 bg-white rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.12)]">
            <div className="flex items-center flex-1 min-w-0">
              {/* WHERE */}
              <Popover open={activePopover === 'where'} onOpenChange={(open) => handlePopoverChange('where', open)}>
                <PopoverTrigger asChild>
                  <button className="flex flex-col flex-1 min-w-0 border-r border-gray-300 pr-5 text-left">
                    <span className="text-[10px] font-medium text-gray-500 leading-tight">Where</span>
                    <span className={`text-xs truncate leading-tight flex items-center gap-1.5 ${locationDisplayValue ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {locationDisplayValue || 'Choose Location'}
                      {isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(402px,calc(100vw-2rem))] p-0 border-[#e9e9eb] rounded-lg"
                  align="start"
                  sideOffset={12}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="p-6 flex flex-col gap-6">
                    <HeroLocationSuggest
                      hasAccess={true}
                      onLocationSelect={handleLocationSelect}
                      onInputChange={(value) => setIsTypingLocation(value.length > 0)}
                      onGeocodingStateChange={setIsGeocoding}
                      showLocationIcon={true}
                      setDisplayValue={setLocationDisplayValue}
                      contentClassName="p-0"
                      placeholder={
                        selectedLocation?.description
                          ? 'Wrong place? Begin typing and select another'
                          : 'Enter an address or city'
                      }
                    />

                    {!isTypingLocation && (
                      <>
                        {/* Recent Searches - max 3 */}
                        {recentSearches.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <div className="px-3.5">
                              <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">
                                Recent Searches
                              </h3>
                            </div>

                            {recentSearches.slice(0, 3).map((search, index) => (
                              <button
                                key={`recent-${index}`}
                                className="flex flex-col gap-1.5 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Clock className="w-5 h-5 text-gray-500" />
                                  <span className="font-medium text-[#0d1b2a] text-sm leading-5">
                                    {search.location}
                                  </span>
                                </div>
                                <span className="ml-[30px] text-xs text-gray-400">
                                  {search.details}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Suggested - show (5 - recentSearches count) items */}
                        {(() => {
                          const recentCount = Math.min(recentSearches.length, 3);
                          const suggestedCount = Math.max(0, 5 - recentCount);
                          const visibleSuggestions = suggestedLocations.slice(0, suggestedCount);

                          return visibleSuggestions.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              <div className="px-3.5">
                                <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">
                                  Suggested
                                </h3>
                              </div>

                              {visibleSuggestions.map((location, index) => (
                                <button
                                  key={`suggested-${index}`}
                                  className="flex items-center gap-2.5 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                                  onClick={() => handleSuggestedLocationClick(location.title)}
                                >
                                  <div className="flex w-[60px] h-[60px] items-center justify-center p-3 bg-white rounded-[10px] border border-[#eaecf0] shadow-sm">
                                    <Building2 className="w-6 h-6 text-gray-500" />
                                  </div>
                                  <span className="font-medium text-[#0d1b2a] text-sm leading-5 whitespace-nowrap">
                                    {location.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* WHEN */}
              <Popover open={activePopover === 'when'} onOpenChange={(open) => handlePopoverChange('when', open)}>
                <PopoverTrigger asChild>
                  <button className="flex flex-col flex-1 min-w-0 border-r border-gray-300 px-5 text-left">
                    <span className="text-[10px] font-medium text-gray-500 leading-tight">When</span>
                    <span className={`text-xs truncate leading-tight ${formatDateDisplay() ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {formatDateDisplay() || 'Add Dates'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-none"
                  align="center"
                  sideOffset={12}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <SearchDateRange
                    start={dateRange.start}
                    end={dateRange.end}
                    handleChange={handleDateChange}
                    minimumDateRange={{ months: 1 }}
                    maximumDateRange={{ months: 12 }}
                  />
                </PopoverContent>
              </Popover>

              {/* WHO */}
              <Popover open={activePopover === 'who'} onOpenChange={(open) => handlePopoverChange('who', open)}>
                <PopoverTrigger asChild>
                  <button className="flex flex-col flex-1 min-w-0 pl-5 text-left">
                    <span className="text-[10px] font-medium text-gray-500 leading-tight">Who</span>
                    <span className={`text-xs truncate leading-tight ${formatGuestDisplay() ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {formatGuestDisplay() || 'Add Renters'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-0 rounded-lg"
                  align="end"
                  sideOffset={12}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <GuestTypeCounter guests={guests} setGuests={setGuests} />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              size="icon"
              className="w-8 h-8 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-3"
              onClick={handleSubmit}
              disabled={isSubmitting || isGeocoding}
            >
              {isSubmitting || isGeocoding ? (
                <ImSpinner8 className="animate-spin w-3.5 h-3.5" />
              ) : (
                <SearchIcon className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
