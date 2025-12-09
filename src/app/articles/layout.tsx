
import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { currentUser } from "@clerk/nextjs/server";
import { PAGE_MARGIN } from "@/constants/styles";


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

  return (
    <>
      <MatchbookHeader userId={user?.id || null} user={userObject} isSignedIn={!!user?.id} containerClassName={`${PAGE_MARGIN} px-0`} />
      {children}
      <Footer />
    </>
  );
}
