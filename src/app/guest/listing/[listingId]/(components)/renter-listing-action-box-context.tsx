'use client';

import React, { createContext, useState, useContext, useMemo, useCallback, useTransition, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { applyToListingFromSearch } from '@/app/actions/housing-requests';
import { Trip } from '@prisma/client';
import GuestAuthModal from '@/components/guest-auth-modal';

// ---------- Types ----------

type Guests = { adults: number; children: number; pets: number };

export interface RenterListingActionBoxState {
  startDate: Date | null;
  endDate: Date | null;
  guests: Guests;
  showDatesPopover: boolean;
  showRentersPopover: boolean;
  showMobileOverlay: boolean;
  showAuthModal: boolean;
  authRedirectUrl: string | undefined;
  hasApplied: boolean;
  isMatched: boolean;
  isApplying: boolean;
  applyError: string | null;
  // Derived
  hasDates: boolean;
  hasRenterInfo: boolean;
  totalRenters: number;
  calculatedPrice: number | null;
  priceRange: { min: number; max: number; hasRange: boolean };
  unavailablePeriods: Array<{ startDate: Date; endDate: Date }>;
}

export interface RenterListingActionBoxActions {
  setDates: (start: Date | null, end: Date | null) => void;
  clearDates: () => void;
  setGuests: React.Dispatch<React.SetStateAction<Guests>>;
  clearGuests: () => void;
  openDatesPopover: () => void;
  closeDatesPopover: () => void;
  openRentersPopover: () => void;
  closeRentersPopover: () => void;
  confirmDates: () => void;
  confirmRenters: () => void;
  openMobileOverlay: () => void;
  closeMobileOverlay: () => void;
  handleApplyClick: () => void;
  handleMessageHost: () => void;
}

export interface RenterListingActionBoxContextType {
  state: RenterListingActionBoxState;
  actions: RenterListingActionBoxActions;
  listing: ListingAndImages;
}

// ---------- Context ----------

const RenterListingActionBoxContext = createContext<RenterListingActionBoxContextType | undefined>(undefined);

export function useRenterListingActionBox() {
  const ctx = useContext(RenterListingActionBoxContext);
  if (!ctx) {
    throw new Error('useRenterListingActionBox must be used within a RenterListingActionBoxProvider');
  }
  return ctx;
}

// ---------- Provider ----------

interface RenterListingActionBoxProviderProps {
  children: ReactNode;
  listing: ListingAndImages;
  isAuthenticated: boolean;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  initialGuests?: Guests;
  /** If provided, called instead of the default server-action apply after auth check. Receives current dates + guests. */
  onApplyOverride?: (dates: { start: Date; end: Date }, guests: Guests) => void;
}

export function RenterListingActionBoxProvider({
  children, listing, isAuthenticated, listingState = null,
  initialStartDate = null, initialEndDate = null, initialGuests,
  onApplyOverride,
}: RenterListingActionBoxProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Core state
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate ?? null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate ?? null);
  const [guests, setGuests] = useState<Guests>(initialGuests ?? { adults: 0, children: 0, pets: 0 });
  const [showDatesPopover, setShowDatesPopover] = useState(false);
  const [showRentersPopover, setShowRentersPopover] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string | undefined>(undefined);
  const [hasApplied, setHasApplied] = useState(listingState?.hasApplied ?? false);
  const [isMatched, setIsMatched] = useState(listingState?.isMatched ?? false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Derived values
  const hasDates = !!(startDate && endDate);
  const hasRenterInfo = guests.adults > 0;
  const totalRenters = guests.adults + guests.children;

  const calculatedPrice = useMemo(() => {
    if (startDate && endDate) {
      const mockTrip = { startDate, endDate } as Trip;
      const listingWithPricing = { ...listing, monthlyPricing: listing.monthlyPricing || [] };
      return calculateRent({ listing: listingWithPricing, trip: mockTrip });
    }
    return null;
  }, [startDate, endDate, listing]);

  const priceRange = useMemo(() => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      return { min: listing.price || 0, max: listing.price || 0, hasRange: false };
    }
    const prices = listing.monthlyPricing.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, hasRange: min !== max };
  }, [listing.monthlyPricing, listing.price]);

  const unavailablePeriods = useMemo(() => {
    const periods: Array<{ startDate: Date; endDate: Date }> = [];
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

  // Actions
  const setDates = useCallback((start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const clearDates = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const clearGuests = useCallback(() => {
    setGuests({ adults: 0, children: 0, pets: 0 });
  }, []);

  const openDatesPopover = useCallback(() => setShowDatesPopover(true), []);
  const closeDatesPopover = useCallback(() => setShowDatesPopover(false), []);
  const openRentersPopover = useCallback(() => {
    setShowRentersPopover(true);
    setGuests(prev => prev.adults === 0 ? { ...prev, adults: 1 } : prev);
  }, []);
  const closeRentersPopover = useCallback(() => setShowRentersPopover(false), []);

  const confirmDates = useCallback(() => {
    setShowDatesPopover(false);
    setShowRentersPopover(true);
    setGuests(prev => prev.adults === 0 ? { ...prev, adults: 1 } : prev);
  }, []);

  const confirmRenters = useCallback(() => {
    setShowRentersPopover(false);
  }, []);

  const openMobileOverlay = useCallback(() => setShowMobileOverlay(true), []);
  const closeMobileOverlay = useCallback(() => setShowMobileOverlay(false), []);

  const buildApplyRedirectUrl = useCallback(() => {
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    if (guests.adults > 0) params.set('numAdults', String(guests.adults));
    if (guests.children > 0) params.set('numChildren', String(guests.children));
    if (guests.pets > 0) params.set('numPets', String(guests.pets));
    params.set('isApplying', 'true');
    return `${currentPath}?${params.toString()}`;
  }, [startDate, endDate, guests]);

  const handleApplyNow = useCallback(() => {
    setApplyError(null);
    startTransition(async () => {
      const result = await applyToListingFromSearch(listing.id, {
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
      });
      if (result.success) {
        setHasApplied(true);
      } else {
        setApplyError(result.error || 'Failed to apply');
      }
    });
  }, [listing.id, startDate, endDate]);

  const handleApplyClick = useCallback(() => {
    if (!isAuthenticated) {
      setAuthRedirectUrl(startDate && endDate ? buildApplyRedirectUrl() : undefined);
      setShowAuthModal(true);
      return;
    }
    if (onApplyOverride && startDate && endDate) {
      onApplyOverride({ start: startDate, end: endDate }, guests);
      return;
    }
    handleApplyNow();
  }, [isAuthenticated, startDate, endDate, guests, buildApplyRedirectUrl, handleApplyNow, onApplyOverride]);

  const handleMessageHost = useCallback(() => {
    if (!isAuthenticated) {
      setAuthRedirectUrl(`/app/rent/messages?listingId=${listing.id}`);
      setShowAuthModal(true);
      return;
    }
    router.push(`/app/rent/messages?listingId=${listing.id}`);
  }, [isAuthenticated, listing.id, router]);

  // Assemble context value
  const state: RenterListingActionBoxState = {
    startDate,
    endDate,
    guests,
    showDatesPopover,
    showRentersPopover,
    showMobileOverlay,
    showAuthModal,
    authRedirectUrl,
    hasApplied,
    isMatched,
    isApplying: isPending,
    applyError,
    hasDates,
    hasRenterInfo,
    totalRenters,
    calculatedPrice,
    priceRange,
    unavailablePeriods,
  };

  const actions: RenterListingActionBoxActions = {
    setDates,
    clearDates,
    setGuests,
    clearGuests,
    openDatesPopover,
    closeDatesPopover,
    openRentersPopover,
    closeRentersPopover,
    confirmDates,
    confirmRenters,
    openMobileOverlay,
    closeMobileOverlay,
    handleApplyClick,
    handleMessageHost,
  };

  const contextValue = useMemo(() => ({ state, actions, listing }), [
    startDate, endDate, guests, showDatesPopover, showRentersPopover,
    showMobileOverlay, showAuthModal, authRedirectUrl, hasApplied,
    isMatched, isPending, applyError, calculatedPrice, priceRange,
    unavailablePeriods, listing,
    // actions are stable via useCallback
    setDates, clearDates, setGuests, clearGuests, openDatesPopover,
    closeDatesPopover, openRentersPopover, closeRentersPopover,
    confirmDates, confirmRenters, openMobileOverlay, closeMobileOverlay,
    handleApplyClick, handleMessageHost,
  ]);

  return (
    <RenterListingActionBoxContext.Provider value={contextValue}>
      {children}
      <GuestAuthModal
        isOpen={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
          if (!open) setAuthRedirectUrl(undefined);
        }}
        redirectUrl={authRedirectUrl}
      />
    </RenterListingActionBoxContext.Provider>
  );
}
