import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import IdentityVerificationClient from "./identity-verification-client";

export default async function IdentityVerificationPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string; completed?: string };
}) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Get user data including verification status
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      authenticatedFirstName: true,
      authenticatedLastName: true,
      authenticatedDateOfBirth: true,
      medallionIdentityVerified: true,
      medallionVerificationStatus: true,
      medallionUserId: true,
    },
  });

  if (!userData) {
    redirect("/sign-in");
  }

  // Get fresh verification status if returning from Medallion
  let finalUserData = userData;
  if (searchParams.completed === 'true') {
    // Re-fetch fresh verification status after Medallion redirect
    const freshUserData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
        medallionVerificationCompletedAt: true,
        authenticatedDateOfBirth: true,
      },
    });

    if (freshUserData?.medallionIdentityVerified) {
      // Verification successful, redirect to target
      const redirectUrl = searchParams.redirect_url || "/app/host/dashboard/overview";
      redirect(redirectUrl);
    }

    // Update user data with fresh verification status for display
    if (freshUserData) {
      finalUserData = { ...userData, ...freshUserData };
    }
  }

  // If already verified (not from Medallion redirect), redirect back
  if (userData.medallionIdentityVerified && searchParams.completed !== 'true') {
    const redirectUrl = searchParams.redirect_url || "/app/host/dashboard/overview";
    redirect(redirectUrl);
  }

  return (
    <IdentityVerificationClient
      userData={finalUserData}
      redirectUrl={searchParams.redirect_url}
      isReturningFromVerification={searchParams.completed === 'true'}
    />
  );
}