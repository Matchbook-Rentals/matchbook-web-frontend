import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import IdentityVerificationClient from "./identity-verification-client";

export default async function IdentityVerificationPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
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

  // If already verified, redirect back
  if (userData.medallionIdentityVerified) {
    const redirectUrl = searchParams.redirect_url || "/app/host/dashboard/overview";
    redirect(redirectUrl);
  }

  return (
    <IdentityVerificationClient
      userData={userData}
      redirectUrl={searchParams.redirect_url}
    />
  );
}