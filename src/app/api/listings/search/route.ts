import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server';
import { Prisma } from "@prisma/client";
import { RawListingResult } from "@/types/raw-listing";

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radiusMiles = parseFloat(searchParams.get('radiusMiles') || '');

  const earthRadiusMiles = 3959;

  try {
    // Input validation
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: `Invalid latitude. Must be a number between -90 and 90. received ${lat}` },
        { status: 400 }
      );
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: `Invalid longitude. Must be a number between -180 and 180. received ${lng}` },
        { status: 400 }
      );
    }
    if (typeof radiusMiles !== 'number' || isNaN(radiusMiles) || radiusMiles <= 0) {
      return NextResponse.json(
        { error: `Invalid radius. Must be a positive number. received ${radiusMiles}` },
        { status: 400 }
      );
    }

    // Same SQL query as before
    const query = `
    SELECT l.*,
    (${earthRadiusMiles} * acos(
      cos(radians(${lat})) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(l.latitude))
    )) AS distance,
    li.id AS imageId, li.url AS imageUrl,
    b.id AS bedroomId, b.bedroomNumber, b.bedType,
    u.id AS userId, u.firstName AS userFirstName, u.lastName AS userLastName,
    u.fullName AS userFullName, u.email AS userEmail, u.imageUrl AS userImageUrl,
    u.createdAt AS userCreatedAt,
    lu.id AS unavailabilityId, lu.startDate AS unavailabilityStartDate, lu.endDate AS unavailabilityEndDate
    FROM Listing l
    LEFT JOIN ListingImage li ON l.id = li.listingId
    LEFT JOIN Bedroom b ON l.id = b.listing_id
    LEFT JOIN User u ON l.userId = u.id
    LEFT JOIN ListingUnavailability lu ON l.id = lu.listingId
    HAVING distance <= ${radiusMiles}
    ORDER BY distance, l.id, li.id, b.bedroomNumber, lu.startDate`;

    // Execute query and return results
    const rawResults = await prisma.$queryRaw<RawListingResult[]>`${Prisma.sql([query])}`;

    return NextResponse.json(rawResults);

  } catch (error) {
    console.error('Error in listings search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}