import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

export const SearchContainerSection = (): JSX.Element => {
  const searchData = [
    {
      location: "Ogden, UT",
      dateRange: "Aug 3 - Sep 8",
      duration: "36 days",
      priceRange: "Not specified",
      adults: "1 Adult",
      children: "0 Children",
      pets: "0 pet",
      continueButtonSrc: "/buttons-button-2.svg",
    },
    {
      location: "Ogden, UT",
      dateRange: "Aug 3 - Sep 8",
      duration: "36 days",
      priceRange: "Not specified",
      adults: "1 Adult",
      children: "0 Children",
      pets: "0 pet",
      continueButtonSrc: "/buttons-button.svg",
    },
    {
      location: "Ogden, UT",
      dateRange: "Aug 3 - Sep 8",
      duration: "36 days",
      priceRange: "Not specified",
      adults: "1 Adult",
      children: "0 Children",
      pets: "0 pet",
      continueButtonSrc: "/buttons-button-1.svg",
    },
  ];

  return (
    <section className="flex flex-col items-start gap-6 w-full">
      {searchData.map((item, index) => (
        <Card
          key={index}
          className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-center gap-2 w-full">
              <div className="flex items-start gap-6 flex-1">
                <div className="flex flex-col items-start gap-2.5 flex-1">
                  <div className="flex flex-col items-start justify-center gap-2 w-full">
                    <div className="inline-flex items-start gap-2">
                      <div className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                        {item.location}
                      </div>
                    </div>

                    <div className="inline-flex items-start gap-2">
                      <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                        {item.dateRange}
                      </div>

                      <Badge className="h-[25px] bg-[#e7f0f0] text-[#0a6060] rounded-[1000px] px-2 py-1 hover:bg-[#e7f0f0]">
                        <div className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                          {item.duration}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2.5">
                    <div className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                      Price Range:
                    </div>

                    <div className="[font-family:'Poppins',Helvetica] font-medium text-[#0b6969] text-base text-right tracking-[0] leading-[normal]">
                      {item.priceRange}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full">
                    <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                      <img className="w-5 h-5" alt="Adult" src="/adultl.svg" />

                      <div className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                        {item.adults}
                      </div>
                    </div>

                    <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                      <img className="w-5 h-5" alt="Kid" src="/kid.svg" />

                      <div className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                        {item.children}
                      </div>
                    </div>

                    <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                      <img className="w-5 h-5" alt="Pet" src="/pet.svg" />

                      <div className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                        {item.pets}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[274px] items-end justify-center gap-3">
                <div className="inline-flex items-center gap-3">
                  <img
                    className="flex-[0_0_auto]"
                    alt="Continue Search Button"
                    src={item.continueButtonSrc}
                  />

                  <Button
                    variant="outline"
                    className="px-3.5 py-2.5 h-auto rounded-lg border-[#3c8787] text-[#3c8787] hover:bg-transparent hover:text-[#3c8787]"
                  >
                    <div className="inline-flex items-center justify-center px-0.5 py-0">
                      <div className="[font-family:'Poppins',Helvetica] font-semibold text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Edit
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="p-2.5 h-auto rounded-lg border-[#3c8787] hover:bg-transparent"
                  >
                    <img className="w-5 h-5" alt="Menu" src="/frame.svg" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};
