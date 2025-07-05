import React from "react";
import Link from "next/link";
import { BrandButton } from "../ui/brandButton";
import { Card, CardContent } from "../ui/card";

export const ListYourProperty = (): JSX.Element => {
  return (
    <Card className="flex flex-col lg:flex-row h-auto lg:h-[335px] items-center gap-8 pl-0 pr-0 lg:pr-[73px] py-0 bg-[#e7f0f0] rounded-xl overflow-hidden border-none w-full">
      <div
        className="relative w-full lg:w-[803px] h-[335px] bg-cover bg-center"
        style={{ backgroundImage: "url(/marketing-images/list-your-property/1.png)" }}
      />

      <CardContent className="flex flex-col items-center lg:items-start gap-4 lg:gap-8 px-4 py-6 lg:p-0 flex-1 w-full">
        <div className="flex flex-col items-start gap-2 self-stretch w-full">
          <h2 className="w-full font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-2xl lg:text-[40px] text-center lg:text-left leading-normal">
            Best part? It&#39;s completely free.
          </h2>
        </div>

        <Link href="#" className="w-40 lg:w-auto">
          <BrandButton size="lg" className="w-full lg:w-auto">List Your Property</BrandButton>
        </Link>
      </CardContent>
    </Card>
  );
};
