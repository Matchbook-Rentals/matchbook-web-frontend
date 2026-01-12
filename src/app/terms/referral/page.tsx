import React from "react";
import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "MatchBook Rentals | Referral Program Terms",
  description: "Terms and conditions for the MatchBook host referral program.",
};

function ReferralHtmlContent({ htmlContent }: { htmlContent: string }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default async function ReferralTermsPage() {
  const user = await currentUser();

  const userObject = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        emailAddresses: user.emailAddresses?.map((email) => ({
          emailAddress: email.emailAddress,
        })),
        publicMetadata: user.publicMetadata,
      }
    : null;

  const htmlFilePath = path.join(
    process.cwd(),
    "src",
    "legal",
    "referral-program-12-15-25.html"
  );
  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  return (
    <LegalPageTemplate
      userId={user?.id || null}
      user={userObject}
      isSignedIn={!!user?.id}
      pageTitle="Referral Program Terms"
    >
      <ReferralHtmlContent htmlContent={htmlContent} />
    </LegalPageTemplate>
  );
}
