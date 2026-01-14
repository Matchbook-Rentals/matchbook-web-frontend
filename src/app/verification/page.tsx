import { Metadata } from 'next';
import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { MarketingPageHeader } from "@/components/marketing-landing-components/marketing-page-header";
import { VerificationHowItWorks } from "@/components/marketing-landing-components/verification-how-it-works";
import { VerificationWhyItMatters } from "@/components/marketing-landing-components/verification-why-it-matters";
import { VerificationStandOut } from "@/components/marketing-landing-components/verification-stand-out";
import { currentUser } from "@clerk/nextjs/server";
import { getHostListingsCountForUser } from "@/app/actions/listings";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Renter Verification',
  description: 'MatchBook\'s comprehensive renter verification includes background checks, credit reports, and income verification to help hosts find qualified tenants.',
};

export default async function VerificationPage() {
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
    <main className="max-w-full overflow-hidden">
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} hasListings={hasListings} />
      <div className="flex justify-center p-8 bg-background">
        <MarketingPageHeader headerText="MatchBook Renter Verification" breadcrumbText="Renter Verification" />
      </div>
      <div className="flex justify-center">
        <VerificationHowItWorks />
      </div>
      <VerificationWhyItMatters />
      <VerificationStandOut />
      <Footer />
    </main>
  );
}
