import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { PersonalInformationSection } from "@/components/verification/personal-information-section";
import { VerificationFormSection } from "@/components/verification/verification-form-section";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function VerificationPage() {
  const user = await currentUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in?redirect_url=/app/verification");
  }

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex flex-col w-full max-w-[1140px] items-start justify-center gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-3900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                  MatchBook Renter Verification
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col items-start justify-center gap-6 w-full">
            <PersonalInformationSection />
            <VerificationFormSection />
          </div>
        </div>
      </div>
    </>
  );
}
