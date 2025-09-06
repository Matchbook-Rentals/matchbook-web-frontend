'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Home, Calendar, MapPinIcon, ChevronDownIcon } from 'lucide-react';
import { MatchWithRelations } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { PaymentDetails } from '@/lib/calculate-payments';

interface BookingSummarySidebarProps {
  match: MatchWithRelations;
  paymentBreakdown: {
    proRatedRent: number;
    securityDeposit: number;
    applicationFee: number;
    processingFee: number;
    total: number;
  };
  paymentDetails?: PaymentDetails;
}

export function BookingSummarySidebar({ match, paymentBreakdown, paymentDetails }: BookingSummarySidebarProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate the actual monthly rent based on length of stay
  const getMonthlyRent = () => {
    const calculatedRent = calculateRent({ 
      listing: match.listing, 
      trip: match.trip 
    });
    
    // Use calculated rent if valid, otherwise fall back to match.monthlyRent or 0
    if (calculatedRent && calculatedRent !== 77777) {
      return calculatedRent;
    }
    return match.monthlyRent || 0;
  };

  // Get bedroom count from bedrooms relation array length
  const bedroomCount = match.listing.bedrooms?.length || match.listing.roomCount || 0;
  // Get bathroom count from bathroomCount field
  const bathroomCount = match.listing.bathroomCount || 0;

  const guestDetails = [
    { icon: Home, label: `${bedroomCount} bed` },
    { icon: Home, label: `${bathroomCount} bath` },
    { icon: Calendar, label: `${Math.ceil((new Date(match.trip.endDate).getTime() - new Date(match.trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` }
  ];

  // Build rent breakdown items - show all items including pet rent
  const rentBreakdownItems = [];
  
  // Use paymentDetails if available, otherwise fall back to getMonthlyRent
  if (paymentDetails) {
    rentBreakdownItems.push(
      { label: 'Base rent', amount: `$${paymentDetails.monthlyRent.toFixed(2)}` },
      { 
        label: match.trip.numPets > 0 
          ? `Pet rent (${match.trip.numPets} pet${match.trip.numPets > 1 ? 's' : ''})` 
          : 'Pet rent',
        amount: `$${paymentDetails.monthlyPetRent.toFixed(2)}` 
      }
    );
  } else {
    rentBreakdownItems.push(
      { label: 'Base rent', amount: `$${getMonthlyRent().toFixed(2)}` },
      { label: 'Pet rent', amount: '$0.00' }
    );
  }
  
  // Add utilities and parking status
  const utilitiesStatus = paymentDetails 
    ? (paymentDetails.utilitiesIncluded ? 'Included' : 'Not included')
    : (match.listing.utilitiesIncluded ? 'Included' : 'Not included');
    
  rentBreakdownItems.push(
    { label: 'Utilities', amount: utilitiesStatus },
    { label: 'Parking', amount: match.listing.parking ? 'Included' : 'Not included' }
  );

  // Build deposit breakdown items - show all items including pet deposit
  const depositBreakdownItems = [];
  
  if (paymentDetails) {
    depositBreakdownItems.push(
      { label: 'Security deposit', amount: `$${paymentDetails.securityDeposit.toFixed(2)}` },
      { 
        label: match.trip.numPets > 0 
          ? `Pet deposit (${match.trip.numPets} pet${match.trip.numPets > 1 ? 's' : ''})` 
          : 'Pet deposit',
        amount: `$${paymentDetails.petDeposit.toFixed(2)}` 
      }
    );
  } else {
    depositBreakdownItems.push(
      { label: 'Security deposit', amount: `$${paymentBreakdown.securityDeposit.toFixed(2)}` },
      { label: 'Pet deposit', amount: '$0.00' }
    );
  }
  
  depositBreakdownItems.push({ label: 'Refundable', amount: 'Yes' });

  return (
    <div className="flex w-[410px] items-center gap-2.5 p-8 relative bg-[#e7f0f0] rounded-lg overflow-hidden">
      <div className="flex flex-col w-[347px] items-start gap-6 relative mr-[-1.00px]">
        <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-blackblack-500 text-[28px] tracking-[0] leading-[33.6px]">
          Booking Summary
        </h1>

        <Card 
          className="flex flex-col h-[365px] items-end justify-end gap-[263px] pt-4 pb-0 px-0 relative self-stretch w-full rounded-xl border-0"
          style={{
            backgroundImage: `url(${match.listing.listingImages?.[0]?.url || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: '50% 50%'
          }}
        >
          <CardContent className="flex flex-col items-start gap-3 p-5 relative self-stretch w-full flex-[0_0_auto] bg-[#0000004c] rounded-[0px_0px_12px_12px] backdrop-blur-md backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(12px)_brightness(100%)]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                  <h2 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-white text-lg tracking-[0] leading-[normal]">
                    Hosted By {match.listing.user?.firstName || 'Host'}
                  </h2>
                </div>
              </div>

              <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <MapPinIcon className="relative w-5 h-5 text-[#f3f3f5]" />
                <div className="relative flex-1 mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#f3f3f5] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                  {match.listing.locationString || 'Austin, TX'}
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between pl-0 pr-3 py-0 relative self-stretch w-full flex-[0_0_auto]">
              <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#e6e6e6] text-xs tracking-[0] leading-[14.4px] whitespace-nowrap">
                Move-In: <span className="ml-1 [font-family:'Poppins',Helvetica] font-medium text-white text-sm tracking-[0] leading-[16.8px]">{formatDate(match.trip.startDate)}</span>
              </p>

              <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#e6e6e6] text-xs tracking-[0] leading-[14.4px] whitespace-nowrap">
                Move-Out: <span className="ml-1 [font-family:'Poppins',Helvetica] font-medium text-white text-sm tracking-[0] leading-[16.8px]">{formatDate(match.trip.endDate)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-[16px_32px] pl-0 pr-5 py-0 relative self-stretch w-full flex-[0_0_auto]">
              {guestDetails.map((detail, index) => {
                const IconComponent = detail.icon;
                return (
                  <div
                    key={index}
                    className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]"
                  >
                    <IconComponent className="relative w-5 h-5 text-white" />
                    <div className="relative w-fit mt-[-1.00px] font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-white text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)]">
                      {detail.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <Collapsible className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#8fbaba]">
            <CollapsibleTrigger className="relative self-stretch w-full h-[42px] flex items-center justify-between">
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Monthly Rent
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  ${paymentDetails ? paymentDetails.totalMonthlyRent.toFixed(2) : getMonthlyRent().toFixed(2)}
                </div>
                <ChevronDownIcon className="w-5 h-5" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-5 w-full">
              {rentBreakdownItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]"
                >
                  <div className="relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                    {item.label}
                  </div>
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                    {item.amount}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#8fbaba]">
            <CollapsibleTrigger className="relative self-stretch w-full h-[22px] flex items-center justify-between">
              <div className="[font-family:'Poppins',Helvetica] font-bold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Deposit
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  ${paymentDetails ? paymentDetails.totalDeposit.toFixed(2) : paymentBreakdown.securityDeposit.toFixed(2)}
                </div>
                <ChevronDownIcon className="w-5 h-5" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-5 w-full">
              {depositBreakdownItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]"
                >
                  <div className="relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                    {item.label}
                  </div>
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                    {item.amount}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}