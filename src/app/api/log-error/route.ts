import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Use server version for route handlers
import prisma from '@/lib/prisma'; // Adjust path as needed

export async function POST(request: Request) {
  try {
    const { userId } = auth(); // Get current user ID if available
    const body = await request.json();

    const { 
      errorMessage, 
      errorStack, 
      errorDigest, 
      pathname, 
      userAgent, 
      isAuthError 
    } = body;

    // Basic validation
    if (!errorMessage) {
      return NextResponse.json({ error: 'errorMessage is required' }, { status: 400 });
    }

    await prisma.applicationError.create({
      data: {
        errorMessage: String(errorMessage),
        errorStack: errorStack ? String(errorStack) : null,
        errorDigest: errorDigest ? String(errorDigest) : null,
        pathname: pathname ? String(pathname) : null,
        userAgent: userAgent ? String(userAgent) : null,
        isAuthError: typeof isAuthError === 'boolean' ? isAuthError : null,
        userId: userId || null, // Link to user if logged in
      },
    });

    // Return a simple success response. No body needed.
    return new NextResponse(null, { status: 201 }); 

  } catch (error) {
    console.error("Failed to log application error:", error);
    // Avoid sending detailed errors back to the client in production
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Failed to log error', details: message }, { status: 500 });
  }
}
