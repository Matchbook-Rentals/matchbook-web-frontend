import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = process.env.HOSPITABLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI;

  // Debug logging to help troubleshoot env vars
  console.log("Hospitable OAuth config check:", {
    hasClientId: !!clientId,
    clientIdLength: clientId?.length || 0,
    hasRedirectUri: !!redirectUri,
    redirectUri: redirectUri, // Safe to log since it's public
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('HOSPITABLE'))
  });

  if (!clientId || !redirectUri) {
    console.error("Hospitable OAuth configuration missing:", { 
      hasClientId: !!clientId, 
      hasRedirectUri: !!redirectUri,
      clientIdPreview: clientId ? `${clientId.substring(0, 8)}...` : 'undefined',
      redirectUri: redirectUri || 'undefined'
    });
    return NextResponse.json(
      { 
        error: "Hospitable integration is not configured.", 
        debug: {
          hasClientId: !!clientId,
          hasRedirectUri: !!redirectUri,
          availableEnvKeys: Object.keys(process.env).filter(key => key.includes('HOSPITABLE'))
        }
      },
      { status: 500 }
    );
  }

  // Request core scopes - focus on what we actually need and what might be available
  const scopes = "property:read property:write listing:read listing:write reservation:read reservation:write calendar:read calendar:write"; // Core permissions

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
  });

  // Use the correct OAuth authorization endpoint
  const authorizationUrl = `https://auth.hospitable.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authorizationUrl);
}
