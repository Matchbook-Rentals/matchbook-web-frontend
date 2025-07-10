import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ListingAddressProps {
  propertyName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export const ListingAddress = ({
  propertyName,
  street,
  city,
  state,
  zip,
}: ListingAddressProps): JSX.Element => {
  return (
    <Card className="w-[320px] sm:w-[360px] md:w-[437px] border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-2">
          <h1 className="font-normal text-2xl sm:text-3xl md:text-4xl text-[#3f3f3f] [font-family:'Montserrat',Helvetica] tracking-[0] leading-normal">
            {propertyName}
          </h1>
          <p className="font-medium text-base sm:text-lg md:text-[26px] text-[#2d2f2e99] text-right [font-family:'Montserrat',Helvetica] tracking-[0] leading-normal">
            {street}, {city} {state} {zip}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
