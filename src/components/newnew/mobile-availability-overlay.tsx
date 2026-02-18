'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import SearchDateRange from '@/components/newnew/search-date-range';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { AccordionCard } from '@/components/newnew/accordion-card';
import { formatDateDisplay, formatGuestDisplay } from '@/lib/search-display-utils';

type ActiveSection = 'when' | 'who' | null;

interface MobileAvailabilityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateChange: (start: Date | null, end: Date | null) => void;
  guests: { adults: number; children: number; pets: number };
  setGuests: React.Dispatch<React.SetStateAction<{ adults: number; children: number; pets: number }>>;
  onConfirm: () => void;
}

export default function MobileAvailabilityOverlay({
  isOpen,
  onClose,
  dateRange,
  onDateChange,
  guests,
  setGuests,
  onConfirm,
}: MobileAvailabilityOverlayProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('when');

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

  // Reset to "when" section each time overlay opens
  useEffect(() => {
    if (isOpen) {
      setActiveSection('when');
    }
  }, [isOpen]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    onDateChange(start, end);
    if (start && end) {
      setActiveSection('who');
      setGuests(prev => prev.adults >= 1 ? prev : { ...prev, adults: 1 });
    }
  };

  const dateSummary = formatDateDisplay(dateRange) || 'Add dates';
  const guestSummary = formatGuestDisplay(guests) || 'Add renters';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col md:hidden"
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
            <span className="text-sm font-semibold text-gray-900">Check Availability</span>
            <div className="w-9" />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-inherit">
            {/* WHEN card */}
            <AccordionCard
              icon={<Calendar className="w-4 h-4" />}
              title="When"
              summary={dateSummary}
              isExpanded={activeSection === 'when'}
              onToggle={() => setActiveSection(activeSection === 'when' ? null : 'when')}
            >
              <SearchDateRange
                start={dateRange.start}
                end={dateRange.end}
                handleChange={handleDateRangeChange}
                minimumDateRange={{ months: 1 }}
                singleMonth
                hideFlexibility
              />
            </AccordionCard>

            {/* WHO card */}
            <AccordionCard
              icon={<Users className="w-4 h-4" />}
              title="Who"
              summary={guestSummary}
              isExpanded={activeSection === 'who'}
              onToggle={() => {
                const opening = activeSection !== 'who';
                setActiveSection(opening ? 'who' : null);
                if (opening) {
                  setGuests(prev => prev.adults >= 1 ? prev : { ...prev, adults: 1 });
                }
              }}
            >
              <GuestTypeCounter guests={guests} setGuests={setGuests} />
            </AccordionCard>
          </div>

          {/* Bottom sticky bar */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-end bg-background">
            <Button
              className="bg-primaryBrand hover:bg-primaryBrand/90 text-white px-6 py-2 rounded-lg"
              onClick={onConfirm}
            >
              Done
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
