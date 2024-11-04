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
        className="
        w-[95%] sm:w-4/5 md:w-3/5 
        h-[70vh] sm:h-[84vh] md:h-[77vh] px-6 sm:px-10 pt-4 
        overflow-y-scroll     ">
        <Countdown />
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
    title: "Find a place, all in one place.",
    description:
      "Sick of clicking through tabs? Us too. Here, you can find a place you love on a singular website, with verified landlords.",
  },
  {
    number: 2,
    title: "Swipe to find your perfect match.",
    description:
      "Swipe through places that match your preferences, and match with landlords who like your renting history back! It's like online dating, but without a fear of commitment.",
  },
  {
    number: 3,
    title: "One application, unlimited options.",
    description:
      "No more paying $50 fees just to be rejected; unless you're into that kind of thing? With Matchbook, you fill out one application, for FREE. That's it.",
  },
  {
    number: 4,
    title: "Transparent pricing.",
    description:
      "Unlike those other renting websites (dare us to @ them?), what you see on the listing, is what you pay. We're not here to play games.",
  },
  {
    number: 5,
    title: "Rate your landlord.",
    description:
      "Why do landlords get to call your references but you can't call theirs? Ring ring! Welcome to the future. You finally get to see what other renters thought of their stay.",
  },
];

const listMarketingItems = [
  {
    number: 1,
    title: "Manage your place, all in one place",
    description:
      "Gone are the days of listing, managing, and taking payments all separately. On MatchBook you can list your property, view applications, match with potential guests, manage your bookings, and collect payment all in a single intuitive location.",
  },
  {
    number: 2,
    title: "List for free",
    description:
      "List your property for free and pay only after your first booking. The fee? Only 1%",
  },
  {
    number: 3,
    title: "Connect with MatchBook Verified Tenants",
    description:
      "MatchBook Verified tenants are pre-screened and ready to match! Enjoy easy to understand screenings with insight on prospects credit, eviction, and criminal history.",
  },
  {
    number: 4,
    title: "Rent automatically collected",
    description:
      "No more sending awkward texts. Rent is automatically collected each month from your tenant's bank and transferred to yours, completely free.",
  },
  {
    number: 5,
    title: "Manage your Calendar",
    description:
      "Easily view your property's performance, track move-in and move-out all from your property dashboard.",
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
const ApartmentImage = ({ className }) => {
  return (
    <img
      className={`h-20 w-20 ${className}`}
      src="/img/listing-type/apartment_icon.png"
    />
  );
};

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
        Icon={ApartmentImage}
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
