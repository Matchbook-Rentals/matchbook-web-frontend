import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeAccountId: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        stripeDetailsSubmitted: true,
      },
    });

    let onboardingComplete = false;
    let chargesEnabled = user?.stripeChargesEnabled || false;
    let payoutsEnabled = user?.stripePayoutsEnabled || false;
    let detailsSubmitted = user?.stripeDetailsSubmitted || false;
    
    // If user has a Stripe account, check its latest status
    if (user?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        chargesEnabled = account.charges_enabled || false;
        payoutsEnabled = account.payouts_enabled || false;
        detailsSubmitted = account.details_submitted || false;
        onboardingComplete = detailsSubmitted && chargesEnabled && payoutsEnabled;
        
        // Update database with latest status
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeChargesEnabled: chargesEnabled,
            stripePayoutsEnabled: payoutsEnabled,
            stripeDetailsSubmitted: detailsSubmitted,
          },
        });
      } catch (stripeError) {
        console.error('Error fetching Stripe account:', stripeError);
        // If there's an error fetching from Stripe, use database values
        onboardingComplete = detailsSubmitted && chargesEnabled && payoutsEnabled;
      }
    }

    return NextResponse.json({
      stripeAccountId: user?.stripeAccountId || null,
      onboardingComplete,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
    });
  } catch (error) {
    console.error('Error fetching user Stripe account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}