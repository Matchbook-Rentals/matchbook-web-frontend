'use client';

import { ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  calculateCreditCardFee, 
  calculateServiceFee,
  calculateProratedRent,
  calculateTripMonths
} from '@/lib/payment-calculations';

interface UpcomingPaymentsSectionProps {
  monthlyRent: number;
  monthlyPetRent?: number;
  tripStartDate: Date;
  tripEndDate: Date;
  isUsingCard?: boolean;
}

export const UpcomingPaymentsSection: React.FC<UpcomingPaymentsSectionProps> = ({
  monthlyRent,
  monthlyPetRent = 0,
  tripStartDate,
  tripEndDate,
  isUsingCard = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState<Set<number>>(new Set());

  // Calculate the upcoming payments based on trip dates
  const generateUpcomingPayments = () => {
    const payments = [];
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    
    console.log('🔍 [UpcomingPayments] Generating payment schedule:', {
      tripStartDate: start.toISOString(),
      tripEndDate: end.toISOString(),
      monthlyRent,
      monthlyPetRent,
      totalMonthlyRent: monthlyRent + monthlyPetRent,
      startDay: start.getDate(),
      startMonth: start.getMonth() + 1,
      startYear: start.getFullYear()
    });
    
    // Calculate trip duration for service fee
    const tripMonths = calculateTripMonths(start, end);
    console.log('📅 Trip duration in months:', tripMonths);
    
    // Calculate if first month is prorated (using listing's local time)
    const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDayOfFirstMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const daysInFirstMonth = lastDayOfFirstMonth.getDate();
    const daysRemainingInFirstMonth = lastDayOfFirstMonth.getDate() - start.getDate() + 1;
    const isFirstMonthProrated = start.getDate() !== 1;
    
    let paymentIndex = 0;
    
    // Add first month payment (prorated or full)
    if (isFirstMonthProrated) {
      console.log('🏠 First month is PRORATED');
      console.log('  Days in first month:', daysInFirstMonth);
      console.log('  Days remaining in first month (old calc):', daysRemainingInFirstMonth);
      
      // Prorated first month - use our clean calculation
      const totalMonthlyRent = monthlyRent + monthlyPetRent;
      const proratedDetails = calculateProratedRent(totalMonthlyRent, start);
      const proratedRent = proratedDetails.amount;
      
      // Calculate prorated amounts for base and pet rent
      const proratedBaseRent = monthlyPetRent > 0 
        ? Math.round((monthlyRent / totalMonthlyRent) * proratedRent * 100) / 100
        : proratedRent;
      const proratedPetRent = monthlyPetRent > 0
        ? Math.round((monthlyPetRent / totalMonthlyRent) * proratedRent * 100) / 100
        : 0;
      
      console.log('💰 Proration details:', {
        monthlyRent,
        proratedAmount: proratedRent,
        daysToCharge: proratedDetails.daysToCharge,
        daysInMonth: proratedDetails.daysInMonth,
        dailyRate: proratedDetails.dailyRate,
        isProrated: proratedDetails.isProrated
      });
      
      const serviceFee = calculateServiceFee(proratedRent, tripMonths);
      const baseAmount = proratedRent + serviceFee;
      const cardFee = isUsingCard ? calculateCreditCardFee(baseAmount) : 0;
      const totalAmount = baseAmount + cardFee;
      
      console.log('🧮 First month payment breakdown:', {
        proratedRent,
        serviceFee,
        baseAmount,
        cardFee,
        totalAmount
      });
      
      const subItems = [];
      
      // Add base rent
      subItems.push({
        description: `Base rent - ${proratedDetails.daysToCharge} days (prorated)`,
        amount: proratedBaseRent,
      });
      
      // Add pet rent if applicable
      if (monthlyPetRent > 0) {
        subItems.push({
          description: `Pet rent - ${proratedDetails.daysToCharge} days (prorated)`,
          amount: proratedPetRent,
        });
      }
      
      subItems.push({
        description: 'Service fee',
        amount: serviceFee,
      });
      
      if (isUsingCard) {
        subItems.push({
          description: 'Credit card processing fee',
          amount: cardFee,
        });
      }
      
      payments.push({
        date: formatPaymentDate(start),
        amount: totalAmount,
        hasSubItem: true,
        subItems,
      });
      paymentIndex++;
    } else {
      console.log('🏠 First month is FULL (move-in on the 1st)');
      // Full first month (move-in on the 1st)
      const totalMonthlyRent = monthlyRent + monthlyPetRent;
      const serviceFee = calculateServiceFee(totalMonthlyRent, tripMonths);
      const baseAmount = totalMonthlyRent + serviceFee;
      const cardFee = isUsingCard ? calculateCreditCardFee(baseAmount) : 0;
      const totalAmount = baseAmount + cardFee;
      
      console.log('💰 Full first month payment:', {
        monthlyRent,
        serviceFee,
        baseAmount,
        cardFee,
        totalAmount
      });
      
      const subItems = [];
      
      // Add base rent
      subItems.push({ description: 'Base rent', amount: monthlyRent });
      
      // Add pet rent if applicable
      if (monthlyPetRent > 0) {
        subItems.push({ description: 'Pet rent', amount: monthlyPetRent });
      }
      
      subItems.push({ description: 'Service fee', amount: serviceFee });
      
      if (isUsingCard) {
        subItems.push({
          description: 'Credit card processing fee',
          amount: cardFee
        });
      }
      
      payments.push({
        date: formatPaymentDate(start),
        amount: totalAmount,
        hasSubItem: true,
        subItems,
      });
      paymentIndex++;
    }
    
    // Add subsequent months starting from month 2 (using listing's local time)
    let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    console.log('📆 Starting subsequent months from:', currentDate.toISOString());
    
    while (currentDate <= end && paymentIndex < 36) {
      console.log(`
📅 Payment #${paymentIndex + 1} for:`, currentDate.toLocaleDateString());
      
      // Check if this is the last month and if it needs proration
      const isLastMonth = currentDate.getMonth() === end.getMonth() && 
                         currentDate.getFullYear() === end.getFullYear();
      
      let baseRentAmount = monthlyRent;
      let petRentAmount = monthlyPetRent;
      let totalRentAmount = monthlyRent + monthlyPetRent;
      let baseDescription = 'Base rent';
      let petDescription = 'Pet rent';
      
      if (isLastMonth) {
        // Check if move-out is before the last day of the month
        const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);
        const endDay = end.getDate();
        const lastDay = lastDayOfMonth.getDate();
        
        if (endDay < lastDay) {
          // Use centralized proration calculation for last month
          console.log('🏠 Last month is PRORATED');
          console.log('  End date:', end.toISOString());
          console.log('  End day:', endDay, 'Last day of month:', lastDay);
          
          // Use the same calculation as payment generation
          const proratedDetails = calculateProratedRent(totalRentAmount, currentDate, end);
          const proratedTotal = proratedDetails.amount;
          
          // Prorate base and pet rent proportionally
          baseRentAmount = monthlyPetRent > 0
            ? Math.round((monthlyRent / totalRentAmount) * proratedTotal * 100) / 100
            : proratedTotal;
          petRentAmount = monthlyPetRent > 0
            ? Math.round((monthlyPetRent / totalRentAmount) * proratedTotal * 100) / 100
            : 0;
          
          baseDescription = `Base rent - ${proratedDetails.daysToCharge} days (prorated)`;
          petDescription = `Pet rent - ${proratedDetails.daysToCharge} days (prorated)`;
          totalRentAmount = proratedTotal;
          
          console.log('💰 Last month proration using centralized calc:', {
            baseRentAmount,
            petRentAmount,
            totalRentAmount,
            daysToCharge: proratedDetails.daysToCharge,
            daysInMonth: proratedDetails.daysInMonth,
            dailyRate: proratedDetails.dailyRate,
            isProrated: proratedDetails.isProrated
          });
        }
      }
      
      const serviceFee = calculateServiceFee(totalRentAmount, tripMonths);
      const baseAmount = totalRentAmount + serviceFee;
      const cardFee = isUsingCard ? calculateCreditCardFee(baseAmount) : 0;
      const totalAmount = baseAmount + cardFee;
      
      console.log('  Amount breakdown:', {
        baseRentAmount,
        petRentAmount,
        totalRentAmount,
        serviceFee,
        baseAmount,
        totalAmount
      });
      
      // Always show breakdown to include service fee
      const subItems = [];
      
      // Add base rent
      subItems.push({ description: baseDescription, amount: baseRentAmount });
      
      // Add pet rent if applicable
      if (petRentAmount > 0) {
        subItems.push({ description: petDescription, amount: petRentAmount });
      }
      
      subItems.push({ description: 'Service fee', amount: serviceFee });
      
      if (isUsingCard) {
        subItems.push({
          description: 'Credit card processing fee',
          amount: cardFee
        });
      }
      
      payments.push({
        date: formatPaymentDate(currentDate),
        amount: totalAmount,
        hasSubItem: true,
        subItems,
      });
      
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      paymentIndex++;
    }
    
    return payments; // Show all payments for the full trip
  };

  const formatPaymentDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const paymentData = generateUpcomingPayments();

  const togglePaymentExpanded = (index: number) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col items-start gap-3 md:gap-4 relative self-stretch w-full flex-[0_0_auto]">
      <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between p-4 md:p-5 relative self-stretch w-full flex-[0_0_auto] bg-[#f9f9f9] rounded-lg hover:bg-[#f5f5f5] transition-colors">
          <div className="items-center gap-3 flex relative flex-1 grow">
            <div className="relative w-fit mt-[-1.00px] font-poppins font-medium text-[#373940] text-lg md:text-xl tracking-[0] leading-tight whitespace-nowrap">
              Upcoming Payments
            </div>
          </div>
          <ChevronDownIcon className={`ml-[-2.1e-06px] relative w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="flex-col items-start gap-4 md:gap-6 self-stretch w-full flex-[0_0_auto] flex relative pt-3 md:pt-4">
            {paymentData.map((payment, index) => (
              <div key={index} className="w-full">
                {payment.hasSubItem ? (
                  <Collapsible open={expandedPayments.has(index)} onOpenChange={() => togglePaymentExpanded(index)}>
                    <CollapsibleTrigger className="items-end justify-between px-4 md:px-5 py-0 self-stretch w-full flex-[0_0_auto] flex relative hover:bg-gray-50 transition-colors">
                      <div className="relative w-fit font-poppins font-normal text-[#333333] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                        {payment.date}
                      </div>

                      <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                        <div className="relative w-fit font-poppins font-semibold text-[#020202] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                          ${payment.amount.toFixed(2)}
                        </div>
                        <ChevronDownIcon className={`relative w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 ${expandedPayments.has(index) ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {payment.subItems?.map((subItem, subIndex) => (
                        <div key={subIndex} className="items-end justify-between px-6 md:px-8 py-2 self-stretch w-full flex-[0_0_auto] flex relative">
                          <div className="relative w-fit mt-[-1.00px] font-poppins font-normal text-[#545454] text-sm md:text-base tracking-[0] leading-tight whitespace-nowrap">
                            {subItem.description}
                          </div>

                          <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                            <div className="relative w-fit mt-[-1.00px] font-poppins font-normal text-[#545454] text-sm md:text-base tracking-[0] leading-tight whitespace-nowrap">
                              ${subItem.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <div className="items-end justify-between px-4 md:px-5 py-0 self-stretch w-full flex-[0_0_auto] flex relative">
                    <div className="relative w-fit font-poppins font-normal text-[#333333] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                      {payment.date}
                    </div>

                    <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                      <div className="relative w-fit font-poppins font-semibold text-[#020202] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                        ${payment.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
