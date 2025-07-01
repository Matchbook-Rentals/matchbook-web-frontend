import React from "react";
import { Card, CardContent } from "../ui/card";

export const AboutUsOurJourney = (): JSX.Element => {
  return (
    <section className="flex flex-col items-center gap-14 py-16">
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
            We did, and it was a bad time. When Isabelle and I left Active Duty
            Air force to attend school, we discovered that trying to find a
            flexible rental property was like finding a missing sock in a pile
            of laundry. We thought, "There has to be a better way!" And just
            like that, the idea for MatchBook was born. 3 years later and with
            the help of an amazing team, we have created a platform that makes
            connecting housing providers with guests a breeze for all types and
            schedules.
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row items-start gap-5 justify-center w-full px-4">
        <div className="flex flex-col w-full lg:w-[655px] items-start gap-5 order-1 lg:order-1">
          <Card className="w-full h-[163px] rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <img
                className="w-full h-[163px] object-cover"
                alt="People in uniform"
                src="/about-us/our-journey/1.png"
              />
            </CardContent>
          </Card>

          <Card className="w-full h-[159px] rounded-xl overflow-hidden order-2 lg:order-2">
            <CardContent className="p-0">
              <div className="w-full h-[159px] bg-[url(/about-us/our-journey/2.png)] bg-cover bg-center" />
            </CardContent>
          </Card>
        </div>

        <Card className="w-full lg:w-[465px] h-[343px] rounded-xl overflow-hidden order-3 lg:order-2">
          <CardContent className="p-0">
            <img
              className="w-full h-full object-cover"
              alt="Our journey"
              src="/about-us/our-journey/3.png"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};