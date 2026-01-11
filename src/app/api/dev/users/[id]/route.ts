import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

// DEV ONLY - Get detailed user info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true,
            state: true,
            isApproved: true,
            _count: { select: { bookings: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        bookings: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            listing: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        trips: {
          select: {
            id: true,
            locationString: true,
            startDate: true,
            endDate: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        referralsMade: {
          select: {
            id: true,
            status: true,
            rewardAmount: true,
            qualifiedAt: true,
            payoutQuarter: true,
            referredUser: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        referralReceived: {
          select: {
            id: true,
            status: true,
            referrer: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        payoutsReceived: {
          select: {
            id: true,
            quarter: true,
            amount: true,
            status: true,
            paidAt: true,
            paymentMethod: true,
          },
          orderBy: { quarter: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verifiedAt: user.verifiedAt,
        hallmarkHostAt: user.hallmarkHostAt,
        trailblazerAt: user.trailblazerAt,
        agreedToTerms: user.agreedToTerms,
        agreedToHostTerms: user.agreedToHostTerms,
        stripe: {
          accountId: user.stripeAccountId,
          customerId: user.stripeCustomerId,
          chargesEnabled: user.stripeChargesEnabled,
          payoutsEnabled: user.stripePayoutsEnabled,
          detailsSubmitted: user.stripeDetailsSubmitted,
          accountStatus: user.stripeAccountStatus,
        },
        identity: {
          medallionVerified: user.medallionIdentityVerified,
          medallionStatus: user.medallionVerificationStatus,
          stripeVerificationStatus: user.stripeVerificationStatus,
        },
        referral: {
          code: user.referralCode,
          referredByUserId: user.referredByUserId,
        },
      },
      listings: user.listings.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        location: `${l.city}, ${l.state}`,
        isApproved: l.isApproved,
        bookingsCount: l._count.bookings,
      })),
      bookings: user.bookings.map(b => ({
        id: b.id,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        totalPrice: b.totalPrice,
        listing: b.listing,
      })),
      trips: user.trips.map(t => ({
        id: t.id,
        location: t.locationString,
        startDate: t.startDate,
        endDate: t.endDate,
        applicationsCount: t._count.applications,
      })),
      referralsMade: user.referralsMade.map(r => ({
        id: r.id,
        status: r.status,
        amount: `$${(r.rewardAmount / 100).toFixed(2)}`,
        qualifiedAt: r.qualifiedAt,
        payoutQuarter: r.payoutQuarter,
        referredUser: `${r.referredUser.firstName || ''} ${r.referredUser.lastName || ''}`.trim(),
        referredEmail: r.referredUser.email,
      })),
      referralReceived: user.referralReceived
        ? {
            id: user.referralReceived.id,
            status: user.referralReceived.status,
            referrer: `${user.referralReceived.referrer.firstName || ''} ${user.referralReceived.referrer.lastName || ''}`.trim(),
            referrerEmail: user.referralReceived.referrer.email,
          }
        : null,
      payouts: user.payoutsReceived.map(p => ({
        id: p.id,
        quarter: p.quarter,
        amount: `$${(p.amount / 100).toFixed(2)}`,
        status: p.status,
        paidAt: p.paidAt,
        paymentMethod: p.paymentMethod,
      })),
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update user fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const userId = params.id;
    const body = await request.json();

    // Only allow updating certain safe fields
    const allowedFields = [
      'firstName',
      'lastName',
      'role',
      'verifiedAt',
      'hallmarkHostAt',
      'trailblazerAt',
      'referralCode',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        verifiedAt: true,
        hallmarkHostAt: true,
        trailblazerAt: true,
        referralCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      updated: Object.keys(updateData),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a test user (for e2e test cleanup)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            listings: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Safety check: Don't delete users with real data
    if (user._count.listings > 0 || user._count.bookings > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete user with listings or bookings',
          counts: user._count,
        },
        { status: 400 }
      );
    }

    // Delete related records first (referrals, notifications, etc.)
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { referrerId: userId },
          { referredUserId: userId },
        ],
      },
    });

    await prisma.notification.deleteMany({
      where: { userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted`,
      deletedUserId: userId,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
