import { Metadata } from 'next';
import SearchNavbar from "@/components/newnew/search-navbar";
import Footer from "@/components/marketing-landing-components/footer";
import RentEasyCopy from "@/components/marketing-landing-components/rent-easy-copy";
import { HowItWorks } from "@/components/home-components/how-it-works";
import { BecomeHostCopy } from "@/components/home-components/become-host";
import { ProsConsGrid } from "@/components/home-components/pros-cons-grid";
import RecentArticle from "@/components/home-components/recent-article";
import FAQSection from "@/components/home-components/faq-section";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { getAllUserTrips } from "@/app/actions/trips";
import { RecentSearch } from "@/components/newnew/search-navbar";
import { getPopularListingAreas, getHostListingsCountForUser } from "@/app/actions/listings";
import { HomePageWrapper } from "@/components/home-page-wrapper";

export const metadata: Metadata = {
  title: 'How It Works | MatchBook Rentals',
  description: 'Learn how MatchBook makes monthly renting easier and more affordable for hosts and renters.',
};

const SPACER_CLASS = "h-[40px] md:h-[90px]";

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

const HowItWorksPage = async () => {
  const [user, popularAreas] = await Promise.all([
    currentUser(),
    getPopularListingAreas(5)
  ]);

  const userObject = serializeUser(user);
  const hasListings = user?.id ? await getHostListingsCountForUser(user.id) > 0 : false;

  let recentSearches: RecentSearch[] = [];
  if (user?.id) {
    try {
      const trips = await getAllUserTrips();
      recentSearches = trips.slice(0, 3).map((trip) => {
        const formatDate = (d: Date | null | undefined) =>
          d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const totalRenters = (trip.numAdults ?? 0) + (trip.numChildren ?? 0);
        const dateStr = trip.startDate && trip.endDate
          ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
          : 'Flexible dates';
        const renterStr = totalRenters === 0
          ? 'Add Renters'
          : `${totalRenters} Renter${totalRenters !== 1 ? 's' : ''}`;
        return {
          tripId: trip.id,
          location: trip.locationString || 'Unknown location',
          details: `${dateStr} - ${renterStr}`,
        };
      });
    } catch {
      // User may not be authenticated or trips may fail - that's fine
    }
  }

  return (
    <HomePageWrapper>
      <div className="overflow-x-hidden bg-background">
        <SearchNavbar
          userId={user?.id || null}
          user={userObject}
          isSignedIn={!!user?.id}
          hasListings={hasListings}
          recentSearches={recentSearches}
          suggestedLocations={popularAreas.map((area) => ({
            title: `Monthly Rentals in ${area.city}, ${area.state}`,
          }))}
        />
        <div className="h-[40px]" />
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

export default HowItWorksPage;
