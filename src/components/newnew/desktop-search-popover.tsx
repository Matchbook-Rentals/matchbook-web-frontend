'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Building2 } from 'lucide-react';
import HeroLocationSuggest from '@/components/home-components/HeroLocationSuggest';
import SearchDateRange from '@/components/newnew/search-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { ImSpinner8 } from 'react-icons/im';
import type { ActivePopover } from '@/hooks/useSearchBarPopovers';
import type { useSearchBarPopovers } from '@/hooks/useSearchBarPopovers';
import type { RecentSearch, SuggestedLocationItem } from './search-navbar';

// ─── Config ──────────────────────────────────────────────────────────

const PANEL_CONFIG = {
  where: { width: 402, align: 0 },
  when: { width: 860, align: 0.5 },
  who: { width: 320, align: 1 },
} as const;

const CONTAINER_EASE = [0.4, 0, 0.2, 1] as const;
const CONTAINER_DURATION = 0.25;
const FADE_DURATION = 0.12;
const ENTER_EXIT_DURATION = 0.15;

// ─── Types ───────────────────────────────────────────────────────────

interface DesktopSearchPopoverProps {
  activePopover: ActivePopover;
  search: ReturnType<typeof useSearchBarPopovers>;
  recentSearches: RecentSearch[];
  suggestedLocations: SuggestedLocationItem[];
  containerWidth?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const computePanelLeft = (panel: 'where' | 'when' | 'who', containerWidth: number) =>
  PANEL_CONFIG[panel].align * (containerWidth - PANEL_CONFIG[panel].width);

// ─── Panel Sub-Components ────────────────────────────────────────────

interface WherePanelProps {
  search: ReturnType<typeof useSearchBarPopovers>;
  recentSearches: RecentSearch[];
  suggestedLocations: SuggestedLocationItem[];
}

const WherePanel = ({ search, recentSearches, suggestedLocations }: WherePanelProps) => (
  <div className="p-6 flex flex-col gap-6">
    <HeroLocationSuggest
      hasAccess={true}
      autoFocus={true}
      onLocationSelect={search.handleLocationSelect}
      onInputChange={(value) => search.setIsTypingLocation(value.length > 0)}
      onGeocodingStateChange={search.setIsGeocoding}
      showLocationIcon={true}
      setDisplayValue={search.setLocationDisplayValue}
      contentClassName="p-0"
      placeholder={
        search.selectedLocation?.description
          ? 'Wrong place? Begin typing and select another'
          : 'Enter an address or city'
      }
    />

    {!search.isTypingLocation && (
      <>
        <RecentSearchesList search={search} recentSearches={recentSearches} />
        <SuggestedLocationsList
          search={search}
          recentSearches={recentSearches}
          suggestedLocations={suggestedLocations}
        />
      </>
    )}
  </div>
);

const RecentSearchesList = ({
  search,
  recentSearches,
}: {
  search: ReturnType<typeof useSearchBarPopovers>;
  recentSearches: RecentSearch[];
}) => {
  if (recentSearches.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="px-3.5">
        <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">Recent Searches</h3>
      </div>
      {recentSearches.slice(0, 3).map((recentSearch, index) => (
        <button
          key={`recent-${index}`}
          className="flex flex-col gap-1.5 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-left"
          onClick={() => search.handleRecentSearchClick(recentSearch.tripId)}
          disabled={search.loadingRecentSearchId === recentSearch.tripId}
        >
          <div className="flex items-center gap-2.5">
            {search.loadingRecentSearchId === recentSearch.tripId ? (
              <ImSpinner8 className="w-5 h-5 text-gray-500 animate-spin" />
            ) : (
              <Clock className="w-5 h-5 text-gray-500" />
            )}
            <span className="font-medium text-[#0d1b2a] text-sm leading-5">
              {recentSearch.location}
            </span>
          </div>
          <span className="ml-[30px] text-xs text-gray-400">{recentSearch.details}</span>
        </button>
      ))}
    </div>
  );
};

const SuggestedLocationsList = ({
  search,
  recentSearches,
  suggestedLocations,
}: {
  search: ReturnType<typeof useSearchBarPopovers>;
  recentSearches: RecentSearch[];
  suggestedLocations: SuggestedLocationItem[];
}) => {
  const recentCount = Math.min(recentSearches.length, 3);
  const suggestedCount = Math.max(0, 5 - recentCount);
  const visibleSuggestions = suggestedLocations.slice(0, suggestedCount);

  if (visibleSuggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="px-3.5">
        <h3 className="font-normal text-[#0d1b2a] text-xs leading-5">Suggested</h3>
      </div>
      {visibleSuggestions.map((location, index) => (
        <button
          key={`suggested-${index}`}
          className="flex items-center gap-2.5 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-left"
          onClick={() => search.handleSuggestedLocationClick(location.title)}
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
  );
};

interface WhenPanelProps {
  search: ReturnType<typeof useSearchBarPopovers>;
}

const WhenPanel = ({ search }: WhenPanelProps) => (
  <SearchDateRange
    start={search.dateRange.start}
    end={search.dateRange.end}
    handleChange={search.handleDateChange}
    minimumDateRange={{ months: 1 }}
    maximumDateRange={{ months: 12 }}
  />
);

interface WhoPanelProps {
  search: ReturnType<typeof useSearchBarPopovers>;
}

const WhoPanel = ({ search }: WhoPanelProps) => (
  <GuestTypeCounter guests={search.guests} setGuests={search.setGuests} />
);

// ─── Main Component ──────────────────────────────────────────────────

export default function DesktopSearchPopover({
  activePopover,
  search,
  recentSearches,
  suggestedLocations,
  containerWidth = 860,
}: DesktopSearchPopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const measureHeight = useCallback(() => {
    if (!contentRef.current) return;
    setMeasuredHeight(contentRef.current.scrollHeight);
  }, []);

  // Measure height when panel changes or content renders
  useEffect(() => {
    measureHeight();
  }, [activePopover, measureHeight]);

  // Use ResizeObserver to track content height changes
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => measureHeight());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureHeight]);

  const panelKey = activePopover as 'where' | 'when' | 'who';

  const panelWidth = activePopover ? PANEL_CONFIG[panelKey].width : 0;
  const panelLeft = activePopover ? computePanelLeft(panelKey, containerWidth) : 0;

  return (
    <AnimatePresence>
      {activePopover && (
        <motion.div
          key="search-popover-wrapper"
          className="relative pointer-events-auto hidden md:block"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, height: measuredHeight }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: ENTER_EXIT_DURATION }}
        >
          <motion.div
            className="absolute top-0 bg-white rounded-lg shadow-md border border-[#e9e9eb] overflow-hidden"
            animate={{ width: panelWidth, left: panelLeft }}
            transition={{
              duration: CONTAINER_DURATION,
              ease: CONTAINER_EASE as unknown as number[],
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activePopover}
                ref={contentRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_DURATION }}
              >
                {activePopover === 'where' && (
                  <WherePanel
                    search={search}
                    recentSearches={recentSearches}
                    suggestedLocations={suggestedLocations}
                  />
                )}
                {activePopover === 'when' && <WhenPanel search={search} />}
                {activePopover === 'who' && <WhoPanel search={search} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
