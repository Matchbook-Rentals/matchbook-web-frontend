"use client";

import React, { useState } from "react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

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
import FAQSection from "@/components/home-components/faq-section";


const WebHomePage = () => {
  // Define the spacer class name variable
  const spacerDivClassNames = "h-[90px]";
  const shortSpacerClassNames = "";

  return (
    <div className="overflow-x-hidden">
      <MatchbookHeader />
      <Hero />
      <div className={spacerDivClassNames} />
      <RentEasyCopy />
      <div className={spacerDivClassNames} />
      <div className={spacerDivClassNames} />
      <HowItWorks />
      <div className={spacerDivClassNames} />
      <BecomeHostCopy />
      <div className={spacerDivClassNames} />
      <ProsConsGrid />
      <div className={spacerDivClassNames} />
      <RecentArticle />
      <div className={spacerDivClassNames} />
      <FAQSection />
      <div className={spacerDivClassNames} />
      <Footer />
    </div>
  );
};

export default WebHomePage;
