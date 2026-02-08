'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import MobileSearchOverlay from '@/components/newnew/mobile-search-overlay';
import DesktopSearchPopover from '@/components/newnew/desktop-search-popover';
import { getHostListingsCount } from '@/app/actions/listings';
import { createTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { GuestSessionService } from '@/utils/guest-session';
import { buildSearchUrl } from '@/app/search/search-page-client';
import { useSearchBarPopovers } from '@/hooks/useSearchBarPopovers';
import { formatDateDisplay, formatGuestDisplay } from '@/lib/search-display-utils';

import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
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
  tripId: string;
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

export default function SearchNavbar({ userId, user, isSignedIn, recentSearches = [], suggestedLocations = [] }: SearchNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

  const search = useSearchBarPopovers({
    initialGuests: { adults: 1, children: 0, pets: 0 },
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

    if (!search.selectedLocation?.lat || !search.selectedLocation?.lng || !search.selectedLocation?.description) {
      search.setActivePopover('where');
      toast({ variant: 'destructive', description: 'Please select a location' });
      return;
    }

    setIsSubmitting(true);

    const tripData = {
      locationString: search.selectedLocation.description,
      latitude: search.selectedLocation.lat,
      longitude: search.selectedLocation.lng,
      startDate: search.dateRange.start,
      endDate: search.dateRange.end,
      numAdults: search.guests.adults,
      numChildren: search.guests.children,
      numPets: search.guests.pets,
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

  const dateDisplay = formatDateDisplay(search.dateRange);
  const guestDisplay = formatGuestDisplay(search.guests);

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
        <div className="relative w-full max-w-[860px]">
          {/* Search bar pill */}
          <div className="flex items-center w-full h-[50px] pl-6 pr-3 py-2 bg-white rounded-full shadow-[0px_6px_12px_rgba(0,0,0,0.15)]">
            <div className="flex items-center flex-1 min-w-0">

              {/* WHERE trigger */}
              <button
                className="flex flex-col flex-1 min-w-0 md:border-r md:border-gray-300 md:pr-6 text-left"
                onClick={handleWhereClick}
              >
                {/* Mobile: single-line pill text */}
                <span className="md:hidden text-xs font-medium text-gray-500 truncate flex items-center justify-center gap-1.5 w-full">
                  {search.locationDisplayValue || 'Begin Your Search'}
                  {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
                </span>
                {/* Desktop: two-line Where / Choose Location */}
                <span className="hidden md:inline text-xs font-medium text-gray-700">Where</span>
                <span className={`hidden md:flex text-xs truncate items-center gap-1.5 ${search.locationDisplayValue ? 'text-gray-700' : 'text-gray-400'}`}>
                  {search.locationDisplayValue || 'Choose Location'}
                  {search.isGeocoding && <ImSpinner8 className="animate-spin w-3 h-3 flex-shrink-0" />}
                </span>
              </button>

              {/* WHEN trigger */}
              <button
                className="hidden md:flex flex-col flex-1 min-w-0 border-r border-gray-300 px-6 text-left"
                onClick={() => search.togglePopover('when')}
              >
                <span className="text-xs font-medium text-gray-700">When</span>
                <span className={`text-xs truncate ${dateDisplay ? 'text-gray-700' : 'text-gray-400'}`}>
                  {dateDisplay || 'Add Dates'}
                </span>
              </button>

              {/* WHO trigger */}
              <button
                className="hidden md:flex flex-col flex-1 min-w-0 pl-6 text-left"
                onClick={() => search.togglePopover('who')}
              >
                <span className="text-xs font-medium text-gray-700">Who</span>
                <span className={`text-xs truncate ${guestDisplay ? 'text-gray-700' : 'text-gray-400'}`}>
                  {guestDisplay || 'Add Renters'}
                </span>
              </button>

            </div>

            <Button
              size="icon"
              className="hidden md:flex w-10 h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-2 items-center justify-center"
              onClick={handleSubmit}
              disabled={isSubmitting || search.isGeocoding}
            >
              {isSubmitting || search.isGeocoding ? (
                <ImSpinner8 className="animate-spin w-4 h-4" />
              ) : (
                <SearchIcon className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Animated dropdown popover */}
          <div className="absolute top-[62px] left-0 right-0 z-50">
            <DesktopSearchPopover
              activePopover={search.activePopover}
              search={search}
              recentSearches={recentSearches}
              suggestedLocations={suggestedLocations}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Desktop popover backdrop */}
    {search.activePopover && (
      <div
        className="fixed inset-0 z-40 bg-gray-800/40 hidden md:block"
        onClick={() => search.closeAllPopovers()}
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
      isGeocoding={search.isGeocoding}
      selectedLocation={search.selectedLocation}
      locationDisplayValue={search.locationDisplayValue}
      setLocationDisplayValue={search.setLocationDisplayValue}
      onLocationSelect={search.handleLocationSelect}
      onGeocodingStateChange={search.setIsGeocoding}
      onSuggestedLocationClick={search.handleSuggestedLocationClick}
      dateRange={search.dateRange}
      onDateChange={search.handleDateChange}
      guests={search.guests}
      setGuests={search.setGuests}
      recentSearches={recentSearches}
      suggestedLocations={suggestedLocations}
    />
    </>
  );
}
