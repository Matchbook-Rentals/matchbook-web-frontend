import React from "react";
import { Card, CardContent } from "../ui/card";

export const DitchPaperwork = (): JSX.Element => {
  return (
    <section className="flex flex-col md:flex-row items-center gap-8 px-6 md:px-[150px] py-14 relative bg-[#3c87870d]">
      <Card className="relative w-full md:w-[558px] h-[428px] rounded-xl overflow-hidden border-0">
        <CardContent className="p-0 h-full">
          <img
            className="w-full h-full object-cover"
            alt="Man tearing paper representing paperless workflow"
            src="/medium-shot-man-dealing-with-imposter-syndrome-1.png"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-4 relative flex-1 grow mt-4 md:mt-0">
        <h2 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal]">
          Ditch the paperwork
        </h2>

        <p className="relative self-stretch font-text-heading-small-medium font-[number:var(--text-heading-small-medium-font-weight)] text-gray-neutral500 text-[length:var(--text-heading-small-medium-font-size)] tracking-[var(--text-heading-small-medium-letter-spacing)] leading-[var(--text-heading-small-medium-line-height)] [font-style:var(--text-heading-small-medium-font-style)]">
          Bookings generate automatic rental agreements, streamlining the
          leasing process—no paperwork, no waiting. Your business, modernized.
        </p>
      </div>
    </section>
  );
};