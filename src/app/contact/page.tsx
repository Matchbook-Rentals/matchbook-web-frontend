import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header';
import { ContactInformation } from '@/components/marketing-landing-components/contact-information';
import { ContactForm } from '@/components/marketing-landing-components/contact-form';
import { currentUser } from "@clerk/nextjs/server";

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

  return (
    <>
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} />
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
