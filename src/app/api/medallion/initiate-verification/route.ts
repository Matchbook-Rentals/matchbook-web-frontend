import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// NOTE: This API route is no longer needed with LOW_CODE_SDK approach
// Verification is now handled entirely client-side with Medallion's SDK
// Keeping this route for backward compatibility and potential future use

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userAccessCode } = body;

    console.log('🚀 Medallion verification initiated for user:', userId);
    if (userAccessCode) {
      console.log('📝 Storing userAccessCode:', userAccessCode);
    }

    // With LOW_CODE_SDK, we mark verification as started
    // Also store userAccessCode if provided
    await prisma.user.update({
      where: { id: userId },
      data: {
        medallionVerificationStatus: "pending",
        medallionVerificationStartedAt: new Date(),
        ...(userAccessCode && { medallionUserAccessCode: userAccessCode }),
      },
    });

    console.log('✅ User verification status updated to pending');

    return NextResponse.json({
      success: true,
      message: "Verification can proceed with LOW_CODE_SDK",
      note: "Actual verification is handled client-side with Medallion's SDK",
      userAccessCodeStored: !!userAccessCode
    });

  } catch (error) {
    console.error("Error updating verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Legacy code preserved for reference - can be removed later
/*
LEGACY MOCK API CODE - No longer needed with LOW_CODE_SDK:

The original implementation tried to use server-side API calls to:
1. Create users via /v3/user endpoint (returned 404)
2. Generate verification links via /v3/verification/create (incorrect approach)

With LOW_CODE_SDK, the correct implementation is:
1. Load Medallion's client.js script
2. Call window.identify() with SDK key and user data
3. User is redirected to Medallion's hosted verification
4. Medallion sends webhooks to our /api/medallion/webhook endpoint
5. User is redirected back with completion status

This approach is simpler, more secure, and follows Medallion's documented best practices.
*/