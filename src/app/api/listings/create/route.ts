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
    
    // Extract listing images and monthly pricing from the body to handle them separately
    const { listingImages, monthlyPricing, ...listingData } = body;
    
    // Set the userId for the listing
    listingData.userId = userId;
    
    // Create the listing in a transaction to ensure all related data is created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the main listing record
      const listing = await tx.listing.create({
        data: {
          ...listingData,
          // Set default values for any required fields not provided
          status: listingData.status || 'available',
          approvalStatus: 'pendingReview',
          title: listingData.title || 'Untitled Listing',
          description: listingData.description || '',
          roomCount: listingData.roomCount || 1,
          bathroomCount: listingData.bathroomCount || 1,
          guestCount: listingData.guestCount || 1,
          latitude: listingData.latitude || 0,
          longitude: listingData.longitude || 0,
        },
      });
      
      // Create listing images if provided
      if (listingImages && listingImages.length > 0) {
        await tx.listingImage.createMany({
          data: listingImages.map((image: any) => ({
            url: image.url,
            listingId: listing.id,
            category: image.category || null,
            rank: image.rank || null,
          })),
        });
      }
      
      // Create monthly pricing if provided
      if (monthlyPricing && monthlyPricing.length > 0) {
        await tx.listingMonthlyPricing.createMany({
          data: monthlyPricing.map((pricing: any) => ({
            listingId: listing.id,
            months: pricing.months,
            price: pricing.price || 0,
            utilitiesIncluded: pricing.utilitiesIncluded || false,
          })),
        });
      }
      
      return listing;
    });
    
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