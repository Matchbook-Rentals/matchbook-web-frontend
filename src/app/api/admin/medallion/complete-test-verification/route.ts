import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Test endpoint to directly mark medallion identity as verified with fake data
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse JSON body, but handle empty bodies gracefully
    let targetUserId;
    try {
      const body = await request.json();
      targetUserId = body.targetUserId;
    } catch (error) {
      // If JSON parsing fails (empty body), targetUserId will remain undefined
      targetUserId = undefined;
    }

    // For testing, allow setting verification for current user if no targetUserId specified
    const userIdToUpdate = targetUserId || userId;

    console.log(`🧪 [TEST] Completing authentication verification for user ${userIdToUpdate} using fake data`);

    // Update user with fake verification data for testing
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        medallionIdentityVerified: true,
        medallionVerificationStatus: "approved",
        medallionVerificationCompletedAt: new Date(),
        // Set fake data if not already present
        medallionUserId: "test-medallion-user-id-" + userIdToUpdate,
        medallionUserAccessCode: "test-access-code-" + userIdToUpdate,
        medallionVerificationStartedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      select: {
        id: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    console.log(`✅ [TEST] User authentication completed with fake data:`, updatedUser);

    return NextResponse.json({
      success: true,
      message: "Authentication verification completed with test data",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error completing test verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}