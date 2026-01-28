'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import SearchDateRange from '@/components/newnew/search-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import MobileSearchOverlay from '@/components/newnew/mobile-search-overlay';
import { getHostListingsCount } from '@/app/actions/listings';
import { createTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { GuestSessionService } from '@/utils/guest-session';
import { buildSearchUrl } from '@/app/search/search-page-client';

import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { SuggestedLocation } from '@/types';
import { ImSpinner8 } from 'react-icons/im';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

export interface RecentSearch {
  location: string;
  details: string;
}

export interface SuggestedLocationItem {
  title: string;
}

interface SearchNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  recentSearches?: RecentSearch[];
  suggestedLocations?: SuggestedLocationItem[];
}

type ActivePopover = 'where' | 'when' | 'who' | null;

export default function SearchNavbar({ userId, user, isSignedIn, recentSearches = [], suggestedLocations = [] }: SearchNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SuggestedLocation | null>(null);
  const [locationDisplayValue, setLocationDisplayValue] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [guests, setGuests] = useState({ adults: 1, children: 0, pets: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

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

  const handlePopoverChange = (popover: ActivePopover, open: boolean) => {
    setActivePopover(open ? popover : null);
  };

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
    const total = renters + guests.pets;
    if (total <= 1) return '';
    const parts: string[] = [];
    if (renters > 0) parts.push(`${renters} Renter${renters !== 1 ? 's' : ''}`);
    if (guests.pets > 0) parts.push(`${guests.pets} Pet${guests.pets !== 1 ? 's' : ''}`);
    return parts.join(' and ');
  };

  const handleWhereClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      e.stopPropagation();
      setIsMobileOverlayOpen(true);
    }
  };

  // TODO: handle rapid double-press — isSubmitting guard prevents duplicate calls,
  // but if the first call completes and navigation starts before the second press,
  // the user could trigger a second trip creation. Consider disabling the button
  // via ref or debouncing at the UI level.
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setActivePopover(null);

    if (!selectedLocation?.lat || !selectedLocation?.lng || !selectedLocation?.description) {
      setActivePopover('where');
      toast({ variant: 'destructive', description: 'Please select a location' });
      return;
    }

    setIsSubmitting(true);

    const tripData = {
      locationString: selectedLocation.description,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      startDate: dateRange.start,
      endDate: dateRange.end,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
    };

    try {
      if (isClerkSignedIn) {
        const response = await createTrip(tripData);
        if (response.success && response.trip) {
          window.location.href = buildSearchUrl({ tripId: response.trip.id });
        } else {
          toast({ variant: 'destructive', description: (response as any).error || 'Failed to create trip' });
        }
      } else {
        const response = await createGuestTrip(tripData);
        if (response.success && response.sessionId) {
          const sessionData = GuestSessionService.createGuestSessionData(tripData, response.sessionId);
          GuestSessionService.storeSession(sessionData); // best-effort; DB is source of truth
          window.location.href = buildSearchUrl({ sessionId: response.sessionId });
        } else {
          toast({ variant: 'destructive', description: (response as any).error || 'Failed to create search' });
        }
      }
    } catch {
      toast({ variant: 'destructive', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="relative z-50 w-full bg-gradient-to-b from-white to-primaryBrand/10">
      {/* Header row */}
      <header className="flex items-center justify-between px-6 h-[76px]">
        <Link href="/">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        <div className="flex items-center gap-6">
          <Button
            asChild
            variant="outline"
            className="text-primaryBrand border-primaryBrand hover:bg-primaryBrand hover:text-white font-semibold transition-colors duration-300 hidden md:inline-flex"
          >
            <Link href={hasListings ? '/refer-host' : '/hosts'}>
              {hasListings ? 'Refer a Host' : 'Become a Host'}
            </Link>
          </Button>

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

      {/* Search bar row */}
      <div className="flex items-center justify-center w-full px-6 pb-6 pt-3">
        <div className="flex items-center w-full max-w-[860px] h-[50px] pl-6 pr-3 py-2 bg-white rounded-full shadow-[0px_6px_12px_rgba(0,0,0,0.15)]">
          <div className="flex items-center flex-1 min-w-0">

            {/* WHERE */}
            <Popover open={activePopover === 'where'} onOpenChange={(open) => handlePopoverChange('where', open)}>
              <PopoverTrigger asChild>
                <button
                  className="flex flex-col flex-1 min-w-0 md:border-r md:border-gray-300 md:pr-6 text-left"
                  onClick={handleWhereClick}
                >
                  {/* Mobile: single-line pill text */}
                  <span className="md:hidden text-xs font-medium text-gray-500 truncate flex items-center justify-center gap-1.5 w-full">
                    {locationDisplayValue || 'Begin Your Search'}
                    {isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
                  </span>
                  {/* Desktop: two-line Where / Choose Location */}
                  <span className="hidden md:inline text-xs font-medium text-gray-700">Where</span>
                  <span className={`hidden md:flex text-xs truncate items-center gap-1.5 ${locationDisplayValue ? 'text-gray-700' : 'text-gray-400'}`}>
                    {locationDisplayValue || 'Choose Location'}
                    {isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-32px)] md:w-[402px] p-0 border-[#e9e9eb] rounded-lg"
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
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="px-3.5">
                            <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">
                              Recent Searches
                            </h3>
                          </div>

                          {recentSearches.map((search, index) => (
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

                      {/* Suggested */}
                      {suggestedLocations.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="px-3.5">
                            <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">
                              Suggested
                            </h3>
                          </div>

                          {suggestedLocations.map((location, index) => (
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
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* WHEN */}
            <Popover open={activePopover === 'when'} onOpenChange={(open) => handlePopoverChange('when', open)}>
              <PopoverTrigger asChild>
                <button className="hidden md:flex flex-col flex-1 min-w-0 border-r border-gray-300 px-6 text-left">
                  <span className="text-xs font-medium text-gray-700">When</span>
                  <span className={`text-xs truncate ${formatDateDisplay() ? 'text-gray-700' : 'text-gray-400'}`}>
                    {formatDateDisplay() || 'Add Dates'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-none rounded-lg"
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
                <button className="hidden md:flex flex-col flex-1 min-w-0 pl-6 text-left">
                  <span className="text-xs font-medium text-gray-700">Who</span>
                  <span className={`text-xs truncate ${formatGuestDisplay() ? 'text-gray-700' : 'text-gray-400'}`}>
                    {formatGuestDisplay() || 'Add Renters'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-32px)] md:w-[320px] p-0 rounded-lg"
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
            className="hidden md:flex w-10 h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-2 items-center justify-center"
            onClick={handleSubmit}
            disabled={isSubmitting || isGeocoding}
          >
            {isSubmitting || isGeocoding ? (
              <ImSpinner8 className="animate-spin w-4 h-4" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>

    {/* Desktop popover backdrop */}
    {activePopover && (
      <div
        className="fixed inset-0 z-40 bg-gray-800/40 hidden md:block"
        onClick={() => setActivePopover(null)}
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
      isGeocoding={isGeocoding}
      selectedLocation={selectedLocation}
      locationDisplayValue={locationDisplayValue}
      setLocationDisplayValue={setLocationDisplayValue}
      onLocationSelect={handleLocationSelect}
      onGeocodingStateChange={setIsGeocoding}
      onSuggestedLocationClick={handleSuggestedLocationClick}
      dateRange={dateRange}
      onDateChange={handleDateChange}
      guests={guests}
      setGuests={setGuests}
      recentSearches={recentSearches}
      suggestedLocations={suggestedLocations}
    />
    </>
  );
}
