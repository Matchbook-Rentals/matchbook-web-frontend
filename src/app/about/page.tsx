import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from '@/components/marketing-landing-components/footer';
import { MarketingPageHeader } from '@/components/marketing-landing-components/hero-frame';
import { AboutUsOurJourney } from '@/components/marketing-landing-components/about-us-our-journey';
import { Frame as MissionStatement } from '@/components/marketing-landing-components/about-us-mission-statement';
import { Frame as WhatMakesUsDifferent } from '@/components/marketing-landing-components/about-us-makes-us-different';

export default function AboutPage() {
  return (
    <>
      <MatchbookHeader />
      <div className="flex justify-center p-8">
        <MarketingPageHeader headerText="About Us" />
      </div>
      <AboutUsOurJourney />
      <MissionStatement />
      <WhatMakesUsDifferent />
      <Footer />
    </>
  );
}
