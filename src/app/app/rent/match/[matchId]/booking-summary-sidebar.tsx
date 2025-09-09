/**
 * Booking Summary Sidebar Component
 * 
 * Fee Structure:
 * - SERVICE FEE: Applied to monthly rent (base rent + pet rent)
 *   • 3% for trips 6 months or shorter
 *   • 1.5% for trips longer than 6 months
 * 
 * - TRANSFER FEE: Applied to deposits (security + pet deposits)
 *   • Flat $5 fee regardless of deposit amount
 *   • One-time fee for deposit transfers
 * 
 * @module booking-summary-sidebar
 */
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Home, Calendar, MapPinIcon, ChevronDownIcon } from 'lucide-react';
import { MatchWithRelations } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { PaymentDetails } from '@/lib/calculate-payments';
import { FEES, getServiceFeeRate, calculateCreditCardFee } from '@/lib/fee-constants';

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
  isUsingCard?: boolean;
}

interface BreakdownItem {
  label: string;
  amount: string;
}

export function BookingSummarySidebar({ match, paymentBreakdown, paymentDetails, isUsingCard = false }: BookingSummarySidebarProps) {
  // Consolidated state for section toggles
  const [sectionStates, setSectionStates] = useState({
    rent: false,
    deposit: false,
    creditCard: false
  });
  
  const toggleSection = (section: 'rent' | 'deposit' | 'creditCard') => {
    setSectionStates(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Helper functions
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  
  const formatPetLabel = (numPets: number, type: 'rent' | 'deposit') => {
    if (numPets <= 0) return `Pet ${type}`;
    return `Pet ${type} (${numPets} pet${numPets > 1 ? 's' : ''})`;
  };
  
  const getUtilitiesStatus = () => {
    const included = paymentDetails?.utilitiesIncluded ?? match.listing.utilitiesIncluded;
    return included ? 'Included' : 'Not included';
  };
  
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
    const isValidRent = calculatedRent && calculatedRent !== 77777;
    return isValidRent ? calculatedRent : (match.monthlyRent || 0);
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

  // Calculate trip duration in months for service fee calculation
  const tripStartDate = new Date(match.trip.startDate);
  const tripEndDate = new Date(match.trip.endDate);
  const monthsDiff = (tripEndDate.getFullYear() - tripStartDate.getFullYear()) * 12 + 
                     (tripEndDate.getMonth() - tripStartDate.getMonth());
  
  // Get service fee rate based on trip duration (3% for ≤6 months, 1.5% for >6 months)
  const serviceFeeRate = getServiceFeeRate(monthsDiff);

  // Calculate rent breakdown
  const calculateRentBreakdown = (): { items: BreakdownItem[], subtotal: number, serviceFee: number } => {
    const items: BreakdownItem[] = [];
    let subtotal = 0;
    
    if (paymentDetails) {
      subtotal = paymentDetails.monthlyRent + paymentDetails.monthlyPetRent;
      items.push(
        { label: 'Base rent', amount: formatCurrency(paymentDetails.monthlyRent) },
        { 
          label: formatPetLabel(match.trip.numPets, 'rent'),
          amount: formatCurrency(paymentDetails.monthlyPetRent)
        }
      );
    } else {
      subtotal = getMonthlyRent();
      items.push(
        { label: 'Base rent', amount: formatCurrency(getMonthlyRent()) },
        { label: 'Pet rent', amount: formatCurrency(0) }
      );
    }
    
    const serviceFee = subtotal * serviceFeeRate;
    items.push(
      { label: 'Service fee', amount: formatCurrency(serviceFee) },
      { label: 'Utilities', amount: getUtilitiesStatus() }
    );
    
    return { items, subtotal, serviceFee };
  };
  
  const rentBreakdown = calculateRentBreakdown();
  const rentBreakdownItems = rentBreakdown.items;
  const rentSubtotal = rentBreakdown.subtotal;
  const rentServiceFee = rentBreakdown.serviceFee;

  // Calculate deposit breakdown
  const calculateDepositBreakdown = (): { items: BreakdownItem[], subtotal: number, transferFee: number } => {
    const items: BreakdownItem[] = [];
    let subtotal = 0;
    
    if (paymentDetails) {
      subtotal = paymentDetails.securityDeposit + paymentDetails.petDeposit;
      items.push(
        { label: 'Security deposit', amount: formatCurrency(paymentDetails.securityDeposit) },
        { 
          label: formatPetLabel(match.trip.numPets, 'deposit'),
          amount: formatCurrency(paymentDetails.petDeposit)
        }
      );
    } else {
      subtotal = paymentBreakdown.securityDeposit;
      items.push(
        { label: 'Security deposit', amount: formatCurrency(paymentBreakdown.securityDeposit) },
        { label: 'Pet deposit', amount: formatCurrency(0) }
      );
    }
    
    const transferFee = FEES.TRANSFER_FEE;
    items.push(
      { label: 'Transfer fee', amount: formatCurrency(transferFee) }
    );
    
    return { items, subtotal, transferFee };
  };
  
  const depositBreakdown = calculateDepositBreakdown();
  const depositBreakdownItems = depositBreakdown.items;
  const depositSubtotal = depositBreakdown.subtotal;
  const depositTransferFee = depositBreakdown.transferFee;

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
          <Collapsible 
            className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#8fbaba]"
            open={sectionStates.rent}
            onOpenChange={() => toggleSection('rent')}
          >
            <CollapsibleTrigger className="relative self-stretch w-full h-[42px] flex items-center justify-between">
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Monthly Rent
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  {formatCurrency(rentSubtotal + rentServiceFee)}
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${sectionStates.rent ? 'rotate-180' : ''}`} />
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

          <Collapsible 
            className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#8fbaba]"
            open={sectionStates.deposit}
            onOpenChange={() => toggleSection('deposit')}
          >
            <CollapsibleTrigger className="relative self-stretch w-full h-[22px] flex items-center justify-between">
              <div className="[font-family:'Poppins',Helvetica] font-bold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Deposit
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  {formatCurrency(depositSubtotal + depositTransferFee)}
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${sectionStates.deposit ? 'rotate-180' : ''}`} />
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

          {/* Credit Card Processing Fee Section - Only show when using card */}
          {isUsingCard && (
            <Collapsible 
              className="flex flex-col items-start gap-5 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#8fbaba]"
              open={sectionStates.creditCard}
              onOpenChange={() => toggleSection('creditCard')}
            >
              <CollapsibleTrigger className="relative self-stretch w-full h-[22px] flex items-center justify-between">
                <div className="[font-family:'Poppins',Helvetica] font-bold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                  Credit Card Processing
                </div>
                <div className="flex items-center gap-2">
                  <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                    {formatCurrency(calculateCreditCardFee((rentSubtotal + rentServiceFee) + (depositSubtotal + depositTransferFee)))}
                  </div>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${sectionStates.creditCard ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-5 w-full">
                <div className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                    Monthly Rent (3%)
                  </div>
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                    {formatCurrency(calculateCreditCardFee(rentSubtotal + rentServiceFee))}
                  </div>
                </div>
                <div className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                    Deposit (3%)
                  </div>
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                    {formatCurrency(calculateCreditCardFee(depositSubtotal + depositTransferFee))}
                  </div>
                </div>
                <div className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto] pt-3 border-t border-[#d9dadf]">
                  <div className="relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-[#666666] text-sm tracking-[0] leading-[16.8px]">
                    Processing fee for credit card payments
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}