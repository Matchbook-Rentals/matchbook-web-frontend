'use client';

import React from 'react';

export const SecurityDepositPolicySection: React.FC = () => {
  return (
    <section className="flex flex-col items-start gap-4 md:gap-5 w-full">
      <div className="flex flex-col items-start gap-2 w-full">
        <h2 className="font-poppins font-semibold text-[#1a1a1a] text-lg md:text-xl tracking-[0] leading-tight">
          Security Deposit Policy
        </h2>

        <div className="font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
          <span className="font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
            Total Due Today required at the time of reservation for:
            <br />
          </span>

          <span className="font-medium">
            Security Deposit (refundable)
            <br />
            Deposit Transfer Fee (non-refundable)
            <br />
          </span>

          <span className="font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
            Subsequent Amounts will be charged on Rental Start Date, then every 30 days following the Rental Start Date for the next full month or fractional days, as applicable.
          </span>
        </div>
      </div>
    </section>
  );
};