'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { MatchWithRelations } from '@/types';

interface BookingSummarySidebarProps {
  match: MatchWithRelations;
}

export function BookingSummarySidebar({ match }: BookingSummarySidebarProps) {
  // Debug logging to catch object rendering issues
  console.log('🔍 BookingSummarySidebar - match object:', match);
  console.log('🔍 BookingSummarySidebar - match.listing:', match.listing);
  console.log('🔍 BookingSummarySidebar - user name parts:', {
    firstName: match.listing.user?.firstName,
    lastName: match.listing.user?.lastName,
    firstNameType: typeof match.listing.user?.firstName,
    lastNameType: typeof match.listing.user?.lastName
  });
  console.log('🔍 BookingSummarySidebar - location string:', {
    value: match.listing.locationString,
    type: typeof match.listing.locationString
  });
  console.log('🔍 BookingSummarySidebar - rent amount:', {
    value: match.listing.rentDueAtBooking,
    type: typeof match.listing.rentDueAtBooking
  });

  return (
    <Card className="p-8 bg-[#e7f0f0] border-0 rounded-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col items-start gap-6">
          <h1 className="[font-family:'Poppins',Helvetica] font-bold text-black text-[28px] tracking-[0] leading-[33.6px]">
            BOOKING SUMMARY
          </h1>

          <div className="flex flex-col items-start gap-5 w-full">
            <div className="inline-flex flex-col items-start justify-center gap-3">
              <div className="w-[140px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base tracking-[0] leading-[19.2px]">
                Host Name:
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                {(() => {
                  const hostName = `${match.listing.user?.firstName || ''} ${match.listing.user?.lastName || ''}`.trim() || 'Host';
                  console.log('🔍 Rendering hostName:', { hostName, type: typeof hostName });
                  return hostName;
                })()}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 w-full">
              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base tracking-[0] leading-[19.2px] whitespace-nowrap">
                Property Address:
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-lg tracking-[0] leading-[21.6px]">
                {(() => {
                  const propertyAddress = match.listing.locationString || 'Property Address';
                  console.log('🔍 Rendering propertyAddress:', { propertyAddress, type: typeof propertyAddress });
                  return propertyAddress;
                })()}
              </div>
            </div>

            <div className="inline-flex flex-col items-start justify-center gap-3">
              <div className="w-[140px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base tracking-[0] leading-[19.2px]">
                Start Date:
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                {(() => {
                  const startDate = match.moveInDate ? new Date(match.moveInDate).toLocaleDateString() : 'TBD';
                  console.log('🔍 Rendering startDate:', { startDate, type: typeof startDate, moveInDate: match.moveInDate });
                  return startDate;
                })()}
              </div>
            </div>

            <div className="inline-flex flex-col items-start justify-center gap-3">
              <div className="w-[140px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base tracking-[0] leading-[19.2px]">
                End Date:
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                {match.moveOutDate ? new Date(match.moveOutDate).toLocaleDateString() : 'TBD'}
              </div>
            </div>

            <div className="flex flex-col w-[414px] items-start gap-3">
              <div className="w-[140px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base tracking-[0] leading-[19.2px]">
                Guests:
              </div>
              <div className="flex flex-wrap w-[378px] items-center gap-4">
                <div className="inline-flex items-start gap-1.5">
                  <div className="w-5 h-5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-sm tracking-[0] leading-[16.8px]">
                    1 Adult
                  </div>
                </div>
              </div>
            </div>

            <Collapsible className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between px-4 py-3 w-full bg-white rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-[#373940] text-sm tracking-[0] leading-[21px] whitespace-nowrap">
                    Recent Payments
                  </div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent></CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 w-full border-b border-[#8fbaba]">
              <div className="flex items-end justify-between w-full">
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                  Monthly Rent
                </div>
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  <span className="font-semibold">${(match.listing.rentDueAtBooking || 0).toFixed(0)}/</span>
                  <span className="font-semibold text-xs leading-[14.4px]">
                    month
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between w-full">
              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Total Payable Rent
              </div>
              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                <span className="font-semibold">
                  ${(match.listing.rentDueAtBooking || 0).toFixed(0)}/
                </span>
                <span className="font-semibold text-xs leading-[14.4px]">
                  month
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}