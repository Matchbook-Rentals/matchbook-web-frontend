import { Metadata } from 'next';
import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header';
import { ContactInformation } from '@/components/marketing-landing-components/contact-information';
import { ContactForm } from '@/components/marketing-landing-components/contact-form';
import { currentUser } from "@clerk/nextjs/server";
import { getHostListingsCountForUser } from "@/app/actions/listings";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Contact Us',
  description: 'Have questions? Contact the MatchBook team. We\'re here to help hosts and renters with support for monthly rentals.',
};

export default async function ContactPage() {
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
    <>
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} hasListings={hasListings} />
      <div className="flex justify-center p-8">
        <MarketingPageHeader headerText="Contact Us" />
      </div>
      <div className="flex flex-col lg:flex-row px-8 pb-8 max-w-[1200px] mx-auto">
        <div className="lg:w-2/5">
          <ContactInformation />
        </div>
        <div className="lg:w-3/5">
          <ContactForm />
        </div>
      </div>
      <Footer />
    </>
  );
}
