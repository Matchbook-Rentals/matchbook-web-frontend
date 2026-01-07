import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { generateReferralCode } from '@/lib/referral';

// DEV ONLY - Seeds test referral data
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Get some existing users to use as referrers/referred
    const users = await prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, firstName: true, lastName: true, referralCode: true },
    });

    if (users.length < 6) {
      return NextResponse.json(
        { error: 'Need at least 6 users in database to create test referrals' },
        { status: 400 }
      );
    }

    const [referrer1, referred1, referrer2, referred2, referrer3, referred3] = users;

    // Ensure referrers have referral codes
    const referrer1Code = referrer1.referralCode || generateReferralCode();
    const referrer2Code = referrer2.referralCode || generateReferralCode();
    const referrer3Code = referrer3.referralCode || generateReferralCode();

    // Update referrers with codes if they don't have them
    if (!referrer1.referralCode) {
      await prisma.user.update({
        where: { id: referrer1.id },
        data: { referralCode: referrer1Code },
      });
    }

    if (!referrer2.referralCode) {
      await prisma.user.update({
        where: { id: referrer2.id },
        data: { referralCode: referrer2Code },
      });
    }

    if (!referrer3.referralCode) {
      await prisma.user.update({
        where: { id: referrer3.id },
        data: { referralCode: referrer3Code },
      });
    }

    // Delete any existing test referrals and payouts for these users
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { referredUserId: referred1.id },
          { referredUserId: referred2.id },
          { referredUserId: referred3.id },
        ],
      },
    });

    // Delete any existing payouts for the referrers
    await prisma.payout.deleteMany({
      where: {
        OR: [
          { userId: referrer1.id },
          { userId: referrer2.id },
          { userId: referrer3.id },
        ],
      },
    });

    // Calculate quarters
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentPayoutQuarter = `${now.getFullYear()}-Q${currentQuarter}`;

    // Calculate previous quarter
    let prevQuarter = currentQuarter - 1;
    let prevYear = now.getFullYear();
    if (prevQuarter === 0) {
      prevQuarter = 4;
      prevYear -= 1;
    }
    const previousPayoutQuarter = `${prevYear}-Q${prevQuarter}`;

    // Create PENDING referral (not yet qualified)
    const pendingReferral = await prisma.referral.create({
      data: {
        referrerId: referrer1.id,
        referredUserId: referred1.id,
        status: 'pending',
        rewardAmount: 5000, // $50.00
      },
      include: {
        referrer: { select: { email: true, firstName: true, lastName: true } },
        referredUser: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    // Update referred user's referredByUserId
    await prisma.user.update({
      where: { id: referred1.id },
      data: { referredByUserId: referrer1.id },
    });

    // Create QUALIFIED referral (host got their first booking, awaiting payout)
    const qualifiedReferral = await prisma.referral.create({
      data: {
        referrerId: referrer2.id,
        referredUserId: referred2.id,
        status: 'qualified',
        qualifiedAt: now,
        payoutQuarter: currentPayoutQuarter,
        rewardAmount: 5000, // $50.00
      },
      include: {
        referrer: { select: { email: true, firstName: true, lastName: true } },
        referredUser: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    // Update referred user's referredByUserId
    await prisma.user.update({
      where: { id: referred2.id },
      data: { referredByUserId: referrer2.id },
    });

    // Create a PAID payout with linked referral (to test the payout flow)
    const paidPayout = await prisma.payout.create({
      data: {
        userId: referrer3.id,
        quarter: previousPayoutQuarter,
        amount: 5000,
        referralCount: 1,
        status: 'paid',
        paidAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        paymentMethod: 'venmo',
        paymentReference: 'test-12345',
        notes: 'Test payout for development',
      },
    });

    // Create the referral that was paid out
    const paidReferral = await prisma.referral.create({
      data: {
        referrerId: referrer3.id,
        referredUserId: referred3.id,
        status: 'qualified',
        qualifiedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        payoutQuarter: previousPayoutQuarter,
        payoutId: paidPayout.id,
        rewardAmount: 5000, // $50.00
      },
      include: {
        referrer: { select: { email: true, firstName: true, lastName: true } },
        referredUser: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    // Update referred user's referredByUserId
    await prisma.user.update({
      where: { id: referred3.id },
      data: { referredByUserId: referrer3.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Created 3 test referrals (1 pending, 1 qualified, 1 with paid payout)',
      referrals: {
        pending: {
          id: pendingReferral.id,
          status: pendingReferral.status,
          referrer: `${pendingReferral.referrer.firstName} ${pendingReferral.referrer.lastName} (${pendingReferral.referrer.email})`,
          referrerCode: referrer1Code,
          referredHost: `${pendingReferral.referredUser.firstName} ${pendingReferral.referredUser.lastName} (${pendingReferral.referredUser.email})`,
          rewardAmount: '$50.00',
        },
        qualified: {
          id: qualifiedReferral.id,
          status: qualifiedReferral.status,
          referrer: `${qualifiedReferral.referrer.firstName} ${qualifiedReferral.referrer.lastName} (${qualifiedReferral.referrer.email})`,
          referrerCode: referrer2Code,
          referredHost: `${qualifiedReferral.referredUser.firstName} ${qualifiedReferral.referredUser.lastName} (${qualifiedReferral.referredUser.email})`,
          qualifiedAt: qualifiedReferral.qualifiedAt,
          payoutQuarter: qualifiedReferral.payoutQuarter,
          rewardAmount: '$50.00',
        },
        paidOut: {
          id: paidReferral.id,
          status: 'paid (via Payout)',
          referrer: `${paidReferral.referrer.firstName} ${paidReferral.referrer.lastName} (${paidReferral.referrer.email})`,
          referrerCode: referrer3Code,
          referredHost: `${paidReferral.referredUser.firstName} ${paidReferral.referredUser.lastName} (${paidReferral.referredUser.email})`,
          qualifiedAt: paidReferral.qualifiedAt,
          payoutQuarter: paidReferral.payoutQuarter,
          payoutId: paidPayout.id,
          paidAt: paidPayout.paidAt,
          paymentMethod: paidPayout.paymentMethod,
          rewardAmount: '$50.00',
        },
      },
    });
  } catch (error) {
    console.error('Error seeding referrals:', error);
    return NextResponse.json(
      { error: 'Failed to seed referrals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Check current referral and payout status
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const referrals = await prisma.referral.findMany({
      include: {
        referrer: {
          select: { id: true, email: true, firstName: true, lastName: true, referralCode: true },
        },
        referredUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        qualifyingBooking: {
          select: { id: true, status: true, startDate: true },
        },
        payout: {
          select: { id: true, status: true, paidAt: true, paymentMethod: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payouts = await prisma.payout.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        referrals: {
          select: { id: true, referredUserId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      referrals: {
        total: referrals.length,
        pending: referrals.filter(r => r.status === 'pending').length,
        qualified: referrals.filter(r => r.status === 'qualified' && !r.payoutId).length,
        withPayout: referrals.filter(r => r.payoutId).length,
      },
      payouts: {
        total: payouts.length,
        pending: payouts.filter(p => p.status === 'pending').length,
        paid: payouts.filter(p => p.status === 'paid').length,
      },
    };

    return NextResponse.json({
      stats,
      referrals: referrals.map(r => ({
        id: r.id,
        status: r.status,
        referrer: {
          id: r.referrer.id,
          name: `${r.referrer.firstName} ${r.referrer.lastName}`,
          email: r.referrer.email,
          referralCode: r.referrer.referralCode,
        },
        referredHost: {
          id: r.referredUser.id,
          name: `${r.referredUser.firstName} ${r.referredUser.lastName}`,
          email: r.referredUser.email,
        },
        qualifiedAt: r.qualifiedAt,
        qualifyingBookingId: r.qualifyingBookingId,
        qualifyingBooking: r.qualifyingBooking,
        payoutQuarter: r.payoutQuarter,
        payoutId: r.payoutId,
        payout: r.payout,
        rewardAmount: `$${(r.rewardAmount / 100).toFixed(2)}`,
        createdAt: r.createdAt,
      })),
      payouts: payouts.map(p => ({
        id: p.id,
        status: p.status,
        user: {
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          email: p.user.email,
        },
        quarter: p.quarter,
        amount: `$${(p.amount / 100).toFixed(2)}`,
        referralCount: p.referralCount,
        referralIds: p.referrals.map(r => r.id),
        paidAt: p.paidAt,
        paymentMethod: p.paymentMethod,
        paymentReference: p.paymentReference,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Clean up test referrals and payouts
export async function DELETE() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // First unlink referrals from payouts
    await prisma.referral.updateMany({
      where: { payoutId: { not: null } },
      data: { payoutId: null },
    });

    // Delete all payouts
    const deletedPayouts = await prisma.payout.deleteMany({});

    // Delete all referrals
    const deletedReferrals = await prisma.referral.deleteMany({});

    // Clear referredByUserId on all users
    await prisma.user.updateMany({
      where: { referredByUserId: { not: null } },
      data: { referredByUserId: null },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedReferrals.count} referrals and ${deletedPayouts.count} payouts`,
    });
  } catch (error) {
    console.error('Error deleting referrals:', error);
    return NextResponse.json(
      { error: 'Failed to delete referrals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
