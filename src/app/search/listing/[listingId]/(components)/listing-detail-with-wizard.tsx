'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingAndImages } from '@/types';
import PublicListingDetailsView from '@/app/guest/listing/[listingId]/(components)/public-listing-details-view';
import ApplicationWizard from './application-wizard';
import { calculateRent } from '@/lib/calculate-rent';
import { Trip } from '@prisma/client';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WizardState = 'listing' | 'application' | 'success';

interface ListingDetailWithWizardProps {
  listing: ListingAndImages;
  locationString: string;
  isAuthenticated: boolean;
  tripContext: {
    tripId?: string;
    startDate: Date;
    endDate: Date;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  } | null;
  calculatedPrice: number | null;
  listingState: { hasApplied: boolean; isMatched: boolean } | null;
  userApplication: any;
  shouldAutoApply?: boolean;
}

export default function ListingDetailWithWizard({
  listing,
  locationString,
  isAuthenticated,
  tripContext: initialTripContext,
  calculatedPrice: initialCalculatedPrice,
  listingState: initialListingState,
  userApplication,
  shouldAutoApply,
}: ListingDetailWithWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>('listing');
  const [collectedDates, setCollectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [collectedGuests, setCollectedGuests] = useState<{ adults: number; children: number; pets: number } | null>(null);
  const [hasAppliedLocal, setHasAppliedLocal] = useState(false);
  const hasTriedAutoApply = useRef(false);

  // Auto-apply effect: show application wizard on mount if shouldAutoApply is true
  useEffect(() => {
    if (hasTriedAutoApply.current || !shouldAutoApply) return;
    hasTriedAutoApply.current = true;
    setWizardState('application');
  }, [shouldAutoApply]);

  const effectiveTripContext = collectedDates
    ? {
        tripId: initialTripContext?.tripId,
        startDate: collectedDates.start,
        endDate: collectedDates.end,
        numAdults: collectedGuests?.adults ?? 1,
        numChildren: collectedGuests?.children ?? 0,
        numPets: collectedGuests?.pets ?? 0,
      }
    : initialTripContext;

  const effectivePrice = useCallback(() => {
    if (collectedDates) {
      const mockTrip = { startDate: collectedDates.start, endDate: collectedDates.end } as Trip;
      const listingWithPricing = { ...listing, monthlyPricing: listing.monthlyPricing || [] };
      return calculateRent({ listing: listingWithPricing, trip: mockTrip });
    }
    return initialCalculatedPrice;
  }, [collectedDates, listing, initialCalculatedPrice]);

  const effectiveListingState = hasAppliedLocal
    ? { hasApplied: true, isMatched: initialListingState?.isMatched ?? false }
    : initialListingState;

  const handleApplyClick = () => {
    if (!isAuthenticated) return;
    scrollToTopAndTransition('application');
  };

  const handleDatesSelected = (start: Date, end: Date, guests: { adults: number; children: number; pets: number }) => {
    setCollectedDates({ start, end });
    setCollectedGuests(guests);
  };

  const handleBackToListing = () => {
    scrollToTopAndTransition('listing');
  };

  const handleApplicationComplete = () => {
    setHasAppliedLocal(true);
    scrollToTopAndTransition('success');
  };

  const handleBackFromSuccess = () => {
    scrollToTopAndTransition('listing');
  };

  const scrollToTopAndTransition = (state: WizardState) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setWizardState(state);
  };

  return (
    <AnimatePresence mode="wait">
      {wizardState === 'listing' && (
        <motion.div
          key="listing"
          initial={false}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <PublicListingDetailsView
            listing={listing}
            locationString={locationString}
            isAuthenticated={isAuthenticated}
            tripContext={effectiveTripContext}
            calculatedPrice={effectivePrice()}
            listingState={effectiveListingState}
            onApplyClick={isAuthenticated ? handleApplyClick : undefined}
            onDatesSelected={handleDatesSelected}
          />
        </motion.div>
      )}

      {wizardState === 'application' && effectiveTripContext && (
        <motion.div
          key="application"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ApplicationWizard
            listing={listing}
            tripContext={effectiveTripContext}
            application={userApplication}
            onBack={handleBackToListing}
            onComplete={handleApplicationComplete}
          />
        </motion.div>
      )}

      {wizardState === 'success' && (
        <motion.div
          key="success"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-[#3c8787]" />
            <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins']">
              Application Submitted!
            </h2>
            <p className="text-gray-600 font-['Poppins'] max-w-md">
              Your application for <span className="font-medium">{listing.title}</span> has been
              submitted. The host will review it and get back to you.
            </p>
            <Button
              variant="outline"
              onClick={handleBackFromSuccess}
              className="border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white font-semibold px-8"
            >
              Back to Listing
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
