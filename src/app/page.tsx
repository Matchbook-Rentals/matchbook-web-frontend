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

const WebHomePage = async () => {
  const { userId } = await auth();
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
    <div className="overflow-x-hidden bg-red-500">
      <MatchbookHeader userId={userId} user={userObject} isSignedIn={!!userId} />
      {/* 
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
       */}
    </div>
  );
};

export default WebHomePage;
