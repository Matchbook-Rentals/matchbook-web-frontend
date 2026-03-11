'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star as StarIcon, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerifiedIcon } from '@/components/icons-v3';
import { BrandButton } from '@/components/ui/brandButton';
import { format } from 'date-fns';
import MobileAvailabilityOverlay from '@/components/newnew/mobile-availability-overlay';
import { useRenterListingActionBox } from './renter-listing-action-box-context';

export default function PublicMobileBookingCard() {
  const { state, actions, listing } = useRenterListingActionBox();
  const host = listing.user;
  const totalRenters = state.totalRenters;

  const getApplyButtonText = () => {
    if (state.isMatched) return 'Matched';
    if (state.hasApplied) return 'Applied';
    return 'Apply Now';
  };

  const isApplyButtonDisabled = state.hasApplied || state.isMatched || state.isApplying;

  return (
    <Card className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
      <CardContent className="flex flex-col items-start gap-5 py-4 px-0">
        {/* Trip summary - taps open the overlay */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={actions.openMobileOverlay}
            className="w-full border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex divide-x divide-gray-300 rounded-t-xl">
              <div className="flex-1 px-4 py-3">
                <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-In</div>
                <div className={`text-sm font-['Poppins'] ${state.startDate ? 'text-[#373940]' : 'text-gray-400'}`}>
                  {state.startDate ? format(state.startDate, 'MMM d, yyyy') : 'Add Date'}
                </div>
              </div>
              <div className="flex-1 px-4 py-3">
                <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Move-Out</div>
                <div className={`text-sm font-['Poppins'] ${state.endDate ? 'text-[#373940]' : 'text-gray-400'}`}>
                  {state.endDate ? format(state.endDate, 'MMM d, yyyy') : 'Add Date'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 rounded-b-xl">
              <div>
                <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Renters</div>
                <div className={`text-sm font-['Poppins'] ${totalRenters > 0 ? 'text-[#373940]' : 'text-gray-400'}`}>
                  {totalRenters === 0 && state.guests.pets === 0
                    ? 'Add Renters'
                    : `${totalRenters} renter${totalRenters !== 1 ? 's' : ''}${state.guests.pets > 0 ? `, ${state.guests.pets} pet${state.guests.pets !== 1 ? 's' : ''}` : ''}`}
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </button>

          {/* Apply button - visible when both dates and renters are filled */}
          {state.hasDates && state.hasRenterInfo && (
            <BrandButton
              variant={state.hasApplied || state.isMatched ? "secondary" : "default"}
              className={`w-full min-w-0 font-semibold transition-colors ${
                state.hasApplied || state.isMatched
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : ''
              }`}
              onClick={actions.handleApplyClick}
              disabled={isApplyButtonDisabled}
            >
              {state.isApplying ? 'Applying...' : getApplyButtonText()}
            </BrandButton>
          )}

          {/* Error message */}
          {state.applyError && (
            <div className="text-red-500 text-sm font-['Poppins']">
              {state.applyError}
            </div>
          )}
        </div>

        <MobileAvailabilityOverlay
          isOpen={state.showMobileOverlay}
          onClose={actions.closeMobileOverlay}
          dateRange={{ start: state.startDate, end: state.endDate }}
          onDateChange={actions.setDates}
          guests={state.guests}
          setGuests={actions.setGuests}
          onConfirm={actions.closeMobileOverlay}
          unavailablePeriods={state.unavailablePeriods}
        />
      </CardContent>
    </Card>
  );
}
