'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import SearchDateRange from '@/components/newnew/search-date-range';
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

interface SearchResultsNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  locationString: string;
}

type ActivePopover = 'where' | 'when' | 'who' | null;

export default function SearchResultsNavbar({
  userId,
  user,
  isSignedIn,
  locationString,
}: SearchResultsNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SuggestedLocation | null>(null);
  const [locationDisplayValue, setLocationDisplayValue] = useState(locationString);
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
                    <span className={`text-xs truncate leading-tight ${locationDisplayValue ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {locationDisplayValue || 'Choose Location'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(402px,calc(100vw-2rem))] p-0 border-[#e9e9eb]"
                  align="start"
                  sideOffset={12}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="p-6 flex flex-col gap-6">
                    <HeroLocationSuggest
                      hasAccess={true}
                      onLocationSelect={handleLocationSelect}
                      onInputChange={(value) => setIsTypingLocation(value.length > 0)}
                      showLocationIcon={true}
                      setDisplayValue={setLocationDisplayValue}
                      contentClassName="p-0"
                      placeholder={
                        selectedLocation?.description
                          ? 'Wrong place? Begin typing and select another'
                          : 'Enter an address or city'
                      }
                    />
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
              className="w-8 h-8 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-3"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
