import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// NOTE: This API route is for tracking verification initiation state
// The actual verification is handled via JWT generation and Medallion's hosted UI
// This endpoint updates the user's verification status to 'pending'

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
      message: "Verification status updated to pending",
      note: "Actual verification is handled via JWT API and Medallion's hosted UI",
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

/*
CURRENT API-BASED IMPLEMENTATION:

This codebase uses Authenticate.com's full API approach, not the LOW_CODE_SDK:

1. Server-side user creation via /user/create API endpoint
2. JWT generation via /user/jwt API endpoint
3. User redirect to Medallion's hosted verification with JWT token
4. Webhook handling for real-time status updates
5. API polling for verification status checking
6. CSRF protection via session tokens in redirect URLs

Key security features:
- Rate limiting on API endpoints
- CSRF token validation
- Webhook signature verification
- Session token management

This approach provides full control over the verification flow while maintaining security.
*/