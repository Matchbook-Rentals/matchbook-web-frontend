'use client'
import React from "react";
import '@/app/utils/animaStyles.css'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Hero from "@/components/home-components/hero";
import AdCopy from "@/components/home-components/adCopy";
import MarketingList from "@/components/marketing-landing-components/marketing-list";
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import { ApartmentIcon } from "@/components/svgs/svg-components";

const marketingItems = [
  {
    number: 1,
    title: "Find a place, all in one place.",
    description: "Sick of clicking through tabs? Us too. Here, you can find a place you love on a singular website, with verified landlords."
  },
  {
    number: 2,
    title: "Swipe to find your perfect match.",
    description: "Swipe through places that match your preferences, and match with landlords who like your renting history back! It's like online dating, but without a fear of commitment."
  },
  {
    number: 3,
    title: "One application, unlimited options.",
    description: "No more paying $50 fees just to be rejected; unless you're into that kind of thing? With Matchbook, you fill out one application, for FREE. That's it."
  },
  {
    number: 4,
    title: "Transparent pricing.",
    description: "Unlike those other renting websites (dare us to @ them?), what you see on the listing, is what you pay. We're not here to play games."
  },
  {
    number: 5,
    title: "Rate your landlord.",
    description: "Why do landlords get to call your references but you can't call theirs? Ring ring! Welcome to the future. You finally get to see what other renters thought of their stay."
  }
];

const WebHomePage = () => {
  return (
    <>
      <MatchbookHeader />
      <Hero />
      <AdCopy />
      <MarketingList title="Looking to rent?" Icon={ApartmentIcon} marketingItems={marketingItems} brandColor="primary" />
      <RentEasyCopy />
    </>
  );
};

export default WebHomePage;