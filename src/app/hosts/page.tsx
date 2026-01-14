import React from "react";
import { Metadata } from 'next';
import MatchbookHeader from "../../components/marketing-landing-components/matchbook-header";
import { DitchPaperwork } from "../../components/marketing-landing-components/ditch-paperwork";
import { ListYourProperty } from "../../components/marketing-landing-components/list-your-property";
import { TermTailoredPricing } from "../../components/marketing-landing-components/term-tailored-pricing";
import { MarketingPageHeader } from "../../components/marketing-landing-components/marketing-page-header";
import { HostsLoveMatchbook } from "../../components/marketing-landing-components/hosts-love-matchbook";
import { ReviewsSection } from "../../components/marketing-landing-components/reviews-section";
import Footer from "@/components/marketing-landing-components/footer";
import { currentUser } from "@clerk/nextjs/server";
import { HostsPageWrapper } from "@/components/hosts-page-wrapper";
import { getHostListingsCountForUser } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Become a Host',
  description: 'Become a MatchBook host today. List your midterm rental, screen renters, manage bookings, and receive rent directly to your account; all completely free.',
};


export default async function HostsPage(): Promise<React.ReactNode> {
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

  const hasListings = user?.id ? await getHostListingsCountForUser(user.id) > 0 : false;

  return (
    <HostsPageWrapper>
      <div className="bg-background">
        <MatchbookHeader
          userId={user?.id || null}
          user={userObject}
          isSignedIn={!!user?.id}
          buttonText="List Your Property"
          buttonHref="/app/host/add-property"
          hasListings={hasListings}
        />
        <div className="flex justify-center p-8">
          <MarketingPageHeader
            headerText="Become a Host"
            highlightedText="Earn More, Keep More"
            breadcrumbText="Become a host"
          />
        </div>

        <div className="w-full flex justify-center mt-12 bg-background" >
          <BrandButton size='xl' className="px-10" href="/app/host/add-property">
            List Your Property
          </BrandButton>
        </div>
        <HostsLoveMatchbook />
        <ReviewsSection />
        <DitchPaperwork />
        <TermTailoredPricing />
        <ListYourProperty />
        <Footer />
      </div>
    </HostsPageWrapper>
  );
}
