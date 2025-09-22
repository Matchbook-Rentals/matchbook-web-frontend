import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 20; // Max 20 requests per minute per user

  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new rate limit entry
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
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

    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        { error: "Too many verification status requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    // Get user data including medallionUserAccessCode for API polling
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.medallionUserAccessCode) {
      console.log(`⏳ User ${userId} missing medallionUserAccessCode - verification still initializing:`, {
        userId,
        medallionUserId: user.medallionUserId,
        hasAccessCode: false,
        verificationStatus: user.medallionVerificationStatus,
        isVerified: user.medallionIdentityVerified
      });

      // Instead of failing, return pending status - verification might still be initializing
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          medallionVerificationStatus: user.medallionVerificationStatus || 'pending',
          medallionIdentityVerified: false,
        },
        message: "Verification still initializing - userAccessCode not yet available"
      });
    }

    // Poll Medallion's API for verification status
    const medallionApiKey = process.env.MEDALLION_API_KEY;
    if (!medallionApiKey) {
      return NextResponse.json(
        { error: "Medallion API key not configured" },
        { status: 500 }
      );
    }

    console.log(`🔍 Polling Medallion API for user ${userId}, userAccessCode: ${user.medallionUserAccessCode?.substring(0, 8)}...`);

    const medallionResponse = await fetch('https://api-v3.authenticating.com/user/getTestResult', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${medallionApiKey}`,
      },
      body: JSON.stringify({
        userAccessCode: user.medallionUserAccessCode
      }),
    });

    if (!medallionResponse.ok) {
      console.error(`❌ Medallion API error: ${medallionResponse.status} ${medallionResponse.statusText}`);

      // If user not found in Medallion, they might not have completed verification yet
      if (medallionResponse.status === 404) {
        console.log(`📊 User ${userId} not found in Medallion API (404) - verification still pending`);
        return NextResponse.json({
          success: true,
          data: {
            ...user,
            medallionVerificationStatus: 'pending',
            medallionIdentityVerified: false,
          },
          message: "Verification still in progress"
        });
      }

      return NextResponse.json(
        { error: `Medallion API error: ${medallionResponse.status}` },
        { status: 500 }
      );
    }

    const medallionData = await medallionResponse.json();
    console.log(`✅ Medallion API response received for user ${userId}`);

    // Extract verification status from Medallion response
    const isVerificationPassed = checkVerificationStatus(medallionData);
    const verificationStatus = isVerificationPassed ? 'approved' : 'rejected';

    // Update user record with fresh data from Medallion
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        medallionIdentityVerified: isVerificationPassed,
        medallionVerificationStatus: verificationStatus,
        medallionVerificationCompletedAt: isVerificationPassed ? new Date() : null,
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

    console.log(`📝 Updated user ${userId} verification status: ${verificationStatus} (verified: ${isVerificationPassed})`);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      medallionData: {
        idVerificationStatus: medallionData.idVerification?.status,
        isIdVerified: medallionData.scannedUser?.IsIDVerified,
        verifyResult: medallionData.verifyUI?.scannedUser?.result,
      }
    });

  } catch (error) {
    console.error("Error polling Medallion verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function checkVerificationStatus(medallionData: any): boolean {
  // Check multiple indicators for verification success
  const idVerificationPassed = medallionData.idVerification?.status === 'PASS';
  const documentVerified = medallionData.scannedUser?.IsIDVerified === true;
  const verifyUIComplete = medallionData.verifyUI?.scannedUser?.result === 'complete';

  // Log the key verification indicators
  console.log('📊 Medallion verification indicators:', {
    idVerificationStatus: medallionData.idVerification?.status,
    isIdVerified: medallionData.scannedUser?.IsIDVerified,
    verifyUIResult: medallionData.verifyUI?.scannedUser?.result,
    faceMatchScore: medallionData.photoProof?.face_match_score,
  });

  // Verification passes if ID verification passed AND document is verified
  return idVerificationPassed && documentVerified;
}