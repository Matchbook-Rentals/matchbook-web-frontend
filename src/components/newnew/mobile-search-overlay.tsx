'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, MapPin, Calendar, Users, SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import SearchDateRange from '@/components/newnew/search-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { SuggestedLocation } from '@/types';
import { ImSpinner8 } from 'react-icons/im';
import { RecentSearch, SuggestedLocationItem } from './search-navbar';
import { Clock, Building2 } from 'lucide-react';
import { buildSearchUrl } from '@/app/search/search-page-client';

type ActiveSection = 'where' | 'when' | 'who' | null;

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isGeocoding: boolean;
  // Location
  selectedLocation: SuggestedLocation | null;
  locationDisplayValue: string;
  setLocationDisplayValue: (value: string) => void;
  onLocationSelect: (location: SuggestedLocation | null) => void;
  onGeocodingStateChange: (isGeocoding: boolean) => void;
  onSuggestedLocationClick: (title: string) => void;
  // Dates
  dateRange: { start: Date | null; end: Date | null };
  onDateChange: (start: Date | null, end: Date | null) => void;
  // Guests
  guests: { adults: number; children: number; pets: number };
  setGuests: React.Dispatch<React.SetStateAction<{ adults: number; children: number; pets: number }>>;
  // Lists
  recentSearches: RecentSearch[];
  suggestedLocations: SuggestedLocationItem[];
}

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isGeocoding,
  selectedLocation,
  locationDisplayValue,
  setLocationDisplayValue,
  onLocationSelect,
  onGeocodingStateChange,
  onSuggestedLocationClick,
  dateRange,
  onDateChange,
  guests,
  setGuests,
  recentSearches,
  suggestedLocations,
}: MobileSearchOverlayProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('where');
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [loadingRecentSearchId, setLoadingRecentSearchId] = useState<string | null>(null);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset active section when overlay opens
  useEffect(() => {
    if (isOpen) {
      setActiveSection('where');
    }
  }, [isOpen]);

  const handleLocationSelected = (location: SuggestedLocation | null) => {
    onLocationSelect(location);
    if (location?.lat && location?.lng) {
      setActiveSection('when');
    }
  };

  const handleSuggestedClick = (title: string) => {
    onSuggestedLocationClick(title);
    setActiveSection('when');
  };

  const handleRecentSearchClick = (tripId: string) => {
    setLoadingRecentSearchId(tripId);
    setTimeout(() => setLoadingRecentSearchId(null), 3000);
    window.location.href = buildSearchUrl({ tripId });
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    onDateChange(start, end);
    if (start && end) {
      setActiveSection('who');
    }
  };

  const handleClearAll = () => {
    onLocationSelect(null);
    setLocationDisplayValue('');
    onDateChange(null, null);
    setGuests({ adults: 1, children: 0, pets: 0 });
    setActiveSection('where');
  };

  const formatDateSummary = () => {
    if (!dateRange.start && !dateRange.end) return 'Add dates';
    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    if (dateRange.start && dateRange.end) return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
    if (dateRange.start) return `${fmt(dateRange.start)} – ...`;
    return 'Add dates';
  };

  const formatGuestSummary = () => {
    const renters = guests.adults + guests.children;
    const total = renters + guests.pets;
    if (total <= 1) return 'Add renters';
    const parts: string[] = [];
    if (renters > 0) parts.push(`${renters} Renter${renters !== 1 ? 's' : ''}`);
    if (guests.pets > 0) parts.push(`${guests.pets} Pet${guests.pets !== 1 ? 's' : ''}`);
    return parts.join(' and ');
  };

  const handleSearchClick = () => {
    onSubmit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-white/40 flex flex-col md:hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-background">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-sm font-semibold text-gray-900">Search</span>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-inherit">
            {/* WHERE card */}
            <AccordionCard
              icon={<MapPin className="w-4 h-4" />}
              title="Where"
              summary={locationDisplayValue || 'Choose location'}
              isExpanded={activeSection === 'where'}
              onToggle={() => setActiveSection(activeSection === 'where' ? null : 'where')}
            >
              <div className="flex flex-col gap-4">
                <HeroLocationSuggest
                  hasAccess={true}
                  onLocationSelect={handleLocationSelected}
                  onInputChange={(value) => setIsTypingLocation(value.length > 0)}
                  onGeocodingStateChange={onGeocodingStateChange}
                  showLocationIcon={true}
                  setDisplayValue={setLocationDisplayValue}
                  contentClassName="p-0"
                  autoFocus={false}
                  placeholder={
                    selectedLocation?.description
                      ? 'Wrong place? Begin typing and select another'
                      : 'Enter an address or city'
                  }
                />

                {!isTypingLocation && (
                  <>
                    {/* Recent Searches - max 3 on mobile */}
                    {recentSearches.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="font-normal text-[#0d1b2a] text-xs leading-5 px-1">
                          Recent Searches
                        </h3>
                        {recentSearches.slice(0, 3).map((search, index) => (
                          <button
                            key={`recent-mobile-${index}`}
                            className="flex flex-col gap-1 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            onClick={() => handleRecentSearchClick(search.tripId)}
                            disabled={loadingRecentSearchId === search.tripId}
                          >
                            <div className="flex items-center gap-2">
                              {loadingRecentSearchId === search.tripId ? (
                                <ImSpinner8 className="w-4 h-4 text-gray-500 animate-spin" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-medium text-[#0d1b2a] text-sm">
                                {search.location}
                              </span>
                            </div>
                            <span className="ml-6 text-xs text-gray-400">{search.details}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested - show (3 - recentSearches count) items on mobile */}
                    {(() => {
                      const recentCount = Math.min(recentSearches.length, 3);
                      const suggestedCount = Math.max(0, 3 - recentCount);
                      const visibleSuggestions = suggestedLocations.slice(0, suggestedCount);

                      return visibleSuggestions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          <h3 className="font-normal text-[#0d1b2a] text-xs leading-5 px-1">
                            Suggested
                          </h3>
                          {visibleSuggestions.map((location, index) => (
                            <button
                              key={`suggested-mobile-${index}`}
                              className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                              onClick={() => handleSuggestedClick(location.title)}
                            >
                              <div className="flex w-[48px] h-[48px] items-center justify-center bg-white rounded-lg border border-[#eaecf0] shadow-sm flex-shrink-0">
                                <Building2 className="w-5 h-5 text-gray-500" />
                              </div>
                              <span className="font-medium text-[#0d1b2a] text-sm">
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
            </AccordionCard>

            {/* WHEN card */}
            <AccordionCard
              icon={<Calendar className="w-4 h-4" />}
              title="When"
              summary={formatDateSummary()}
              isExpanded={activeSection === 'when'}
              onToggle={() => setActiveSection(activeSection === 'when' ? null : 'when')}
            >
              <SearchDateRange
                start={dateRange.start}
                end={dateRange.end}
                handleChange={handleDateRangeChange}
                minimumDateRange={{ months: 1 }}
                maximumDateRange={{ months: 12 }}
                singleMonth
              />
            </AccordionCard>

            {/* WHO card */}
            <AccordionCard
              icon={<Users className="w-4 h-4" />}
              title="Who"
              summary={formatGuestSummary()}
              isExpanded={activeSection === 'who'}
              onToggle={() => setActiveSection(activeSection === 'who' ? null : 'who')}
            >
              <GuestTypeCounter guests={guests} setGuests={setGuests} />
            </AccordionCard>
          </div>

          {/* Bottom sticky bar */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-end bg-background">
            <Button
              className="bg-primaryBrand hover:bg-primaryBrand/90 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              onClick={handleSearchClick}
              disabled={isSubmitting || isGeocoding}
            >
              Search
              {isSubmitting || isGeocoding ? (
                <ImSpinner8 className="animate-spin w-4 h-4" />
              ) : (
                <SearchIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AccordionCardProps {
  icon: React.ReactNode;
  title: string;
  summary: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionCard({ icon, title, summary, isExpanded, onToggle, children }: AccordionCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-md overflow-hidden bg-background drop-shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-500">{icon}</div>
          <div className="text-left">
            <div className="text-xs font-medium text-gray-500">{title}</div>
            {!isExpanded && (
              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {summary}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
