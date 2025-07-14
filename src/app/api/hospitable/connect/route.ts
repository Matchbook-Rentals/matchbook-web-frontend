import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = process.env.HOSPITABLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Hospitable client ID or redirect URI is not configured.");
  }

  const scopes = "properties:read bookings:read bookings:write"; // Adjust scopes as needed

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
  });

  const authorizationUrl = `https://app.hospitable.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authorizationUrl);
}
