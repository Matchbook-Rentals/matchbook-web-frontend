// Import necessary Next.js types
import { NextResponse } from 'next/server';

const jwtData = process.env.DOCUSIGN_JWT

export async function GET() {
  if (!jwtData) {
    return NextResponse.json({ error: "DocuSign JWT is not configured" }, { status: 500 });
  }
  const jwt = jwtData;
  const accessToken = await getAccessToken(jwt);
  console.log(accessToken)

  if (accessToken) {
    return NextResponse.json({ accessToken });
  } else {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }
}

async function getAccessToken(jwt: string) {
  const url = "https://account-d.docusign.com/oauth/token";
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
}
