import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const account = await stripe.accounts.retrieve(accountId);

    // For Express accounts, completion is simpler - just check charges_enabled and details_submitted
    // For Standard accounts, also check requirements
    const isExpressAccount = account.type === 'express';
    const onboardingComplete = isExpressAccount
      ? (account.charges_enabled && account.details_submitted)
      : (account.charges_enabled && account.details_submitted &&
         account.requirements?.currently_due?.length === 0);

    return NextResponse.json({ 
      onboardingComplete,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json({ error: 'Failed to check account status' }, { status: 500 });
  }
}