import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Reset all Medallion data for a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    console.log(`🗑️ [ADMIN] Resetting ALL Medallion data for user ${targetUserId}`);

    // Reset ALL Medallion fields to null/false
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        medallionIdentityVerified: false,
        medallionVerificationStatus: null,
        medallionUserId: null,
        medallionUserAccessCode: null,
        medallionVerificationStartedAt: null,
        medallionVerificationCompletedAt: null,
        // Also reset any authenticated data that came from verification
        authenticatedFirstName: null,
        authenticatedLastName: null,
        authenticatedDateOfBirth: null,
      },
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
        authenticatedFirstName: true,
        authenticatedLastName: true,
        authenticatedDateOfBirth: true,
      },
    });

    console.log(`✅ [ADMIN] User ${targetUserId} Medallion data reset successfully`);

    return NextResponse.json({
      success: true,
      message: "Medallion data reset successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error resetting user Medallion data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}