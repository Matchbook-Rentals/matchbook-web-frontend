
import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { currentUser } from "@clerk/nextjs/server";
import { PAGE_MARGIN } from "@/constants/styles";
import { getHostListingsCountForUser } from "@/app/actions/listings";


export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} containerClassName={`${PAGE_MARGIN} px-0`} hasListings={hasListings} />
      {children}
      <Footer />
    </>
  );
}
