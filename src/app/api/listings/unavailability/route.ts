import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { isValid } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, startDate, endDate, reason } = body;

    // Validate required fields
    if (!listingId || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required fields: listingId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      return NextResponse.json(
        { message: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Verify the listing belongs to the authenticated user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized to modify this listing' },
        { status: 403 }
      );
    }

    // Check for overlapping unavailability periods
    const overlappingPeriods = await prisma.listingUnavailability.findMany({
      where: {
        listingId,
        AND: [
          { startDate: { lt: parsedEndDate } },
          { endDate: { gt: parsedStartDate } }
        ]
      }
    });

    if (overlappingPeriods.length > 0) {
      return NextResponse.json(
        { message: 'Date range overlaps with existing unavailability period' },
        { status: 400 }
      );
    }

    // Create the unavailability period
    const unavailability = await prisma.listingUnavailability.create({
      data: {
        listingId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason: reason || null
      }
    });

    return NextResponse.json(unavailability, { status: 201 });

  } catch (error) {
    console.error('Error creating unavailability:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unavailabilityId = searchParams.get('id');

    if (!unavailabilityId) {
      return NextResponse.json(
        { message: 'Missing unavailability ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, reason } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      return NextResponse.json(
        { message: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Find the unavailability period and verify ownership
    const unavailability = await prisma.listingUnavailability.findUnique({
      where: { id: unavailabilityId },
      include: {
        listing: {
          select: { userId: true }
        }
      }
    });

    if (!unavailability) {
      return NextResponse.json(
        { message: 'Unavailability period not found' },
        { status: 404 }
      );
    }

    if (unavailability.listing.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized to update this unavailability period' },
        { status: 403 }
      );
    }

    // Check for overlapping unavailability periods (excluding current one)
    const overlappingPeriods = await prisma.listingUnavailability.findMany({
      where: {
        listingId: unavailability.listingId,
        id: { not: unavailabilityId }, // Exclude current record
        AND: [
          { startDate: { lt: parsedEndDate } },
          { endDate: { gt: parsedStartDate } }
        ]
      }
    });

    if (overlappingPeriods.length > 0) {
      return NextResponse.json(
        { message: 'Date range overlaps with existing unavailability period' },
        { status: 400 }
      );
    }

    // Update the unavailability period
    const updatedUnavailability = await prisma.listingUnavailability.update({
      where: { id: unavailabilityId },
      data: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason: reason || null
      }
    });

    return NextResponse.json(updatedUnavailability, { status: 200 });

  } catch (error) {
    console.error('Error updating unavailability:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unavailabilityId = searchParams.get('id');

    if (!unavailabilityId) {
      return NextResponse.json(
        { message: 'Missing unavailability ID' },
        { status: 400 }
      );
    }

    // Find the unavailability period and verify ownership
    const unavailability = await prisma.listingUnavailability.findUnique({
      where: { id: unavailabilityId },
      include: {
        listing: {
          select: { userId: true }
        }
      }
    });

    if (!unavailability) {
      return NextResponse.json(
        { message: 'Unavailability period not found' },
        { status: 404 }
      );
    }

    if (unavailability.listing.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized to delete this unavailability period' },
        { status: 403 }
      );
    }

    // Delete the unavailability period
    await prisma.listingUnavailability.delete({
      where: { id: unavailabilityId }
    });

    return NextResponse.json(
      { message: 'Unavailability period deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting unavailability:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}