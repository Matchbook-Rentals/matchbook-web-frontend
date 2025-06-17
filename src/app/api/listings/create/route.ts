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
    console.error('[API] Error creating listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create listing' },
      { status: 500 }
    );
  }
}