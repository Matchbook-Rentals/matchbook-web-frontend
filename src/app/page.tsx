"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Countdown from "@/components/marketing-landing-components/countdown";
import BrevoIframe from "@/components/home-components/brevo-iframe";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

interface CountdownDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  autoOpen?: boolean;
}

const CountdownDialog = ({ isOpen, setIsOpen, autoOpen = false }: CountdownDialogProps) => {
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [setIsOpen, autoOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        xOnRight
        className="
        w-[95%] sm:w-4/5 md:w-3/5 
        h-fit pb-8 pt-0 
        px-6 sm:px-10  
        rounded-lg flex flex-col items-start md:max-h-[700px]   ">
      <h1 className="text-3xl sm:text-4xl text-left  mt-8  mb-2 font-semibold">Get ready for launch!</h1>
        <BrevoIframe />
      </DialogContent>
    </Dialog>
  );
};

import "@/app/utils/animaStyles.css";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Hero from "@/components/home-components/hero";
import AdCopy from "@/components/home-components/adCopy";
import MarketingList from "@/components/marketing-landing-components/marketing-list";
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import Footer from "@/components/marketing-landing-components/footer";
import {
  ApartmentIcon,
  SingleHomeIcon,
} from "@/components/svgs/svg-components";
import TabSelector from "@/components/ui/tab-selector";
import { MarketingSteps } from "@/components/marketing-landing-components/how-it-works";
import { Button } from "@/components/ui/button";

const rentMarketingItems = [
  {
    number: 1,
    title: "Find a Place, All in One Place",
    description:
      "Tired of endless tabs and sketchy listings? Us too. On MatchBook, you can find mid-term, long-term, and furnished rental properties you’ll love, all on one site—with verified landlords you can trust.",
  },
  {
    number: 2,
    title: "Get Your Perfect Match",
    description:
      "Search for rental properties that match your preferences and connect with landlords who love your renting history! It's like online dating, but without a fear of commitment.",
  },
  {
    number: 3,
    title: "One Application, Unlimited Options",
    description:
      "No more paying $50 fees per application, just to be rejected (unless you’re into that kind of thing?). With MatchBook, you fill out one rental application for access to unlimited furnished or unfurnished, mid-term and long-term rental options. Simple, fast, and frustration-free.",
  },
  {
    number: 4,
    title: "Transparent Pricing",
    description:
      "No hidden fees, no surprises. Unlike those other renting websites (dare us to @ them?), what you see on the listing is exactly what you’ll pay. We’re not here to play games. ",
  },
  {
    number: 5,
    title: "Rate Your Landlord",
    description:
      "Why do landlords get to call your references, but you can't call theirs? Ring ring- it's the future calling! You finally get to see what other renters thought of their stay",
  },
];

const listMarketingItems = [
  {
    number: 1,
    title: "Manage Your Place, All in One Place",
    description:
      "Gone are the days of juggling different platforms for listing, managing, and taking payments. With MatchBook, you can list your rental property, view tenant applications, match with potential guests, manage bookings, and collect rent—all in one seamless and intuitive platform designed for mid-term, long-term, and furnished rentals.",
  },
  {
    number: 2,
    title: "List for Free",
    description:
      "List your furnished or unfurnished rental property for free and start earning without upfront costs. Pay only after your first booking, with a low fee of just 1%. Perfect for landlords managing mid-term or long-term rentals!",
  },
  {
    number: 3,
    title: "Connect with MatchBook Verified Tenants",
    description:
      "MatchBook Verified tenants are pre-screened, so you don’t have to worry about surprises. Quickly review tenant credit, eviction, and criminal history with easy-to-understand screening reports. Find the perfect match for your rental property faster.",
  },
  {
    number: 4,
    title: "Rent Automatically Collected",
    description:
      "No more chasing rent or sending awkward texts. With MatchBook, rent is automatically collected each month from your tenant’s bank account or credit card and securely transferred to you. It’s free, easy, and stress-free for landlords and tenants alike.",
  },
  {
    number: 5,
    title: "Manage Your Calendar",
    description:
      "Effortlessly track move-in and move-out dates, monitor your property’s performance, and stay on top of bookings with MatchBook’s property management dashboard. Simplify your rental management, all from one convenient calendar.",
  },
];

interface Tab {
  value: string;
  label: string;
  icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
}

const tabs: Tab[] = [
  {
    value: "rent",
    label: "For Guests",
    className:
      "bg-primaryBrand/80 hover:bg-primaryBrand hover:text-black  w-1/2",
    textSize: "text-lg",
    content: (
      <MarketingList
        title="Looking to rent?"
        Icon={ApartmentIcon}
        marketingItems={rentMarketingItems}
        brandColor="primary"
      />
    ),
  },
  {
    value: "list",
    label: "For Hosts",
    className: "bg-blueBrand/80 hover:bg-blueBrand hover:text-black w-1/2",
    textSize: "text-lg",
    content: (
      <MarketingList
        title="Looking to list?"
        Icon={SingleHomeIcon}
        marketingItems={listMarketingItems}
        brandColor="secondary"
      />
    ),
  },
];

const WebHomePage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MatchbookHeader handleListProperty={() => setIsOpen(true)} />
      <Hero />
      <div className="scale-75 mb-12">
        <AdCopy />
        {/* this is here to temporarily get people to the right marketing info */}
        <div id="list-your-property" className="mb-16" />
      </div>
      <CountdownDialog autoOpen isOpen={isOpen} setIsOpen={setIsOpen} />
      <MarketingSteps />
      <TabSelector
        useUrlParams
        tabs={tabs}
        className="max-w-[800px] px-8 mx-auto mt-12 xs:mt-32 border-b-0"
        tabsListClassName="justify-center w-full border-b-0 mx-auto mb-12"
      />
      <div className="justify-center flex border-b-0 mx-auto w-1/2 p-6">
        <Button className={`bg-blueBrand px-16 mt-2 py-2 text-background text-xl rounded-sm ${montserrat.className}`} onClick={() => setIsOpen(true)}> Get Notified </Button>
      </div>
      <div className="flex w-full justify-center"> <img className="h-20 mb-36 mt-36" src="/heart-logo.png" /> </div>
      <RentEasyCopy />
      <Footer />
    </>
  );
};

export default WebHomePage;


export { CountdownDialog }
