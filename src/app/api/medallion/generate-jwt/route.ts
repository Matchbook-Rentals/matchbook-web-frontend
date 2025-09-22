import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import crypto from "crypto";

// Simple rate limiting for JWT generation (prevent abuse)
const jwtRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkJwtRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window
  const maxRequests = 3; // Max 3 JWT generations per 5 minutes per user

  const userLimit = jwtRateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    jwtRateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
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

    // Check rate limit for JWT generation
    if (!checkJwtRateLimit(userId)) {
      console.warn(`JWT generation rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 5 minutes before trying again." },
        { status: 429 }
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

    // Generate a unique session token for CSRF protection
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Store session token in database for verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        medallionSessionToken: sessionToken,
      },
    });

    // Generate JWT token for Medallion redirect with secure callback URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    let redirectURL = `${baseUrl}/app/host/onboarding/identity-verification?completed=true&session_id=${sessionToken}&user_id=${userId}`;

    // For development, if using localhost, we might need to use a different URL
    // Authenticate.com requires HTTPS for redirectURL in production
    if (redirectURL.startsWith('http://localhost')) {
      console.log('⚠️ Using localhost redirect URL - this might cause issues in production');
    }

    // Debug logging
    console.log('🔍 JWT Request Debug:', {
      endpoint: 'https://api-v3.authenticating.com/user/jwt',
      userAccessCode: userData.medallionUserAccessCode?.substring(0, 8) + '...',
      redirectURL,
      hasApiKey: !!medallionApiKey,
      apiKeyPrefix: medallionApiKey?.substring(0, 8) + '...',
    });

    // Try different parameter formats that the API might expect
    const requestBody = {
      userAccessCode: userData.medallionUserAccessCode,
      redirectURL,
    };

    // Alternative format to try if the first fails
    const alternativeRequestBody = {
      user_id: userData.medallionUserId || userData.medallionUserAccessCode,
      redirectURL,
    };

    const jwtResponse = await fetch('https://api-v3.authenticating.com/user/jwt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${medallionApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      console.error('❌ Medallion JWT API error (first attempt):', {
        status: jwtResponse.status,
        statusText: jwtResponse.statusText,
        error: errorText,
        userAccessCode: userData.medallionUserAccessCode,
        requestBody: JSON.stringify(requestBody)
      });

      // If 403 Forbidden, try alternative parameter format
      if (jwtResponse.status === 403) {
        console.log('🔄 Retrying with alternative parameter format...');

        const retryResponse = await fetch('https://api-v3.authenticating.com/user/jwt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${medallionApiKey}`,
          },
          body: JSON.stringify(alternativeRequestBody),
        });

        if (retryResponse.ok) {
          console.log('✅ Alternative format succeeded');
          const jwtData = await retryResponse.json();
          // Continue with success handling...
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
        } else {
          const retryErrorText = await retryResponse.text();
          console.error('❌ Medallion JWT API error (retry attempt):', {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            error: retryErrorText,
            alternativeRequestBody: JSON.stringify(alternativeRequestBody)
          });
        }
      }

      return NextResponse.json(
        {
          error: "Failed to generate verification link",
          details: errorText,
          status: jwtResponse.status,
          suggestion: jwtResponse.status === 403 ?
            "This might be an API key permission issue or incorrect request format. Please verify your API key has the correct permissions." :
            undefined
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