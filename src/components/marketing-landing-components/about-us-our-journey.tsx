import React from "react";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";

export const AboutUsOurJourney = (): JSX.Element => {
  return (
    <section className="flex flex-col items-center gap-14  pt-8 pb-16">
      <header className="flex flex-col items-center gap-6 w-full">
        <h1 className="w-full font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] font-['Poppins',Helvetica]">
          Our Journey
        </h1>

        <div className="flex flex-col items-center gap-4 w-full">
          <p className="w-full font-text-label-medium-regular text-gray-neutral900 text-[16px] text-center">
            Ever tried finding a place to live that fits your not-so-typical
            schedule?
          </p>

          <p className="w-full max-w-[720px] px-4 font-text-label-medium-regular text-gray-neutral500 text-[16px] text-center">
When my wife and I left the Air Force to go back to school, we discovered that finding a mid-term rental was the wild west of the rental market. We could choose between properties that were either prohibitively expensive with massive fees tacked on or completely unverified with very little guarantee of quality or legitimacy. Although we eventually found a place we could afford, it was not without significant difficulty and a bit of blind trust that could have gone very wrong. This was a problem that needed to be fixed, and we started MatchBook to do just that. Three years later, with the help of an amazing team, we have created a platform that makes connecting hosts with renters safer, simpler, and more affordable.
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row items-start gap-5 justify-center w-full px-4">
        <div className="flex flex-col w-full lg:w-[655px] items-start gap-5 order-1 lg:order-1">
          <Card className="w-full h-[163px] rounded-xl overflow-hidden">
            <CardContent className="p-0 relative h-full">
              <Image
                src="/about-us/our-journey/1.png"
                alt="People in uniform"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 655px"
                quality={85}
              />
            </CardContent>
          </Card>

          <Card className="w-full h-[159px] rounded-xl overflow-hidden order-2 lg:order-2">
            <CardContent className="p-0 relative h-full">
              <Image
                src="/about-us/our-journey/2.png"
                alt="Our journey"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 655px"
                quality={85}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="w-full lg:w-[465px] h-[343px] rounded-xl border-none  shadow-none overflow-hidden order-3 lg:order-2">
          <CardContent className="p-0 relative h-full">
            <Image
              src="/about-us/our-journey/3.png"
              alt="Our journey"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 465px"
              quality={85}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
