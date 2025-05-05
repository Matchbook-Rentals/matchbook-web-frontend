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
  //useEffect(() => {
  //  if (autoOpen) {
  //    const timer = setTimeout(() => {
  //      setIsOpen(true);
  //    }, 1000);
  //
  //    return () => clearTimeout(timer);
  //  }
  //}, [setIsOpen, autoOpen]);

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
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import Footer from "@/components/marketing-landing-components/footer";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/home-components/how-it-works";
import { RentersLoveMatchbook } from "@/components/home-components/renters-love-matchbook";
import { BecomeHostCopy } from "@/components/home-components/become-host";
import { ProsConsGrid } from "@/components/home-components/pros-cons-grid";
import { PlaceYouLove } from "@/components/home-components/place-you-love";
import RecentArticle from "@/components/home-components/recent-article";


const WebHomePage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-x-hidden">
      <MatchbookHeader  />
      <Hero />
      <RentEasyCopy />
      <HowItWorks />
      <RentersLoveMatchbook />
      <BecomeHostCopy />
      <ProsConsGrid />
      <PlaceYouLove />
      <RecentArticle />
      <Footer />
    </div>
  );
};

export default WebHomePage;

export { CountdownDialog }
