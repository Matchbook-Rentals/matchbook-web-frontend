import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { handleSaveDraft } from '@/lib/listing-actions-helpers';

// Create or update a draft listing
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('🔥 [API] Received draft data:', body);
    
    // Extract the ID for updating existing draft
    const draftId = body.id;
    
    // Use our helper function to save the draft
    const result = await handleSaveDraft(body, userId, draftId);
    
    console.log('🔥 [API] Draft saved successfully:', result.id);
    return NextResponse.json(result);
    
  } catch (error) {
    // Log the full error details server-side
    console.error('[API] Error saving draft:', {
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
          { error: 'A draft with this information already exists.' },
          { status: 400 }
        );
      }
    }
    
    // Generic error response - don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to save your draft. Please try again later.' },
      { status: 500 }
    );
  }
}

// Get draft listings for current user
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (draftId) {
      // Get specific draft with images
      const draft = await prisma.listingInCreation.findFirst({
        where: {
          id: draftId,
          userId
        },
        include: {
          listingImages: {
            orderBy: { rank: 'asc' }
          }
        }
      });
      
      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      // Parse monthly pricing data from JSON
      let monthlyPricing = [];
      if (draft.monthlyPricingData) {
        try {
          monthlyPricing = JSON.parse(draft.monthlyPricingData);
        } catch (error) {
          console.error('Error parsing monthly pricing data:', error);
          monthlyPricing = [];
        }
      }

      // Add derived fields for frontend compatibility
      const enrichedDraft = {
        ...draft,
        // Map utilitiesIncluded to includeUtilities for frontend
        includeUtilities: draft.utilitiesIncluded || false,
        // Provide defaults for fields that might be null
        varyPricingByLength: draft.varyPricingByLength ?? true,
        basePrice: draft.basePrice || null,
        utilitiesUpToMonths: draft.utilitiesUpToMonths || (draft.utilitiesIncluded ? (draft.shortestLeaseLength || 1) : 1),
        monthlyPricing: monthlyPricing
      };
      
      return NextResponse.json(enrichedDraft);
    } else {
      // Get all drafts for user with image counts
      const drafts = await prisma.listingInCreation.findMany({
        where: { userId },
        orderBy: { lastModified: 'desc' },
        include: {
          listingImages: {
            orderBy: { rank: 'asc' }
          }
        }
      });
      
      return NextResponse.json(drafts);
    }
  } catch (error) {
    console.error('[API] Error fetching drafts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// Delete a draft
export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    
    // Verify ownership before deleting
    const draft = await prisma.listingInCreation.findFirst({
      where: {
        id: draftId,
        userId
      }
    });
    
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    
    await prisma.listingInCreation.delete({
      where: { id: draftId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting draft:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete draft' },
      { status: 500 }
    );
  }
}