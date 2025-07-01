import React from "react";
import MatchbookHeader from "../../components/marketing-landing-components/matchbook-header";
import { DitchPaperwork } from "../../components/marketing-landing-components/ditch-paperwork";
import { ListYourProperty } from "../../components/marketing-landing-components/list-your-property";
import { TermTailoredPricing } from "../../components/marketing-landing-components/term-tailored-pricing";
import { MarketingPageHeader } from "../../components/marketing-landing-components/marketing-page-header";
import { HostsLoveMatchbook } from "../../components/marketing-landing-components/hosts-love-matchbook";
import { ReviewsSection } from "../../components/marketing-landing-components/reviews-section";
import Footer from "@/components/marketing-landing-components/footer";


export default function HostsPage(): React.ReactNode {
  return (
    <div className="bg-background">
      <MatchbookHeader />
      <div className="flex justify-center p-8">
        <MarketingPageHeader 
          headerText="Become a Host"
          highlightedText="Earn More, Keep More"
        />
      </div>
      <HostsLoveMatchbook />
      <ReviewsSection />
      <DitchPaperwork />
      <div className="flex justify-center px-8 py-16">
        <ListYourProperty />
      </div>
      <TermTailoredPricing />
      <Footer />
    </div>
  );
}
