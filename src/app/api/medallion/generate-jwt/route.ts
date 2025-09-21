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

    console.log('🔑 Generating Medallion JWT for user:', userId);

    // Get user data including their userAccessCode
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        medallionUserAccessCode: true,
        email: true,
        firstName: true,
        lastName: true
      },
    });

    if (!userData?.medallionUserAccessCode) {
      return NextResponse.json(
        { error: "User verification setup not complete. Please confirm your details first." },
        { status: 400 }
      );
    }

    const medallionApiKey = process.env.MEDALLION_API_KEY;
    if (!medallionApiKey) {
      return NextResponse.json(
        { error: "Medallion API not configured" },
        { status: 500 }
      );
    }

    // Generate JWT token for Medallion redirect
    const jwtResponse = await fetch('https://api-v3.authenticating.com/user/jwt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${medallionApiKey}`,
      },
      body: JSON.stringify({
        userAccessCode: userData.medallionUserAccessCode,
        redirectURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/app/host/onboarding/identity-verification?completed=true`,
      }),
    });

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      console.error('❌ Medallion JWT API error:', {
        status: jwtResponse.status,
        statusText: jwtResponse.statusText,
        error: errorText,
        userAccessCode: userData.medallionUserAccessCode
      });

      return NextResponse.json(
        {
          error: "Failed to generate verification link",
          details: errorText,
          status: jwtResponse.status
        },
        { status: 500 }
      );
    }

    const jwtData = await jwtResponse.json();
    console.log('✅ Medallion JWT generated:', {
      hasJwt: !!jwtData.jwt,
      hasToken: !!jwtData.token,
      userAccessCode: userData.medallionUserAccessCode
    });

    // Store the verification token in database for future reference
    await prisma.user.update({
      where: { id: userId },
      data: {
        medallionVerificationToken: jwtData.token || jwtData.jwt,
      },
    });

    return NextResponse.json({
      success: true,
      verificationUrl: `https://verify.authenticating.com/?token=${jwtData.token || jwtData.jwt}`,
      token: jwtData.token,
      jwt: jwtData.jwt,
    });

  } catch (error) {
    console.error("Error generating Medallion JWT:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}