import React from "react";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";

export const DitchPaperwork = (): JSX.Element => {
  return (
    <section className="flex flex-col md:flex-row items-center gap-8 px-6 md:px-[150px] py-14 relative bg-[#3c87870d]">
      <Card className="relative w-full md:w-[558px] h-[428px] rounded-xl overflow-hidden border-0">
        <CardContent className="p-0 h-full relative">
          <Image
            src="/marketing-images/ditch-paperwork/1.png"
            alt="Man tearing paper representing paperless workflow"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 558px"
            quality={85}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-4 relative flex-1 grow mt-4 md:mt-0">
        <h2 className="relative self-stretch text-center md:text-left mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal]">
          Ditch the paperwork
        </h2>

        <p className="relative self-stretch text-gray-600 text-medium text-center md:text-left font-text-heading-small-medium font-[number:var(--text-heading-small-medium-font-weight)] text-gray-neutral500 text-[length:var(--text-heading-small-medium-font-size)] tracking-[var(--text-heading-small-medium-letter-spacing)] leading-[var(--text-heading-small-medium-line-height)] [font-style:var(--text-heading-small-medium-font-style)]">
Streamline your leasing process, upload your lease and get it signed on platform. No paperwork, no waiting. 
        </p>
      </div>
    </section>
  );
};
