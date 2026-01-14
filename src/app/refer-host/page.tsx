import React from "react";
import { Metadata } from 'next';
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { MarketingPageHeader } from "@/components/marketing-landing-components/marketing-page-header";
import Footer from "@/components/marketing-landing-components/footer";
import { currentUser } from "@clerk/nextjs/server";
import { ReferHostHero } from "./refer-host-hero";
import { ReferHostHowItWorks } from "./refer-host-how-it-works";
import { getOrCreateReferralCode } from "@/lib/referral";
import { getHostListingsCountForUser } from "@/app/actions/listings";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Refer a Host',
  description: 'Refer a host to MatchBook and help them earn more from their midterm rental property.',
};

export default async function ReferHostPage(): Promise<React.ReactNode> {
  const user = await currentUser();

  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  // Get or create referral code for signed-in users
  let referralCode: string | null = null;
  if (user?.id) {
    try {
      referralCode = await getOrCreateReferralCode(user.id);
    } catch (error) {
      console.error('[ReferHostPage] Error getting referral code:', error);
    }
  }

  const hasListings = user?.id ? await getHostListingsCountForUser(user.id) > 0 : false;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <MatchbookHeader
        userId={user?.id || null}
        user={userObject}
        isSignedIn={!!user?.id}
        hasListings={hasListings}
      />
      <div className="flex justify-center p-8">
        <MarketingPageHeader
          headerText="Refer a Host"
          breadcrumbText="Refer a Host"
        />
      </div>
      <ReferHostHero isSignedIn={!!user?.id} referralCode={referralCode} />
      <ReferHostHowItWorks />
      <Footer />
    </div>
  );
}
