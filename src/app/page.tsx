import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Hero from "@/components/home-components/hero";
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import Footer from "@/components/marketing-landing-components/footer";
import { HowItWorks } from "@/components/home-components/how-it-works";
import { BecomeHostCopy } from "@/components/home-components/become-host";
import { ProsConsGrid } from "@/components/home-components/pros-cons-grid";
import RecentArticle from "@/components/home-components/recent-article";
import FAQSection from "@/components/home-components/faq-section";
import { auth, currentUser } from "@clerk/nextjs/server";
import { checkClientBetaAccess } from "@/utils/client-roles";
import { getUserTripsCount } from "@/app/actions/trips";
import { HomePageWrapper } from "@/components/home-page-wrapper";

const WebHomePage = async () => {
  const user = await currentUser();
  const spacerDivClassNames = "h-[90px]";

  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  // Derive hasAccess from server-side user data
  const hasAccess = user ? checkClientBetaAccess(user.publicMetadata.role as string) : false;
  
  // Get trip count if user has access
  const tripCount = hasAccess && user?.id ? await getUserTripsCount() : 0;

  return (
    <HomePageWrapper>
      <div className="overflow-x-hidden bg-background">
        <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} />
        <Hero hasAccess={hasAccess} tripCount={tripCount} isSignedIn={!!user?.id} />
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
    </HomePageWrapper>
  );
};

export default WebHomePage;
