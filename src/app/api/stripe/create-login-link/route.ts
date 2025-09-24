import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getHostUserData } from '@/app/actions/user';
import { logger } from '@/lib/logger';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hostUserData = await getHostUserData();

    if (!hostUserData?.stripeAccountId) {
      return NextResponse.json({
        error: 'No Stripe account found. Please complete Stripe onboarding first.'
      }, { status: 400 });
    }

    const loginLink = await stripe.accounts.createLoginLink(hostUserData.stripeAccountId);

    logger.info('Created Stripe login link', {
      userId: user.id,
      stripeAccountId: hostUserData.stripeAccountId
    });

    return NextResponse.json({ url: loginLink.url });

  } catch (error) {
    logger.error('Failed to create Stripe login link', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      error: 'Failed to create login link'
    }, { status: 500 });
  }
}