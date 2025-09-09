'use client';

import { ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UpcomingPaymentsSectionProps {
  monthlyRent: number;
  tripStartDate: Date;
  tripEndDate: Date;
}

export const UpcomingPaymentsSection: React.FC<UpcomingPaymentsSectionProps> = ({
  monthlyRent,
  tripStartDate,
  tripEndDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState<Set<number>>(new Set());

  // Calculate the upcoming payments based on trip dates
  const generateUpcomingPayments = () => {
    const payments = [];
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    
    // Calculate if first month is prorated
    const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDayOfFirstMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const daysInFirstMonth = lastDayOfFirstMonth.getDate();
    const daysRemainingInFirstMonth = lastDayOfFirstMonth.getDate() - start.getDate() + 1;
    const isFirstMonthProrated = start.getDate() !== 1;
    
    let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1); // Start from second month
    let paymentIndex = 0;
    
    // Add first month if prorated
    if (isFirstMonthProrated) {
      const proratedAmount = (monthlyRent / daysInFirstMonth) * daysRemainingInFirstMonth;
      payments.push({
        date: formatPaymentDate(start),
        amount: proratedAmount,
        hasSubItem: true,
        subItem: {
          description: `${daysRemainingInFirstMonth} days of ${formatMonthYear(start)} (prorated)`,
          amount: proratedAmount,
        },
      });
      paymentIndex++;
    }
    
    // Add full months
    while (currentDate <= end && paymentIndex < 12) {
      payments.push({
        date: formatPaymentDate(currentDate),
        amount: monthlyRent,
        hasSubItem: false,
      });
      
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      paymentIndex++;
    }
    
    return payments.slice(0, 3); // Show only first 3 payments
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
                      <div className="items-end justify-between px-6 md:px-8 py-2 self-stretch w-full flex-[0_0_auto] flex relative">
                        <div className="relative w-fit mt-[-1.00px] font-poppins font-normal text-[#545454] text-sm md:text-base tracking-[0] leading-tight whitespace-nowrap">
                          {payment.subItem?.description}
                        </div>

                        <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                          <div className="relative w-fit mt-[-1.00px] font-poppins font-normal text-[#545454] text-sm md:text-base tracking-[0] leading-tight whitespace-nowrap">
                            ${payment.subItem?.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
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