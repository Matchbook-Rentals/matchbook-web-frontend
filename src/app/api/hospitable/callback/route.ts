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
    const tokenResponse = await fetch("https://app.hospitable.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.HOSPITABLE_CLIENT_ID,
        client_secret: process.env.HOSPITABLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json();
      throw new Error(`Failed to fetch token: ${errorBody.error_description}`);
    }

    const tokens = await tokenResponse.json();
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
