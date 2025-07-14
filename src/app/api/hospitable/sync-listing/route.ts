// Hospitable Integration Status: BLOCKED - Insufficient OAuth Scopes
// See docs/hospitable-integration.md for detailed status and next steps

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { listingId } = await request.json();
    
    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    // Get user's Hospitable tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hospitableAccessToken: true,
        hospitableRefreshToken: true,
      },
    });

    if (!user?.hospitableAccessToken) {
      return NextResponse.json(
        { error: "Not connected to Hospitable. Please connect your account first." },
        { status: 400 }
      );
    }

    // Get the listing details
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        listingImages: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to sync this listing" }, { status: 403 });
    }

    // Transform Matchbook listing data to Hospitable format
    const hospitableProperty = {
      name: listing.title,
      description: listing.description,
      property_type: listing.category?.toLowerCase().replace(/\s+/g, '_') || 'apartment',
      bedrooms: listing.roomCount || 1,
      bathrooms: listing.bathroomCount || 1,
      max_guests: listing.guestCount || listing.roomCount || 1,
      address: {
        street: listing.streetAddress1,
        street2: listing.streetAddress2,
        city: listing.city,
        state: listing.state,
        postal_code: listing.postalCode,
        country: 'US',
      },
      coordinates: {
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
      amenities: buildAmenitiesArray(listing),
      photos: listing.listingImages?.map(img => ({
        url: img.url,
        caption: '',
        order: img.rank || 0,
      })) || [],
      pricing: {
        base_price: calculateBasePrice(listing),
        cleaning_fee: 0, // Add if available in your system
        security_deposit: listing.depositSize || 0,
        pet_fee: 0, // Add if available in your system
      },
      availability: {
        minimum_stay: listing.shortestLeaseLength || 1,
        maximum_stay: listing.longestLeaseLength || 12,
        advance_notice: 24, // hours
        preparation_time: 0, // hours
      },
    };

    // Test multiple endpoints to find the correct one
    const endpointsToTest = [
      'https://public.api.hospitable.com/v2/properties',
      'https://public.api.hospitable.com/v2/listings', 
      'https://public.api.hospitable.com/properties',
      'https://public.api.hospitable.com/listings',
      'https://public.api.hospitable.com/v2/reservations'
    ];

    const testResults = [];

    for (const testUrl of endpointsToTest) {
      console.log('HOSPITABLE CHECK: Testing endpoint:', testUrl);
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.hospitableAccessToken}`,
            'Accept': 'application/json',
          },
        });

        const responseText = await response.text();
        
        testResults.push({
          url: testUrl,
          status: response.status,
          response: responseText.substring(0, 200) // Limit length
        });

        console.log(`HOSPITABLE CHECK: ${testUrl} -> ${response.status}:`, responseText.substring(0, 100));
        
        // If we get a 200, break here
        if (response.ok) {
          console.log('HOSPITABLE CHECK: Found working endpoint!');
          break;
        }
      } catch (error) {
        console.log(`HOSPITABLE CHECK: Error testing ${testUrl}:`, error);
        testResults.push({
          url: testUrl,
          status: 'ERROR',
          response: (error as Error).message
        });
      }
    }

    // Return all test results to understand which endpoints work
    return NextResponse.json({
      success: false,
      message: "Testing multiple endpoints to find the correct API structure",
      testResults: testResults,
    });

    if (!hospitableResponse.ok) {
      // Try to refresh token if it's expired
      if (hospitableResponse.status === 401 && user.hospitableRefreshToken) {
        const refreshedTokens = await refreshHospitableToken(user.hospitableRefreshToken);
        if (refreshedTokens) {
          // Update user with new tokens
          await prisma.user.update({
            where: { id: userId },
            data: {
              hospitableAccessToken: refreshedTokens.access_token,
              hospitableRefreshToken: refreshedTokens.refresh_token,
            },
          });

          // Retry the request with new token
          const retryResponse = await fetch('https://public.api.hospitable.com/properties', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshedTokens.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(hospitableProperty),
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(`Hospitable API error: ${retryResponse.status} - ${errorData.message || 'Unknown error'}`);
          }
          
          const hospitableData = await retryResponse.json();
          
          // Update listing with Hospitable property ID
          await prisma.listing.update({
            where: { id: listingId },
            data: {
              hospitablePropertyId: hospitableData.id,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Listing successfully connected to Hospitable",
            hospitablePropertyId: hospitableData.id,
          });
        }
      }
      
      const errorData = await hospitableResponse.json().catch(() => ({}));
      throw new Error(`Hospitable API error: ${hospitableResponse.status} - ${errorData.message || 'Unknown error'}`);
    }

    const hospitableData = await hospitableResponse.json();
    
    // Update listing with Hospitable property ID
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        hospitablePropertyId: hospitableData.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Listing successfully connected to Hospitable",
      hospitablePropertyId: hospitableData.id,
    });

  } catch (error) {
    console.error("Hospitable sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync listing to Hospitable: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to refresh Hospitable token
async function refreshHospitableToken(refreshToken: string) {
  try {
    const response = await fetch('https://auth.hospitable.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.HOSPITABLE_CLIENT_ID,
        client_secret: process.env.HOSPITABLE_CLIENT_SECRET,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Helper function to build amenities array from listing boolean fields
function buildAmenitiesArray(listing: any): string[] {
  const amenities: string[] = [];
  
  // Map Matchbook amenities to Hospitable amenities
  const amenityMapping: Record<string, string> = {
    wifi: 'wifi',
    kitchen: 'kitchen',
    parking: 'parking',
    airConditioner: 'air_conditioning',
    laundryFacilities: 'washer_dryer',
    fitnessCenter: 'gym',
    elevator: 'elevator',
    wheelchairAccess: 'wheelchair_accessible',
    doorman: 'doorman',
    dedicatedWorkspace: 'workspace',
    hairDryer: 'hair_dryer',
    iron: 'iron',
    heater: 'heating',
    hotTub: 'hot_tub',
    dishwasher: 'dishwasher',
  };

  Object.entries(amenityMapping).forEach(([matchbookKey, hospitableValue]) => {
    if (listing[matchbookKey]) {
      amenities.push(hospitableValue);
    }
  });

  return amenities;
}

// Helper function to calculate base price from monthly pricing
function calculateBasePrice(listing: any): number {
  // If we have monthly pricing data, use the shortest stay price
  if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
    const shortestStayPricing = listing.monthlyPricing.find(
      (p: any) => p.months === listing.shortestLeaseLength
    );
    if (shortestStayPricing?.price) {
      return shortestStayPricing.price;
    }
  }
  
  // Fallback to legacy pricing fields or default
  return listing.shortestLeasePrice || listing.longestLeasePrice || 0;
}