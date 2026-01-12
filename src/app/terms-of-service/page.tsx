import { Metadata } from 'next';
import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";
import { TermsHtmlContent } from "./terms-html-content";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: 'Terms of Service',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TermsOfServicePage() {
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

  // Read the HTML file on the server
  const htmlFilePath = path.join(
    process.cwd(),
    "src",
    "legal",
    "terms-of-service-12-15-25.html"
  );
  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  return (
    <LegalPageTemplate
      userId={userId}
      user={userObject}
      isSignedIn={isSignedIn}
      pageTitle="Terms of Service"
    >
      <TermsHtmlContent htmlContent={htmlContent} />
    </LegalPageTemplate>
  );
}