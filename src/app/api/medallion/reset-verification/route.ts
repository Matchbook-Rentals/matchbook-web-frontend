import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Simple rate limiting for reset attempts (prevent abuse)
const resetRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkResetRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minute window
  const maxRequests = 3; // Max 3 reset attempts per 10 minutes per user

  const userLimit = resetRateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    resetRateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check rate limit for reset attempts
    if (!checkResetRateLimit(userId)) {
      console.warn(`Reset verification rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    console.log(`🔄 Resetting verification for user: ${userId}`);

    // Get current verification status to log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        medallionVerificationStatus: true,
        medallionIdentityVerified: true,
        medallionUserAccessCode: true,
      }
    });

    if (currentUser) {
      console.log(`📊 Current status before reset:`, {
        status: currentUser.medallionVerificationStatus,
        verified: currentUser.medallionIdentityVerified,
        hasAccessCode: !!currentUser.medallionUserAccessCode
      });
    }

    // Reset verification state to allow retry
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Clear verification status
        medallionVerificationStatus: null,
        medallionIdentityVerified: false,
        medallionVerificationCompletedAt: null,

        // Clear session data
        medallionSessionToken: null,

        // Keep userAccessCode for webhook matching, but clear verification state
        // medallionUserAccessCode: null, // Keep this for webhook matching

        // Clear timing data
        medallionVerificationStartedAt: null,
      },
    });

    console.log(`✅ Verification reset successfully for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Verification status reset successfully. You can now retry verification.",
    });

  } catch (error) {
    console.error("Error resetting verification:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}