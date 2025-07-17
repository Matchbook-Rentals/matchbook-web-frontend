import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createListingFromDraft } from '@/lib/listing-actions-helpers';

// Convert draft to listing
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { draftId, listingImages, monthlyPricing } = body;
    
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    
    // Use the helper function to create listing from draft
    const result = await createListingFromDraft(draftId, userId, {
      listingImages,
      monthlyPricing
    });
    
    return NextResponse.json(result);
  } catch (error) {
    // Log the full error details server-side
    console.error('[API] Error submitting draft:', {
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
      
      // Check for draft not found error
      if (error.message === 'Draft not found') {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
    }
    
    // Generic error response - don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to submit your listing. Please try again later.' },
      { status: 500 }
    );
  }
}