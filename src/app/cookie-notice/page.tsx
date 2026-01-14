import { Metadata } from 'next';
import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";
import { getHostListingsCountForUser } from "@/app/actions/listings";
import { CookieHtmlContent } from "./cookie-html-content";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: 'Cookie Notice',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CookieNoticePage() {
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

  // Read the HTML file on the server
  const htmlFilePath = path.join(
    process.cwd(),
    "src",
    "legal",
    "cookie-policy-09-10-25.html"
  );
  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  return (
    <LegalPageTemplate
      userId={userId}
      user={userObject}
      isSignedIn={isSignedIn}
      pageTitle="Cookie Notice"
      hasListings={hasListings}
    >
      <CookieHtmlContent htmlContent={htmlContent} />
    </LegalPageTemplate>
  );
}