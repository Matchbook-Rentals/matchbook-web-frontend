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
import { Users, Baby, Dog, MapPinIcon, ChevronDownIcon } from 'lucide-react';
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
    deposit: false
  });
  
  const toggleSection = (section: 'rent' | 'deposit') => {
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

  // Get guest details from trip
  const guestDetails = [
    { icon: Users, label: `${match.trip.numAdults} ${match.trip.numAdults === 1 ? 'adult' : 'adults'}` },
    { icon: Baby, label: `${match.trip.numChildren} ${match.trip.numChildren === 1 ? 'child' : 'children'}` },
    { icon: Dog, label: `${match.trip.numPets} ${match.trip.numPets === 1 ? 'pet' : 'pets'}` }
  ];

  // Calculate trip duration in months for service fee calculation
  const tripStartDate = new Date(match.trip.startDate);
  const tripEndDate = new Date(match.trip.endDate);
  const monthsDiff = (tripEndDate.getFullYear() - tripStartDate.getFullYear()) * 12 + 
                     (tripEndDate.getMonth() - tripStartDate.getMonth());
  
  // Get service fee rate based on trip duration (3% for ≤6 months, 1.5% for >6 months)
  const serviceFeeRate = getServiceFeeRate(monthsDiff);

  // Calculate rent breakdown
  const calculateRentBreakdown = (): { items: BreakdownItem[], subtotal: number, serviceFee: number, total: number } => {
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
      { label: 'Service fee', amount: formatCurrency(serviceFee) }
    );
    
    // Add credit card processing fee if using card
    let total = subtotal + serviceFee;
    if (isUsingCard) {
      const cardFee = calculateCreditCardFee(total);
      items.push(
        { label: 'Credit card processing fee', amount: formatCurrency(cardFee) }
      );
      total += cardFee;
    }
    
    items.push(
      { label: 'Utilities', amount: getUtilitiesStatus() }
    );
    
    return { items, subtotal, serviceFee, total };
  };
  
  const rentBreakdown = calculateRentBreakdown();
  const rentBreakdownItems = rentBreakdown.items;
  const rentSubtotal = rentBreakdown.subtotal;
  const rentServiceFee = rentBreakdown.serviceFee;

  // Calculate deposit breakdown
  const calculateDepositBreakdown = (): { items: BreakdownItem[], subtotal: number, transferFee: number, total: number } => {
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
    
    // Add credit card processing fee if using card
    let total = subtotal + transferFee;
    if (isUsingCard) {
      const cardFee = calculateCreditCardFee(total);
      items.push(
        { label: 'Credit card processing fee', amount: formatCurrency(cardFee) }
      );
      total += cardFee;
    }
    
    return { items, subtotal, transferFee, total };
  };
  
  const depositBreakdown = calculateDepositBreakdown();
  const depositBreakdownItems = depositBreakdown.items;
  const depositSubtotal = depositBreakdown.subtotal;
  const depositTransferFee = depositBreakdown.transferFee;

  return (
    <div className="flex w-full lg:max-w-md items-center gap-2.5 p-8 relative bg-[#e7f0f0] rounded-lg overflow-hidden">
      <div className="flex flex-col w-full items-start gap-6 relative">
        <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-blackblack-500 text-[28px] tracking-[0] leading-[33.6px]">
          Booking Summary
        </h1>

        <Card 
          className="flex flex-col min-h-[300px] items-end justify-end pt-4 pb-0 px-0 relative self-stretch w-full rounded-xl border-0"
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
                  {`${match.listing.city}, ${match.listing.state}` || 'Austin, TX'}
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-0  py-0 relative self-stretch w-full ">
              {guestDetails.map((detail, index) => {
                const IconComponent = detail.icon;
                return (
                  <div
                    key={index}
                    className="inline-flex items-start gap-1.5 relative"
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
            <CollapsibleTrigger className="relative self-stretch w-full flex items-center justify-between py-2">
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Monthly Rent
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  {formatCurrency(rentBreakdown.total)}
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
            <CollapsibleTrigger className="relative self-stretch w-full flex items-center justify-between py-2">
              <div className="[font-family:'Poppins',Helvetica] font-bold text-[#333333] text-lg tracking-[0] leading-[21.6px]">
                Deposit
              </div>
              <div className="flex items-center gap-2">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  {formatCurrency(depositBreakdown.total)}
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

        </div>
      </div>
    </div>
  );
}
