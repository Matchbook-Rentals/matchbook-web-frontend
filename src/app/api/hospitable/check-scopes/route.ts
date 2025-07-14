import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Get user's Hospitable tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hospitableAccessToken: true,
      },
    });

    if (!user?.hospitableAccessToken) {
      return NextResponse.json({
        error: "Not connected to Hospitable",
        hasToken: false,
      });
    }

    console.log("HOSPITABLE CHECK: Checking token scopes...");

    // Try to decode the JWT token to see scopes (if it's a JWT)
    const tokenParts = user.hospitableAccessToken.split('.');
    let decodedToken = null;
    
    if (tokenParts.length === 3) {
      try {
        // Decode JWT payload (without verification for inspection only)
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        decodedToken = payload;
        console.log("HOSPITABLE CHECK: Decoded JWT token:", payload);
      } catch (e) {
        console.log("HOSPITABLE CHECK: Token is not a valid JWT");
      }
    }

    // Test different endpoints to see what we have access to
    const endpointTests = [
      { name: 'properties', url: 'https://public.api.hospitable.com/v2/properties' },
      { name: 'reservations', url: 'https://public.api.hospitable.com/v2/reservations' },
      { name: 'listings', url: 'https://public.api.hospitable.com/v2/listings' },
      { name: 'user', url: 'https://public.api.hospitable.com/v2/user' },
      { name: 'calendars', url: 'https://public.api.hospitable.com/v2/calendars' },
    ];

    const accessResults = [];

    for (const test of endpointTests) {
      try {
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.hospitableAccessToken}`,
            'Accept': 'application/json',
          },
        });

        accessResults.push({
          endpoint: test.name,
          url: test.url,
          status: response.status,
          hasAccess: response.status === 200,
          error: response.status !== 200 ? await response.text().then(t => t.substring(0, 100)) : null,
        });

        console.log(`HOSPITABLE CHECK: ${test.name} (${test.url}) -> ${response.status}`);
      } catch (error) {
        accessResults.push({
          endpoint: test.name,
          url: test.url,
          status: 'ERROR',
          hasAccess: false,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      hasToken: true,
      tokenLength: user.hospitableAccessToken.length,
      tokenPreview: `${user.hospitableAccessToken.substring(0, 20)}...`,
      isJWT: tokenParts.length === 3,
      decodedToken,
      endpointAccess: accessResults,
      summary: {
        totalEndpoints: accessResults.length,
        accessibleEndpoints: accessResults.filter(r => r.hasAccess).length,
        accessibleEndpointNames: accessResults.filter(r => r.hasAccess).map(r => r.endpoint),
      }
    });

  } catch (error) {
    console.error("HOSPITABLE CHECK: Error checking scopes:", error);
    return NextResponse.json(
      { error: "Failed to check scopes: " + (error as Error).message },
      { status: 500 }
    );
  }
}