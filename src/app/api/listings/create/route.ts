import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Use the helper function to create listing
    const result = await createListing(body, userId);
    
    return NextResponse.json(result);
  } catch (error) {
    // Log the full error details server-side
    console.error('[API] Error creating listing:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      // Log specific Prisma error details if available
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    
    // Check for specific database errors
    if (error instanceof Error) {
      // Check for "value too long" database error
      if (error.message.includes('too long') || error.message.includes('Data too long')) {
        return NextResponse.json(
          { error: 'Some of your input fields are too long. Please shorten your text and try again.' },
          { status: 400 }
        );
      }
      
      // Check for other Prisma errors
      if ((error as any).code === 'P2002') {
        return NextResponse.json(
          { error: 'A listing with this information already exists.' },
          { status: 400 }
        );
      }
    }
    
    // Generic error response - don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to create your listing. Please try again later.' },
      { status: 500 }
    );
  }
}