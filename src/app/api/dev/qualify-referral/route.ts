import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { qualifyReferral } from '@/lib/referral';

/**
 * DEV ONLY - Simulate a host getting their first booking to qualify a referral
 *
 * POST /api/dev/qualify-referral
 * Body: { hostId: string }
 *
 * Creates a test listing, match, and booking for the host, then qualifies their referral.
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { hostId } = body;

    if (!hostId) {
      return NextResponse.json(
        { error: 'hostId is required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!host) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a pending referral
    const pendingReferral = await prisma.referral.findUnique({
      where: { referredUserId: hostId },
    });

    if (!pendingReferral) {
      return NextResponse.json({
        success: false,
        message: 'No referral found for user',
      });
    }

    if (pendingReferral.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `Referral is already ${pendingReferral.status}`,
        referralId: pendingReferral.id,
        status: pendingReferral.status,
      });
    }

    // Find or create a test listing for the host
    let listing = await prisma.listing.findFirst({
      where: { userId: hostId },
      select: { id: true },
    });

    if (!listing) {
      listing = await prisma.listing.create({
        data: {
          userId: hostId,
          title: '[TEST] Test Listing for Referral Qualification',
          description: 'This is a test listing created automatically for referral qualification testing.',
          status: 'published',
          category: 'room',
          locationString: '123 Test St, Test City, TS 12345',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          latitude: 0,
          longitude: 0,
          shortestLeaseLength: 1,
          longestLeaseLength: 12,
          shortestLeasePrice: 1000,
          longestLeasePrice: 800,
          roomCount: 1,
          bathroomCount: 1,
          depositSize: 800,
          isApproved: true,
        },
        select: { id: true },
      });
    }

    // Find a renter to use for the booking (use a different user)
    let renter = await prisma.user.findFirst({
      where: { id: { not: hostId } },
      select: { id: true },
    });

    if (!renter) {
      // Create a test renter if none exists
      renter = await prisma.user.create({
        data: {
          id: `test_renter_${Date.now()}`,
          email: `test_renter_${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Renter',
        },
        select: { id: true },
      });
    }

    // Create a test trip for the renter
    const trip = await prisma.trip.create({
      data: {
        userId: renter.id,
        locationString: 'Test City, TS',
        tripStatus: 'active',
        numAdults: 1,
        numChildren: 0,
        numPets: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    // Create a test match
    const match = await prisma.match.create({
      data: {
        tripId: trip.id,
        listingId: listing.id,
      },
      select: { id: true },
    });

    // Create a test booking with confirmed status
    const booking = await prisma.booking.create({
      data: {
        userId: renter.id,
        listingId: listing.id,
        matchId: match.id,
        tripId: trip.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalPrice: 100000, // $1000 in cents
        monthlyRent: 100000,
        status: 'confirmed',
      },
      select: { id: true },
    });

    // Now qualify the referral
    const wasQualified = await qualifyReferral(hostId, booking.id);

    if (!wasQualified) {
      return NextResponse.json({
        success: false,
        message: 'Failed to qualify referral - may have already been qualified',
        bookingId: booking.id,
      });
    }

    // Get the updated referral
    const updatedReferral = await prisma.referral.findUnique({
      where: { referredUserId: hostId },
      select: {
        id: true,
        status: true,
        qualifiedAt: true,
        qualifyingBookingId: true,
        payoutQuarter: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Referral qualified successfully',
      bookingId: booking.id,
      referralId: updatedReferral?.id,
      status: updatedReferral?.status,
      qualifiedAt: updatedReferral?.qualifiedAt,
      qualifyingBookingId: updatedReferral?.qualifyingBookingId,
      payoutQuarter: updatedReferral?.payoutQuarter,
    });
  } catch (error) {
    console.error('Error qualifying referral:', error);
    return NextResponse.json(
      {
        error: 'Failed to qualify referral',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
