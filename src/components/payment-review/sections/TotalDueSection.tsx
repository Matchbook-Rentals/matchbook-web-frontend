'use client';

import { ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PaymentBreakdown {
  monthlyRent: number;
  securityDeposit: number;
  petDeposit?: number;
  serviceFee: number;
  processingFee?: number;
  total: number;
}

interface TotalDueSectionProps {
  paymentBreakdown: PaymentBreakdown;
}

export const TotalDueSection: React.FC<TotalDueSectionProps> = ({ paymentBreakdown }) => {
  const [isOpen, setIsOpen] = useState(false);

  const paymentItems = [
    {
      label: 'First Month Rent',
      amount: paymentBreakdown.monthlyRent,
    },
    {
      label: 'Security Deposit',
      amount: paymentBreakdown.securityDeposit,
    },
    ...(paymentBreakdown.petDeposit ? [{
      label: 'Pet Deposit',
      amount: paymentBreakdown.petDeposit,
    }] : []),
    {
      label: 'Service Fee',
      amount: paymentBreakdown.serviceFee,
    },
    ...(paymentBreakdown.processingFee ? [{
      label: 'Processing Fee',
      amount: paymentBreakdown.processingFee,
    }] : []),
  ];

  return (
    <section className="flex flex-col items-start gap-3 md:gap-4 relative self-stretch w-full flex-[0_0_auto]">
      <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between p-4 md:p-5 relative self-stretch w-full flex-[0_0_auto] bg-[#f9f9f9] rounded-lg hover:bg-[#f5f5f5] transition-colors">
          <div className="items-center gap-3 flex relative flex-1 grow">
            <h3 className="relative w-fit mt-[-1.00px] font-poppins font-medium text-[#373940] text-lg md:text-xl tracking-[0] leading-tight whitespace-nowrap">
              Total Due Today
            </h3>
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-4 relative">
            <div className="relative w-fit font-poppins font-semibold text-[#020202] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
              ${paymentBreakdown.total.toFixed(2)}
            </div>

            <ChevronDownIcon className={`relative w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="flex-col items-start gap-4 md:gap-6 self-stretch w-full flex-[0_0_auto] flex relative pt-3 md:pt-4">
          {paymentItems.map((item, index) => (
            <div
              key={index}
              className="items-end justify-between px-4 md:px-5 py-0 self-stretch w-full flex-[0_0_auto] flex relative"
            >
              <div className="relative w-fit mt-[-1.00px] font-poppins font-normal text-[#333333] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                {item.label}
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                <div className="relative w-fit mt-[-1.00px] font-poppins font-semibold text-[#020202] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                  ${item.amount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-[#d9dadf] pt-3 md:pt-4 mt-2 w-full">
            <div className="items-end justify-between px-4 md:px-5 py-0 self-stretch w-full flex-[0_0_auto] flex relative">
              <div className="relative w-fit mt-[-1.00px] font-poppins font-semibold text-[#020202] text-base md:text-lg tracking-[0] leading-tight whitespace-nowrap">
                Total
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-4 relative">
                <div className="relative w-fit mt-[-1.00px] font-poppins font-bold text-[#020202] text-lg md:text-xl tracking-[0] leading-tight whitespace-nowrap">
                  ${paymentBreakdown.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
};