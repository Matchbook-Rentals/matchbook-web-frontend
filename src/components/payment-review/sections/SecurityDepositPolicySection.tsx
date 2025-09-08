'use client';

import React from 'react';

export const SecurityDepositPolicySection: React.FC = () => {
  return (
    <section className="flex flex-col items-start gap-5 w-full">
      <div className="flex flex-col items-start gap-2 w-full">
        <h2 className="font-poppins font-semibold text-[#1a1a1a] text-xl tracking-[0] leading-[24.0px]">
          Security Deposit Policy
        </h2>

        <div className="font-poppins font-normal text-[#333333] text-base tracking-[0] leading-[28.8px]">
          <span className="font-poppins font-normal text-[#333333] text-base tracking-[0] leading-[28.8px]">
            Total Due Today required at the time of reservation for:
            <br />
          </span>

          <span className="font-medium">
            Security Deposit (refundable)
            <br />
            Guest Service Fee
            <br />
          </span>

          <span className="font-poppins font-normal text-[#333333] text-base tracking-[0] leading-[28.8px]">
            Subsequent Amounts will be charged on Rental Start Date, then every 30 days following the Rental Start Date for the next full month or fractional days, as applicable.
          </span>
        </div>
      </div>
    </section>
  );
};