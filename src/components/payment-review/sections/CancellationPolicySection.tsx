'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const CancellationPolicySection: React.FC = () => {
  return (
    <Card className="flex-col items-start gap-4 md:gap-5 self-stretch w-full flex-[0_0_auto] flex relative border-0 shadow-none">
      <CardContent className="flex-col items-start gap-2 self-stretch w-full flex-[0_0_auto] flex relative p-0">
        <h2 className="relative self-stretch mt-[-1.00px] font-poppins font-semibold text-[#1a1a1a] text-lg md:text-xl tracking-[0] leading-tight">
          Cancellation Policy
        </h2>

        <div className="relative self-stretch font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
          <span className="font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
            Cancellations made 30 days or more before the rental start date will receive a full refund of all payments made, including the security deposit.
            <br />
            <br />
            Cancellations made within 30 days of the rental start date will forfeit the first month's rent and guest service fee. The security deposit will be refunded in full.
            <br />
            <br />
            No-shows or cancellations made after the rental start date will forfeit all payments made.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};