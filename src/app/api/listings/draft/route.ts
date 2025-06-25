import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// Create or update a draft listing
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, listingImages, monthlyPricing, ...listingData } = body;
    
    // If id is provided, update existing draft, otherwise create new
    if (id) {
      // Update existing draft
      const updatedDraft = await prisma.listingInCreation.update({
        where: { id },
        data: {
          ...listingData,
          userId,
          lastModified: new Date(),
        }
      });
      
      return NextResponse.json(updatedDraft);
    } else {
      // Create new draft
      const newDraft = await prisma.listingInCreation.create({
        data: {
          ...listingData,
          userId,
          status: 'draft',
          approvalStatus: 'pendingReview',
        }
      });
      
      return NextResponse.json(newDraft);
    }
  } catch (error) {
    console.error('[API] Error saving draft:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save draft' },
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
      // Get specific draft
      const draft = await prisma.listingInCreation.findFirst({
        where: {
          id: draftId,
          userId
        }
      });
      
      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      return NextResponse.json(draft);
    } else {
      // Get all drafts for user
      const drafts = await prisma.listingInCreation.findMany({
        where: { userId },
        orderBy: { lastModified: 'desc' }
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