import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  console.log("Callback request received:", {
    userId,
    code: code ? `${code.substring(0, 10)}...` : 'null',
    error,
    hasClientId: !!process.env.HOSPITABLE_CLIENT_ID,
    hasClientSecret: !!process.env.HOSPITABLE_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI
  });

  const settingsUrl = new URL("/app/host/dashboard/settings", request.url);

  if (error) {
    console.error("Hospitable OAuth Error:", error);
    settingsUrl.searchParams.set("error", "hospitable_connection_failed");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set("error", "hospitable_missing_code");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokenRequestBody = {
      grant_type: "authorization_code",
      code: code,
      client_id: process.env.HOSPITABLE_CLIENT_ID,
      client_secret: process.env.HOSPITABLE_CLIENT_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI,
    };

    console.log("Token exchange request:", {
      url: "https://auth.hospitable.com/oauth/token",
      body: {
        ...tokenRequestBody,
        client_secret: process.env.HOSPITABLE_CLIENT_SECRET ? "***PRESENT***" : "***MISSING***"
      }
    });

    const tokenResponse = await fetch("https://auth.hospitable.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenRequestBody),
    });

    console.log("Token response status:", tokenResponse.status);
    
    const responseText = await tokenResponse.text();
    console.log("Token response body:", responseText);

    if (!tokenResponse.ok) {
      let errorBody;
      try {
        errorBody = JSON.parse(responseText);
      } catch {
        errorBody = { error: responseText };
      }
      throw new Error(`Failed to fetch token: ${errorBody.error_description || errorBody.error || 'Unknown error'}`);
    }

    let tokens;
    try {
      tokens = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse token response:", parseError);
      throw new Error(`Invalid JSON response from token endpoint: ${responseText}`);
    }
    
    console.log("Parsed tokens:", {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in
    });

    const { access_token, refresh_token } = tokens;

    // NOTE: Tokens should be encrypted before saving to the database.
    await prisma.user.update({
      where: { id: userId },
      data: {
        hospitableAccessToken: access_token,
        hospitableRefreshToken: refresh_token,
      },
    });

    settingsUrl.searchParams.set("success", "hospitable_connected");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("Hospitable callback error:", err);
    settingsUrl.searchParams.set("error", "hospitable_token_exchange_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
