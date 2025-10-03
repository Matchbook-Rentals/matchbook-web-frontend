import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";
import { CaliforniaPrivacyHtmlContent } from "./california-privacy-html-content";
import fs from "fs";
import path from "path";

export default async function CaliforniaPrivacyNoticePage() {
  const user = await currentUser();

  // Read HTML file on the server
  const htmlFilePath = path.join(
    process.cwd(),
    "src",
    "legal",
    "california-privacy-notice.html"
  );
  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

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

  return (
    <LegalPageTemplate
      userId={userId}
      user={userObject}
      isSignedIn={isSignedIn}
      pageTitle="Privacy Notice for California Residents and Other States"
    >
      <CaliforniaPrivacyHtmlContent htmlContent={htmlContent} />
    </LegalPageTemplate>
  );
}