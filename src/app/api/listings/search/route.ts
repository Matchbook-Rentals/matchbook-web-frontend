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

    // First get the listing IDs within radius using raw SQL
    const query = `
    SELECT l.id
    FROM Listing l
    WHERE (${earthRadiusMiles} * acos(
      cos(radians(${lat})) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(l.latitude))
    )) <= ${radiusMiles}`;

    const listingIds = await prisma.$queryRaw<{ id: string }[]>`${Prisma.sql([query])}`;

    // Then fetch complete listings with Prisma
    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: listingIds.map(row => row.id)
        }
      },
      include: {
        listingImages: true,
        bedrooms: true,
        user: true,
        unavailablePeriods: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(listings);

  } catch (error) {
    console.error('Error in listings search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}