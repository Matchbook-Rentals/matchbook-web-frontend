import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import IdentityVerificationSDKClient from "./identity-verification-sdk-client";

export default async function IdentityVerificationPage({
  searchParams,
}: {
  searchParams: {
    redirect_url?: string;
    completed?: string;
    medallion_user_id?: string;
    session_id?: string;
    user_id?: string;
    error?: string;
    [key: string]: string | undefined
  };
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
      authenticatedMiddleName: true,
      authenticatedLastName: true,
      authenticatedDateOfBirth: true,
      medallionIdentityVerified: true,
      medallionVerificationStatus: true,
      medallionUserId: true,
      medallionUserAccessCode: true,
    },
  });

  if (!userData) {
    redirect("/sign-in");
  }

  // Capture medallionUserId if provided in URL (from Medallion redirect)
  const medallionUserId = searchParams.medallion_user_id || searchParams.user_id;

  if (medallionUserId && !userData.medallionUserId) {
    console.log(`🆔 Capturing medallionUserId from URL: ${medallionUserId}`);

    // Store the medallionUserId in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        medallionUserId: medallionUserId,
      },
    });

    // Update local userData
    userData.medallionUserId = medallionUserId;
  }

  // Validate session for LOW_CODE_SDK redirect (simplified validation)
  if (searchParams.completed === 'true') {
    console.log('🔍 Medallion SDK redirect search params:', searchParams);

    // Validate session_id for CSRF protection
    const sessionId = searchParams.session_id;

    if (!sessionId) {
      console.error('❌ Missing session_id in verification redirect');
      redirect("/app/host/onboarding/identity-verification?error=invalid_redirect");
    }

    // Verify session token in database
    const sessionValidation = await prisma.user.findUnique({
      where: { id: userId },
      select: { medallionSessionToken: true },
    });

    if (!sessionValidation?.medallionSessionToken || sessionValidation.medallionSessionToken !== sessionId) {
      console.error('❌ Invalid session token in verification redirect');
      redirect("/app/host/onboarding/identity-verification?error=invalid_session");
    }

    // Clear the session token after successful validation
    await prisma.user.update({
      where: { id: userId },
      data: { medallionSessionToken: null },
    });

    console.log('✅ Session validation passed for LOW_CODE_SDK redirect');
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
        authenticatedFirstName: true,
        authenticatedMiddleName: true,
        authenticatedLastName: true,
        authenticatedDateOfBirth: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
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
    <IdentityVerificationSDKClient
      userData={finalUserData}
      redirectUrl={searchParams.redirect_url}
      isReturningFromVerification={searchParams.completed === 'true'}
      error={searchParams.error}
    />
  );
}