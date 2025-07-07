import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from '@/components/marketing-landing-components/footer';
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header';
import { AboutUsOurJourney } from '@/components/marketing-landing-components/about-us-our-journey';
import { Frame as MissionStatement } from '@/components/marketing-landing-components/about-us-mission-statement';
import { Frame as WhatMakesUsDifferent } from '@/components/marketing-landing-components/about-us-makes-us-different';
import { AboutUsLookingAhead } from '@/components/marketing-landing-components/about-us-looking-ahead';
import { currentUser } from "@clerk/nextjs/server";

export default async function AboutPage() {
  const user = await currentUser();

  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  return (
    <>
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} />
      <div className="flex justify-center p-8">
        <MarketingPageHeader headerText="About Us" />
      </div>
      <AboutUsOurJourney />
      <MissionStatement />
      <WhatMakesUsDifferent />
      <AboutUsLookingAhead />
      <Footer />
    </>
  );
}
