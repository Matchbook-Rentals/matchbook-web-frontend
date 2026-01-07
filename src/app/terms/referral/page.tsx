import React from "react";
import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import LegalPageTemplate from "@/components/legal-page-template";

export const metadata: Metadata = {
  title: "MatchBook Rentals | Referral Program Terms",
  description: "Terms and conditions for the MatchBook host referral program.",
};

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

  return (
    <LegalPageTemplate
      userId={user?.id || null}
      user={userObject}
      isSignedIn={!!user?.id}
      pageTitle="Referral Program Terms"
    >
      <div className="space-y-6">
        <p className="text-gray-500">
          Referral program terms content will be added here.
        </p>
      </div>
    </LegalPageTemplate>
  );
}
