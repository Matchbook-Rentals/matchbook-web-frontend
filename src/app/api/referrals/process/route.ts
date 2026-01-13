import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { findUserByReferralCode, createReferral } from '@/lib/referral';
import prisma from '@/lib/prismadb';

/**
 * POST /api/referrals/process
 * Process a referral for the currently authenticated user.
 * Called after signup when a referral code cookie was present.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Missing referral code' },
        { status: 400 }
      );
    }

    console.log(`[Referral API] Processing referral for user ${userId} with code ${referralCode}`);

    // Check if user already has a referral (already referred by someone)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referredByUserId: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingUser.referredByUserId) {
      console.log(`[Referral API] User ${userId} was already referred`);
      return NextResponse.json(
        { error: 'User already has a referral', alreadyReferred: true },
        { status: 400 }
      );
    }

    // Find the referrer
    const referrer = await findUserByReferralCode(referralCode);

    if (!referrer) {
      console.log(`[Referral API] No referrer found for code ${referralCode}`);
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Prevent self-referral
    if (referrer.id === userId) {
      console.log(`[Referral API] Self-referral attempted by ${userId}`);
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: referrer.id,
        referredUserId: userId,
      },
    });

    if (existingReferral) {
      console.log(`[Referral API] Referral already exists for ${userId}`);
      return NextResponse.json(
        { error: 'Referral already exists', alreadyExists: true },
        { status: 400 }
      );
    }

    // Create the referral
    await createReferral(referrer.id, userId);
    console.log(`[Referral API] Created referral: ${referrer.id} -> ${userId}`);

    return NextResponse.json({
      success: true,
      referrerId: referrer.id,
    });
  } catch (error) {
    console.error('[Referral API] Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}
