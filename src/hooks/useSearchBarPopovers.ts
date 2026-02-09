import { useState, useEffect, useRef, useCallback } from 'react';
import { SuggestedLocation } from '@/types';
import { buildSearchUrl } from '@/app/search/search-page-client';

export type ActivePopover = 'where' | 'when' | 'who' | null;

export interface UseSearchBarPopoversConfig {
  initialLocationDisplay?: string;
  initialDates?: { start: Date | null; end: Date | null };
  initialGuests?: { adults: number; children: number; pets: number };

  /** Called when a popover is closing (before state change). */
  onPopoverClosing?: (closingPopover: ActivePopover) => void;

  /** Called when end-date selection auto-advances from 'when' to 'who'. */
  onDateAutoAdvance?: (dates: { start: Date | null; end: Date | null }) => void;

  /**
   * Returns ms to delay before opening a popover.
   * Side effects allowed (e.g. setIsExpanded(true)).
   */
  getOpenDelay?: () => number;
}

export function useSearchBarPopovers(config: UseSearchBarPopoversConfig = {}) {
  const {
    initialLocationDisplay = '',
    initialDates,
    initialGuests,
    onPopoverClosing,
    onDateAutoAdvance,
    getOpenDelay,
  } = config;

  // --- State ---
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [selectedLocation, setSelectedLocation] = useState<SuggestedLocation | null>(null);
  const [locationDisplayValue, setLocationDisplayValue] = useState(initialLocationDisplay);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(
    () => initialDates ?? { start: null, end: null }
  );
  const [guests, setGuests] = useState(
    () => initialGuests ?? { adults: 1, children: 0, pets: 0 }
  );
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [loadingRecentSearchId, setLoadingRecentSearchId] = useState<string | null>(null);

  // --- Refs ---
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activePopoverRef = useRef<ActivePopover>(null);

  // Keep ref in sync so callbacks don't have stale closures
  useEffect(() => { activePopoverRef.current = activePopover; }, [activePopover]);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current !== null) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  // --- Core panel controls ---

  const ensureMinimumAdult = useCallback(() => {
    setGuests(prev => prev.adults >= 1 ? prev : { ...prev, adults: 1 });
  }, []);

  const openPopover = useCallback((popover: ActivePopover) => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    if (activePopoverRef.current && activePopoverRef.current !== popover) {
      onPopoverClosing?.(activePopoverRef.current);
    }
    if (popover === 'who') ensureMinimumAdult();
    const delay = getOpenDelay?.() ?? 0;
    if (delay > 0) {
      expandTimeoutRef.current = setTimeout(() => {
        expandTimeoutRef.current = null;
        setActivePopover(popover);
      }, delay);
    } else {
      setActivePopover(popover);
    }
  }, [getOpenDelay, onPopoverClosing, ensureMinimumAdult]);

  const closePopover = useCallback(() => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    if (activePopoverRef.current) onPopoverClosing?.(activePopoverRef.current);
    setActivePopover(null);
  }, [onPopoverClosing]);

  const togglePopover = useCallback((popover: ActivePopover) => {
    activePopoverRef.current === popover ? closePopover() : openPopover(popover);
  }, [openPopover, closePopover]);

  const closeAllPopovers = useCallback(() => {
    if (expandTimeoutRef.current !== null) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    setActivePopover(null);
  }, []);

  // --- Escape key ---
  useEffect(() => {
    if (!activePopover) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopover(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activePopover, closePopover]);

  // --- Handlers ---

  const handleLocationSelect = useCallback((location: SuggestedLocation | null) => {
    setSelectedLocation(location);
    if (location?.lat && location?.lng) {
      openPopover('when');
    }
  }, [openPopover]);

  const handleSuggestedLocationClick = useCallback(async (title: string) => {
    const locationName = title.replace(/^Monthly Rentals in\s*/i, '');
    setLocationDisplayValue(locationName);
    openPopover('when');

    // TODO: Add a fallback geocoding method (e.g. pre-cached coords for suggested
    // locations, or a local geocode lookup) so we don't silently lose the location
    // if this fetch fails after we've already advanced the panel.
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(locationName)}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setSelectedLocation({ description: locationName, lat, lng });
      }
    } catch {
      // Geocode failed — location will be missing lat/lng at submit time
    }
  }, [openPopover]);

  const handleRecentSearchClick = useCallback((tripId: string) => {
    setLoadingRecentSearchId(tripId);
    setTimeout(() => setLoadingRecentSearchId(null), 3000);
    window.location.href = buildSearchUrl({ tripId });
  }, []);

  const handleDateChange = useCallback((start: Date | null, end: Date | null) => {
    const hadEnd = dateRange.end !== null;
    const newDates = { start, end };
    setDateRange(newDates);

    if (!hadEnd && start !== null && end !== null) {
      onDateAutoAdvance?.(newDates);
      openPopover('who');
    }
  }, [dateRange.end, onDateAutoAdvance, openPopover]);

  return {
    // State
    activePopover,
    selectedLocation,
    locationDisplayValue,
    dateRange,
    guests,
    isTypingLocation,
    isGeocoding,
    loadingRecentSearchId,

    // Setters
    setActivePopover,
    setSelectedLocation,
    setLocationDisplayValue,
    setDateRange,
    setGuests,
    setIsTypingLocation,
    setIsGeocoding,

    // Handlers
    openPopover,
    closePopover,
    togglePopover,
    handleLocationSelect,
    handleSuggestedLocationClick,
    handleRecentSearchClick,
    handleDateChange,
    closeAllPopovers,
  };
}
