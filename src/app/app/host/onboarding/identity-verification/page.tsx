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
      medallionIdentityVerified: true,
      medallionVerificationStatus: true,
      medallionUserId: true,
    },
  });

  if (!userData) {
    redirect("/sign-in");
  }

  // Handle return from Medallion verification
  if (searchParams.completed === 'true') {
    // Re-fetch fresh verification status after Medallion redirect
    const freshUserData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
      },
    });

    if (freshUserData?.medallionIdentityVerified) {
      // Verification successful, redirect to target
      const redirectUrl = searchParams.redirect_url || "/app/host/dashboard/overview";
      redirect(redirectUrl);
    }
    // If not verified, fall through to show verification status/retry
  }

  // If already verified (not from Medallion redirect), redirect back
  if (userData.medallionIdentityVerified && searchParams.completed !== 'true') {
    const redirectUrl = searchParams.redirect_url || "/app/host/dashboard/overview";
    redirect(redirectUrl);
  }

  return (
    <IdentityVerificationClient
      userData={userData}
      redirectUrl={searchParams.redirect_url}
      isReturningFromVerification={searchParams.completed === 'true'}
    />
  );
}