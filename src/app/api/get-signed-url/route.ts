import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from "@clerk/nextjs/server";
import { UTApi } from 'uploadthing/server';

// Create a new UploadThing API instance
const utapi = new UTApi();

/**
 * API route for generating signed URLs for private UploadThing files
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get file key and optional custom ID from request
    const { fileKey, customId } = await req.json();
    
    if (!fileKey && !customId) {
      return NextResponse.json(
        { error: "Either fileKey or customId is required" },
        { status: 400 }
      );
    }

    // Get app ID from environment variable
    const appId = process.env.UPLOADTHING_APP_ID;
    if (!appId) {
      return NextResponse.json(
        { error: "UPLOADTHING_APP_ID not configured" },
        { status: 500 }
      );
    }

    // Method 1: Use the UploadThing SDK to generate a signed URL (preferred)
    try {
      let signedUrl;
      if (fileKey) {
        signedUrl = await utapi.getSignedURL(fileKey, { expiresIn: '1h' });
      } else if (customId) {
        // If using custom ID, we need to get the file key first
        const files = await utapi.listFiles({ customId });
        if (files.length === 0) {
          return NextResponse.json(
            { error: "File not found with the provided customId" },
            { status: 404 }
          );
        }
        signedUrl = await utapi.getSignedURL(files[0].key, { expiresIn: '1h' });
      }

      return NextResponse.json({ signedUrl });
    } catch (error) {
      console.error("Error generating signed URL with UploadThing SDK:", error);
      
      // Fall back to manual method if SDK fails
      const apiKey = process.env.UPLOADTHING_SECRET;
      if (!apiKey) {
        return NextResponse.json(
          { error: "UPLOADTHING_SECRET not configured" },
          { status: 500 }
        );
      }

      // Method 2: Manual crypto implementation as fallback
      const algorithm = "hmac-sha256";
      // Set expiration to 1 hour from now
      const expires = Date.now() + 1000 * 60 * 60;
      
      const identifier = fileKey || customId;
      const url = new URL(`https://${appId}.ufs.sh/f/${identifier}`);
      url.searchParams.set("expires", String(expires));
      
      const signature = crypto
        .createHmac(algorithm, apiKey)
        .update(url.href)
        .digest("hex");
      
      url.searchParams.set("signature", `${algorithm}=${signature}`);
      
      return NextResponse.json({ signedUrl: url.toString() });
    }
  } catch (error) {
    console.error("Error in get-signed-url API route:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}