import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import MedallionAdminClient from "./medallion-admin-client";

export default async function MedallionAdminPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get all users for selection dropdown
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      medallionUserId: true,
      medallionUserAccessCode: true,
      medallionVerificationStatus: true,
      medallionIdentityVerified: true,
      medallionVerificationStartedAt: true,
      medallionVerificationCompletedAt: true,
    },
    orderBy: [
      { medallionVerificationStartedAt: 'desc' },
      { firstName: 'asc' },
    ],
  });

  // Filter users with Medallion data for display
  const usersWithMedallionData = allUsers.filter(user =>
    user.medallionUserId ||
    user.medallionUserAccessCode ||
    user.medallionVerificationStatus
  );

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Medallion Admin Dashboard</h1>

        <MedallionAdminClient
          users={usersWithMedallionData}
          allUsers={allUsers}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}