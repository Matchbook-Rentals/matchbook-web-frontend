'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import { DesktopDateRange } from '@/components/ui/custom-calendar/date-range-selector/desktop-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { getHostListingsCount } from '@/app/actions/listings';
import { createTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { GuestSessionService } from '@/utils/guest-session';
import { useRouter } from 'next/navigation';
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

interface SearchNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

type ActivePopover = 'where' | 'when' | 'who' | null;

export default function SearchNavbar({ userId, user, isSignedIn }: SearchNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [selectedLocation, setSelectedLocation] = useState<SuggestedLocation | null>(null);
  const [locationDisplayValue, setLocationDisplayValue] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [guests, setGuests] = useState({ adults: 1, children: 0, pets: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isSignedIn: isClerkSignedIn } = useAuth();
  const router = useRouter();
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
    const total = guests.adults + guests.children + guests.pets;
    if (total <= 1) return '';
    const parts: string[] = [];
    if (guests.adults > 0) parts.push(`${guests.adults} adult${guests.adults !== 1 ? 's' : ''}`);
    if (guests.children > 0) parts.push(`${guests.children} child${guests.children !== 1 ? 'ren' : ''}`);
    if (guests.pets > 0) parts.push(`${guests.pets} pet${guests.pets !== 1 ? 's' : ''}`);
    return parts.join(', ');
  };

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
          router.push(`/app/rent/searches/${response.trip.id}`);
        } else {
          toast({ variant: 'destructive', description: (response as any).error || 'Failed to create trip' });
        }
      } else {
        const response = await createGuestTrip(tripData);
        if (response.success && response.sessionId) {
          const sessionData = GuestSessionService.createGuestSessionData(tripData, response.sessionId);
          const stored = GuestSessionService.storeSession(sessionData);
          if (!stored) {
            toast({ variant: 'destructive', description: 'Failed to store search data. Please try again.' });
            return;
          }
          router.push(response.redirectUrl!);
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
    <div className="relative w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_18%,rgba(9,88,89,0.06)_100%)]">
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
                <button className="flex flex-col flex-1 min-w-0 border-r border-gray-300 pr-6 text-left">
                  <span className="text-xs font-medium text-gray-700">Where</span>
                  <span className={`text-xs truncate ${locationDisplayValue ? 'text-gray-700' : 'text-gray-400'}`}>
                    {locationDisplayValue || 'Choose Location'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[400px] p-0"
                align="start"
                sideOffset={12}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <HeroLocationSuggest
                  hasAccess={true}
                  onLocationSelect={handleLocationSelect}
                  setDisplayValue={setLocationDisplayValue}
                  placeholder={
                    selectedLocation?.description
                      ? 'Wrong place? Begin typing and select another'
                      : 'Enter an address or city'
                  }
                />
              </PopoverContent>
            </Popover>

            {/* WHEN */}
            <Popover open={activePopover === 'when'} onOpenChange={(open) => handlePopoverChange('when', open)}>
              <PopoverTrigger asChild>
                <button className="flex flex-col flex-1 min-w-0 border-r border-gray-300 px-6 text-left">
                  <span className="text-xs font-medium text-gray-700">When</span>
                  <span className={`text-xs truncate ${formatDateDisplay() ? 'text-gray-700' : 'text-gray-400'}`}>
                    {formatDateDisplay() || 'Add Dates'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="center"
                sideOffset={12}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <DesktopDateRange
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
                <button className="flex flex-col flex-1 min-w-0 pl-6 text-left">
                  <span className="text-xs font-medium text-gray-700">Who</span>
                  <span className={`text-xs truncate ${formatGuestDisplay() ? 'text-gray-700' : 'text-gray-400'}`}>
                    {formatGuestDisplay() || 'Add Renters'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[320px] p-0"
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
            className="w-10 h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-2"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ImSpinner8 className="animate-spin w-4 h-4" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
