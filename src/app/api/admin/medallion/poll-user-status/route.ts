import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

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

    // Get target user data including medallionUserAccessCode for API polling
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    if (!user.medallionUserAccessCode) {
      return NextResponse.json(
        { error: "No Medallion userAccessCode found for this user. Please set it first." },
        { status: 400 }
      );
    }

    // Poll Medallion's API for verification status
    const medallionApiKey = process.env.MEDALLION_API_KEY;
    if (!medallionApiKey) {
      return NextResponse.json(
        { error: "Medallion API key not configured" },
        { status: 500 }
      );
    }

    console.log(`🔍 [ADMIN] Polling Medallion API for user ${targetUserId} (${user.firstName} ${user.lastName}), userAccessCode: ${user.medallionUserAccessCode}`);

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
      console.error(`❌ [ADMIN] Medallion API error for user ${targetUserId}: ${medallionResponse.status} ${medallionResponse.statusText}`);

      // If user not found in Medallion, they might not have completed verification yet
      if (medallionResponse.status === 404) {
        return NextResponse.json({
          success: true,
          data: {
            ...user,
            medallionVerificationStatus: 'pending',
            medallionIdentityVerified: false,
          },
          message: "Verification still in progress",
          medallionApiResponse: {
            status: medallionResponse.status,
            statusText: medallionResponse.statusText
          }
        });
      }

      return NextResponse.json(
        { error: `Medallion API error: ${medallionResponse.status} ${medallionResponse.statusText}` },
        { status: 500 }
      );
    }

    const medallionData = await medallionResponse.json();
    console.log(`✅ [ADMIN] Medallion API response received for user ${targetUserId}`);

    // Extract verification status from Medallion response
    const isVerificationPassed = checkVerificationStatus(medallionData);
    const verificationStatus = isVerificationPassed ? 'approved' : 'rejected';

    // Update user record with fresh data from Medallion
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        medallionIdentityVerified: isVerificationPassed,
        medallionVerificationStatus: verificationStatus,
        medallionVerificationCompletedAt: isVerificationPassed ? new Date() : null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    console.log(`📝 [ADMIN] Updated user ${targetUserId} verification status: ${verificationStatus} (verified: ${isVerificationPassed})`);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      medallionData: {
        idVerificationStatus: medallionData.idVerification?.status,
        isIdVerified: medallionData.scannedUser?.IsIDVerified,
        verifyResult: medallionData.verifyUI?.scannedUser?.result,
        rawResponse: medallionData // Include full response for debugging
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
  console.log('📊 [ADMIN] Medallion verification indicators:', {
    idVerificationStatus: medallionData.idVerification?.status,
    isIdVerified: medallionData.scannedUser?.IsIDVerified,
    verifyUIResult: medallionData.verifyUI?.scannedUser?.result,
    faceMatchScore: medallionData.photoProof?.face_match_score,
  });

  // Verification passes if ID verification passed AND document is verified
  return idVerificationPassed && documentVerified;
}