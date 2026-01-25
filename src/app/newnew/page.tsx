import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Hero from "@/components/home-components/hero";
import PopularListingsSectionWrapper from "@/components/home-components/popular-listings-section-wrapper";
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import Footer from "@/components/marketing-landing-components/footer";
import { HowItWorks } from "@/components/home-components/how-it-works";
import { BecomeHostCopy } from "@/components/home-components/become-host";
import { ProsConsGrid } from "@/components/home-components/pros-cons-grid";
import RecentArticle from "@/components/home-components/recent-article";
import FAQSection from "@/components/home-components/faq-section";
import { currentUser } from "@clerk/nextjs/server";
import { getUserTripsCount, getMostRecentTrip } from "@/app/actions/trips";
import { HomePageWrapper } from "@/components/home-page-wrapper";
import { getPopularListingAreas } from "@/app/actions/listings";
import { checkAdminAccess } from "@/utils/roles";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Monthly Rentals',
  description: 'MatchBook is a monthly rental platform built to make renting easier and more affordable for hosts and renters. Find furnished and unfurnished rentals, with leases from 30 days to 1 year.',
};

const SPACER_CLASS = "h-[90px]";

const Spacer = () => <div className={SPACER_CLASS} />;

const serializeUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map((email: any) => ({
      emailAddress: email.emailAddress
    })),
    publicMetadata: user.publicMetadata
  };
};

const NewNewHomePage = async () => {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    redirect('/');
  }

  const [user, popularAreas] = await Promise.all([
    currentUser(),
    getPopularListingAreas(5) // Fetch 5 to account for potential skips
  ]);

  const userObject = serializeUser(user);
  const tripCount = user?.id ? await getUserTripsCount() : 0;
  const hasAccess = true;

  // Get user's most recent trip location if signed in
  let userTripLocation = null;
  if (user?.id) {
    const recentTrip = await getMostRecentTrip();
    if (recentTrip?.city || recentTrip?.locationString) {
      userTripLocation = {
        city: recentTrip.city,
        state: recentTrip.state,
        locationString: recentTrip.locationString,
        latitude: recentTrip.latitude,
        longitude: recentTrip.longitude,
        searchRadius: recentTrip.searchRadius,
      };
    }
  }

  return (
    <HomePageWrapper>
      <div className="overflow-x-hidden bg-background">
        <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} />
        <Hero hasAccess={hasAccess} tripCount={tripCount} isSignedIn={!!user?.id} />
        <Spacer />
        <PopularListingsSectionWrapper
          isSignedIn={!!user?.id}
          userTripLocation={userTripLocation}
          popularAreas={popularAreas}
        />
        <Spacer />
        <RentEasyCopy />
        <Spacer />
        <Spacer />
        <HowItWorks />
        <Spacer />
        <BecomeHostCopy />
        <Spacer />
        <ProsConsGrid />
        <Spacer />
        <RecentArticle />
        <Spacer />
        <FAQSection />
        <Spacer />
        <Footer />
      </div>
    </HomePageWrapper>
  );
};

export default NewNewHomePage;
