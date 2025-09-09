'use client';

import { ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FEES, calculateCreditCardFee } from '@/lib/fee-constants';

interface PaymentBreakdown {
  monthlyRent: number;
  securityDeposit: number;
  petDeposit?: number;
  transferFee?: number;
  serviceFee?: number; // Backward compatibility
  processingFee?: number;
  total: number;
}

interface TotalDueSectionProps {
  paymentBreakdown: PaymentBreakdown;
  isUsingCard?: boolean;
}

/**
 * Total Due Section Component
 * 
 * Displays the total amount due today, which includes:
 * - Security Deposit
 * - Pet Deposit (if applicable)
 * - Transfer Fee (flat $5 for deposit transfers)
 * 
 * Note: Monthly rent is NOT included here - it's shown in the Upcoming Payments section
 */
export const TotalDueSection: React.FC<TotalDueSectionProps> = ({ 
  paymentBreakdown, 
  isUsingCard = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Always use the flat transfer fee from constants ($5)
  // This is for deposit transfers, not rent service fees
  const transferFee = FEES.TRANSFER_FEE;

  // Calculate base amount (deposits + transfer fee)
  const baseAmount = paymentBreakdown.securityDeposit + 
                     (paymentBreakdown.petDeposit || 0) + 
                     transferFee;

  // Calculate credit card fee if applicable (3% of base amount)
  const creditCardFee = isUsingCard ? calculateCreditCardFee(baseAmount) : 0;

  // Build payment items array
  const paymentItems = [
    {
      label: 'Security Deposit',
      amount: paymentBreakdown.securityDeposit,
    },
    ...(paymentBreakdown.petDeposit ? [{
      label: 'Pet Deposit',
      amount: paymentBreakdown.petDeposit,
    }] : []),
    {
      label: 'Transfer Fee',
      amount: transferFee,
    },
    ...(isUsingCard ? [{
      label: 'Credit Card Processing Fee',
      amount: creditCardFee,
    }] : []),
  ];

  // Calculate total including credit card fee if applicable
  const calculatedTotal = baseAmount + creditCardFee;

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
              ${calculatedTotal.toFixed(2)}
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
                  ${calculatedTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
};