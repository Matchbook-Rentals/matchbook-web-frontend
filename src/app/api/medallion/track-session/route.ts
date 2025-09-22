import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import crypto from "crypto";

// Simple rate limiting for session tracking (prevent abuse)
const sessionRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkSessionRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window
  const maxRequests = 5; // Max 5 session creations per 5 minutes per user

  const userLimit = sessionRateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    sessionRateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
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

    // Check rate limit for session creation
    if (!checkSessionRateLimit(userId)) {
      console.warn(`Session tracking rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, dob } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !dob) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName, and dob are required" },
        { status: 400 }
      );
    }

    console.log('🔍 Tracking Medallion verification session for user:', userId);

    // Generate a unique session token for CSRF protection and tracking
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Update user with session info and verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store authenticated identity info (matching the user's legal documents)
        authenticatedFirstName: firstName.trim(),
        authenticatedLastName: lastName.trim(),
        authenticatedDateOfBirth: dob.trim(),
        // Session tracking
        medallionSessionToken: sessionToken,
        // Mark verification as started
        medallionVerificationStatus: "pending",
        medallionVerificationStartedAt: new Date(),
        // Clear any previous verification state
        medallionIdentityVerified: false,
        medallionVerificationCompletedAt: null,
      },
    });

    console.log('✅ Session tracked successfully:', {
      userId,
      sessionToken: sessionToken.substring(0, 8) + '...',
      verificationStatus: 'pending'
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      message: "Verification session tracked successfully",
      note: "User is ready for LOW_CODE_SDK verification flow"
    });

  } catch (error) {
    console.error("Error tracking Medallion verification session:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}