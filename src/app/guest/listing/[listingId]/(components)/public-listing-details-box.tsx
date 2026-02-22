'use client'
import React, { useState, useEffect } from 'react';
import { StarIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/ui/brandButton';

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import SearchDateRange from '@/components/newnew/search-date-range';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { VerifiedIcon } from '@/components/icons-v3';
import GuestTypeCounter from '@/components/home-components/GuestTypeCounter';
import { useRenterListingActionBox } from './renter-listing-action-box-context';

const PublicListingDetailsBox: React.FC = () => {
  const { state, actions, listing } = useRenterListingActionBox();
  const host = listing.user;

  const [isLargeScreen, setIsLargeScreen] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getApplyButtonText = () => {
    if (state.isMatched) return 'Matched';
    if (state.hasApplied) return 'Applied';
    return 'Apply Now';
  };

  const isApplyButtonDisabled = state.hasApplied || state.isMatched || state.isApplying;

  return (
    <Card className="w-full border border-[#0000001a] rounded-xl">
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Verified badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
        >
          <VerifiedIcon className="w-[21px] h-[21px]" />
          <span className="font-normal text-xs text-[#0B6E6E] font-['Poppins'] leading-normal">
            Verified Host
          </span>
        </Badge>

        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage
              src={host?.imageUrl || ''}
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-[#3c8787] text-white font-medium text-xl">
              {((host?.firstName?.charAt(0) || '') + (host?.lastName?.charAt(0) || '')) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm font-['Poppins']">
              Hosted by {host?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="h-5 w-5 text-[#FFD700] fill-[#FFD700]" />
              <span className="font-normal text-[#717680] text-sm font-['Poppins']">
                {listing?.averageRating
                  ? `${listing.averageRating.toFixed(1)} (${listing?.numberOfStays || 0})`
                  : `Be ${host?.firstName || 'Host'}'s first booking`}
              </span>
            </div>
          </div>
        </div>

        <Separator className="w-full" />

        {/* Pricing information */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
              {state.calculatedPrice
                ? `$${state.calculatedPrice.toLocaleString()}`
                : state.priceRange.hasRange
                  ? `$${state.priceRange.min.toLocaleString()} - $${state.priceRange.max.toLocaleString()}`
                  : `$${state.priceRange.min.toLocaleString()}`
              }
            </div>
            <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Month</div>
          </div>

          {listing.depositSize && (
            <div className="flex flex-col gap-1 items-end">
              <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
                ${listing.depositSize?.toLocaleString()}
              </div>
              <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Deposit</div>
            </div>
          )}
        </div>

        {/* Error message */}
        {state.applyError && (
          <div className="text-red-500 text-sm font-['Poppins']">
            {state.applyError}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2 w-full mt-1">
            <div className="w-full border border-gray-300 rounded-xl">
              {/* Dates Section */}
              <Popover open={state.showDatesPopover} onOpenChange={(open) => open ? actions.openDatesPopover() : actions.closeDatesPopover()}>
                <PopoverTrigger asChild>
                  <div className="flex divide-x divide-gray-300 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl">
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
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-4 shadow-xl"
                  side="left"
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="flex flex-col gap-3">
                    <SearchDateRange
                      start={state.startDate}
                      end={state.endDate}
                      handleChange={actions.setDates}
                      minimumDateRange={{ months: 1 }}
                      singleMonth={!isLargeScreen}
                      hideFlexibility
                      unavailablePeriods={state.unavailablePeriods}
                    />
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 mt-2">
                      <button
                        type="button"
                        onClick={actions.clearDates}
                        className="text-sm font-medium text-[#2A7F7A] hover:text-[#236663] underline"
                      >
                        Clear dates
                      </button>
                      <Button
                        onClick={actions.confirmDates}
                        disabled={!state.startDate || !state.endDate}
                        className="px-6 bg-[#2A7F7A] hover:bg-[#236663] text-white font-medium rounded-lg"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Renters Section */}
              <Popover open={state.showRentersPopover} onOpenChange={(open) => open ? actions.openRentersPopover() : actions.closeRentersPopover()}>
                <PopoverTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors rounded-b-xl">
                    <div>
                      <div className="font-semibold text-sm text-[#373940] font-['Poppins']">Renters</div>
                      <div className={`text-sm font-['Poppins'] ${state.totalRenters > 0 ? 'text-[#373940]' : 'text-gray-400'}`}>
                        {state.totalRenters === 0 && state.guests.pets === 0
                          ? 'Add Renters'
                          : `${state.totalRenters} renter${state.totalRenters !== 1 ? 's' : ''}${state.guests.pets > 0 ? `, ${state.guests.pets} pet${state.guests.pets !== 1 ? 's' : ''}` : ''}`}
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-4 shadow-xl"
                  side="bottom"
                  align="start"
                  alignOffset={-50}
                  sideOffset={-50}
                >
                  <div className="flex flex-col gap-3">
                    <div className="min-w-[280px]">
                      <h3 className="font-semibold text-[#373940] font-['Poppins'] mb-2">Who&apos;s coming?</h3>
                      <GuestTypeCounter guests={state.guests} setGuests={actions.setGuests} />
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 mt-2">
                      <button
                        type="button"
                        onClick={actions.clearGuests}
                        className="text-sm font-medium text-[#2A7F7A] hover:text-[#236663] underline"
                      >
                        Clear
                      </button>
                      <Button
                        onClick={actions.confirmRenters}
                        disabled={state.guests.adults < 1}
                        className="px-6 bg-[#2A7F7A] hover:bg-[#236663] text-white font-medium rounded-lg"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

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

            <BrandButton
              variant="ghost"
              className="w-full min-w-0 text-[#3c8787] font-medium hover:bg-[#3c8787]/10"
              onClick={actions.handleMessageHost}
              disabled={state.isApplying}
            >
              Message Host
            </BrandButton>
          </div>
      </CardContent>
    </Card>
  );
};

export default PublicListingDetailsBox;
