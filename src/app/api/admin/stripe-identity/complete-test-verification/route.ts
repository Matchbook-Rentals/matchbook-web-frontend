import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Test endpoint to directly mark Stripe Identity as verified with fake data
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

    console.log(`🧪 [TEST] Completing Stripe Identity verification for user ${userIdToUpdate} using fake data`);

    // Update user with fake verification data for testing
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        stripeVerificationStatus: "verified",
        stripeVerificationLastCheck: new Date(),
        stripeVerificationReportId: "test-stripe-report-id-" + userIdToUpdate,
        stripeVerificationSessionId: "test-stripe-session-id-" + userIdToUpdate,
        stripeIdentityPayload: {
          test: true,
          completedAt: new Date().toISOString(),
          userId: userIdToUpdate,
          status: "verified",
        },
      },
      select: {
        id: true,
        stripeVerificationStatus: true,
        stripeVerificationLastCheck: true,
        stripeVerificationReportId: true,
        stripeVerificationSessionId: true,
      },
    });

    console.log(`✅ [TEST] Stripe Identity verification completed with fake data:`, updatedUser);

    return NextResponse.json({
      success: true,
      message: "Stripe Identity verification completed with test data",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error completing test Stripe verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
