import React from "react";
import { Card, CardContent } from "../ui/card";

export const TermTailoredPricing = (): JSX.Element => {
  return (
    <section className="flex justify-center  py-16">
      <div className="flex flex-col gap-[34px] w-full xl:max-w-[1140px] 2xl:max-w-[1400px]">
        <div className="gap-4 flex items-center flex-col md:flex-row">
          <h1 className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-neutral900 text-2xl md:text-[40px] tracking-[-2.00px] leading-[normal] text-center md:text-left">
            Maximize Your Revenue with Term Tailored Pricing
          </h1>

          <p className="relative flex-1 font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-neutral500 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] text-center md:text-left">
            With Matchbook, you can adjust your monthly rent based on how long a
            renter stays. Offer better rates for longer terms and price shorter
            stays accordingly — all while staying competitive and increasing
            your earnings.
          </p>
        </div>

        <Card className="flex h-[338px] w-full border-0">
          <CardContent className="flex w-full h-full items-center justify-center p-0 bg-[linear-gradient(0deg,rgba(60,135,135,0)_0%,rgba(83,184,184,0)_94%)]">
            <div
              className="w-full h-full bg-cover sm:bg-contain xl:bg-cover bg-center bg-no-repeat sm:bg-[url(/marketing-images/term-tailored-pricing/1.png)] bg-[url(/marketing-images/term-tailored-pricing/2.png)]"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
