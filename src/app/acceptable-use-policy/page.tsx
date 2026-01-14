import { Metadata } from 'next';
import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";
import { getHostListingsCountForUser } from "@/app/actions/listings";
import { AcceptableUseContent } from "./acceptable-use-content";

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AcceptableUsePolicyPage() {
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

  const userId = user?.id || null;
  const isSignedIn = !!user;
  const hasListings = user?.id ? await getHostListingsCountForUser(user.id) > 0 : false;

  return (
    <LegalPageTemplate
      userId={userId}
      user={userObject}
      isSignedIn={isSignedIn}
      pageTitle="Acceptable Use Policy"
      hasListings={hasListings}
    >
      <AcceptableUseContent />
    </LegalPageTemplate>
  );
}