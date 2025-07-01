import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from '@/components/marketing-landing-components/footer';
import { MarketingPageHeader } from '@/components/marketing-landing-components/hero-frame';
import { AboutUsOurJourney } from '@/components/marketing-landing-components/about-us-our-journey';

export default function AboutPage() {
  return (
    <>
      <MatchbookHeader />
      <div className="flex justify-center p-8">
        <MarketingPageHeader headerText="About Us" />
      </div>
      <AboutUsOurJourney />
      <Footer />
    </>
  );
}
