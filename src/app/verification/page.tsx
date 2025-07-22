import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { MarketingPageHeader } from "@/components/marketing-landing-components/marketing-page-header";
import { VerificationHowItWorks } from "@/components/marketing-landing-components/verification-how-it-works";
import { currentUser } from "@clerk/nextjs/server";

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

  return (
    <>
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} />
      <div className="flex justify-center p-8">
        <MarketingPageHeader headerText="MatchBook Renter Verification" />
      </div>
      <div className="flex justify-center">
        <VerificationHowItWorks />
      </div>
      <Footer />
    </>
  );
}
