import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current Stripe account ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 500 });
    }
    
    if (!user.stripeAccountId) {
      return NextResponse.json({ error: 'No Stripe account found for user' }, { status: 400 });
    }

    // Fetch latest account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    
    // Update user record with latest status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        stripeChargesEnabled: account.charges_enabled || false,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeDetailsSubmitted: account.details_submitted || false,
      },
    });

    return NextResponse.json({ 
      success: true,
      chargesEnabled: updatedUser.stripeChargesEnabled,
      payoutsEnabled: updatedUser.stripePayoutsEnabled,
      detailsSubmitted: updatedUser.stripeDetailsSubmitted,
    });

  } catch (error) {
    console.error('Error updating Stripe status:', error);
    return NextResponse.json({ error: 'Failed to update Stripe status' }, { status: 500 });
  }
}