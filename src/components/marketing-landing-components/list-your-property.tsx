import React from "react";
import Link from "next/link";
import { BrandButton } from "../ui/brandButton";
import { Card, CardContent } from "../ui/card";

export const ListYourProperty = (): JSX.Element => {
  return (
    <Card className="flex h-[335px] items-center gap-8 pl-0 pr-[73px] py-0 bg-[#e7f0f0] rounded-xl overflow-hidden border-none">
      <div
        className="relative w-[803px] h-[335px] bg-cover bg-center"
        style={{ backgroundImage: "url(/marketing-images/list-your-property/1.png)" }}
      />

      <CardContent className="flex flex-col items-start gap-8 p-0 flex-1">
        <div className="flex flex-col items-start gap-2 self-stretch w-full">
          <h2 className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] leading-normal">
            Best part? It&#39;s completely free.
          </h2>
        </div>

        <Link href="#">
          <BrandButton size="lg">List Your Property</BrandButton>
        </Link>
      </CardContent>
    </Card>
  );
};
