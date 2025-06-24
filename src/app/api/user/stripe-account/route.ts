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
      select: { stripeAccountId: true },
    });

    let onboardingComplete = false;
    
    // If user has a Stripe account, check its status
    if (user?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        onboardingComplete = account.details_submitted && 
                           account.charges_enabled && 
                           account.payouts_enabled;
      } catch (stripeError) {
        console.error('Error fetching Stripe account:', stripeError);
        // If there's an error fetching from Stripe, just return what we have
      }
    }

    return NextResponse.json({
      stripeAccountId: user?.stripeAccountId || null,
      onboardingComplete,
    });
  } catch (error) {
    console.error('Error fetching user Stripe account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}