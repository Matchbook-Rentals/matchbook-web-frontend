import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file details from request
    const body = await req.json();
    const { fileKey, customId } = body;

    if (!fileKey && !customId) {
      return NextResponse.json(
        { error: 'Either fileKey or customId is required' },
        { status: 400 }
      );
    }

    // Get environment variables
    const appId = process.env.UPLOADTHING_APP_ID;
    const apiKey = process.env.UPLOADTHING_SECRET;

    if (!appId || !apiKey) {
      console.error('Missing UploadThing configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let finalFileKey = fileKey;

    // If customId is provided, get the file key from UploadThing
    if (!fileKey && customId) {
      try {
        const files = await utapi.listFiles({ customId });
        if (files.files.length === 0) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }
        finalFileKey = files.files[0].key;
      } catch (error) {
        console.error('Error fetching file by customId:', error);
        return NextResponse.json(
          { error: 'Failed to fetch file' },
          { status: 500 }
        );
      }
    }

    // TODO: Add permission check here
    // For now, we're just checking if the user is authenticated
    // In production, you should verify that the user has permission to access this file
    // This could involve checking if:
    // - The user uploaded the file
    // - The user is a landlord viewing an applicant's documents
    // - The user is an admin
    
    // Log access for audit purposes
    console.log(`User ${userId} accessing private file: ${finalFileKey}`);

    // Use UploadThing SDK to generate signed URL
    try {
      const signedUrlResult = await utapi.getSignedURL(finalFileKey, { expiresIn: '1h' });
      console.log('UploadThing getSignedURL result:', signedUrlResult);
      
      // The SDK returns an object with url property
      let signedUrl: string;
      if (typeof signedUrlResult === 'string') {
        signedUrl = signedUrlResult;
      } else if (signedUrlResult && typeof signedUrlResult === 'object' && 'url' in signedUrlResult) {
        signedUrl = signedUrlResult.url;
      } else {
        throw new Error('Invalid signed URL format from SDK');
      }
      
      return NextResponse.json({
        signedUrl: signedUrl,  // Ensure we're returning just the string
        fileKey: finalFileKey,
        expiresIn: 3600, // seconds
      });
    } catch (sdkError) {
      console.error('Error generating signed URL with SDK:', sdkError);
      
      // Fallback to existing working method from get-signed-url endpoint
      const crypto = await import('crypto');
      const algorithm = "hmac-sha256";
      const expires = Date.now() + 1000 * 60 * 60; // 1 hour
      
      const url = new URL(`https://${appId}.ufs.sh/f/${finalFileKey}`);
      url.searchParams.set("expires", String(expires));
      
      const signature = crypto
        .createHmac("sha256", apiKey)
        .update(url.href)
        .digest("hex");
      
      url.searchParams.set("signature", `${algorithm}=${signature}`);
      
      return NextResponse.json({
        signedUrl: url.toString(),
        fileKey: finalFileKey,
        expiresIn: 3600,
      });
    }

  } catch (error) {
    console.error('Error in get-private-file API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}