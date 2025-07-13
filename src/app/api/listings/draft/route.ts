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
    const { id, listingImages, monthlyPricing, includeUtilities, ...listingData } = body;
    
    // If id is provided, update existing draft, otherwise create new
    if (id) {
      // Update existing draft in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const updatedDraft = await tx.listingInCreation.update({
          where: { id },
          data: {
            ...listingData,
            userId,
            lastModified: new Date(),
            // Map includeUtilities to utilitiesIncluded for database
            utilitiesIncluded: includeUtilities,
            // Save monthly pricing as JSON string
            monthlyPricingData: monthlyPricing ? JSON.stringify(monthlyPricing) : null,
          }
        });

        // Handle photo updates if provided
        if (listingImages && Array.isArray(listingImages)) {
          // Delete existing images for this draft
          await tx.listingImage.deleteMany({
            where: { listingId: id }
          });

          // Create new images if any provided
          if (listingImages.length > 0) {
            await tx.listingImage.createMany({
              data: listingImages.map((image: any) => ({
                url: image.url,
                listingId: id,
                category: image.category || null,
                rank: image.rank || null,
              })),
            });
          }
        }

        return updatedDraft;
      });
      
      return NextResponse.json(result);
    } else {
      // Create new draft in a transaction - but first delete any existing drafts for this user
      const result = await prisma.$transaction(async (tx) => {
        // Delete all existing drafts for this user (there should only be one at a time)
        await tx.listingInCreation.deleteMany({
          where: { userId }
        });

        const newDraft = await tx.listingInCreation.create({
          data: {
            ...listingData,
            userId,
            status: 'draft',
            approvalStatus: 'pendingReview',
            // Map includeUtilities to utilitiesIncluded for database
            utilitiesIncluded: includeUtilities,
            // Save monthly pricing as JSON string
            monthlyPricingData: monthlyPricing ? JSON.stringify(monthlyPricing) : null,
          }
        });

        // Create images if provided
        if (listingImages && Array.isArray(listingImages) && listingImages.length > 0) {
          await tx.listingImage.createMany({
            data: listingImages.map((image: any) => ({
              url: image.url,
              listingId: newDraft.id,
              category: image.category || null,
              rank: image.rank || null,
            })),
          });
        }

        return newDraft;
      });
      
      return NextResponse.json(result);
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