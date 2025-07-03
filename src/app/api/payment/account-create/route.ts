import { NextResponse, NextRequest } from 'next/server';
import stripe from '@/lib/stripe';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let accountType: string | undefined;
    try {
      ({ accountType } = await req.json());
    } catch (error) {
      console.error('Error parsing request body:', error);
    }

    let user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    const accountCreationDetails: Stripe.AccountCreateParams = {
      type: 'express',
      email: user.email,
      business_profile: {
        url: 'matchbookrentals.com',
        mcc: '6513', // Real Estate Agents and Managers - Rentals
        product_description: 'Property rental services - We facilitate rental agreements between property owners and tenants, including payment processing for rent and security deposits.',
        name: 'Matchbook Rentals',
      },
      country: "US",
    };

    if (accountType) {
      accountCreationDetails.business_type = accountType as Stripe.AccountCreateParams.BusinessType;
    }
    if (accountType === 'individual') {
      accountCreationDetails.individual = {
        first_name: user.firstName,
        last_name: user.lastName,
      };
    } else if (accountType === 'company') {
      accountCreationDetails.company = {
        name: user.organizationName || 'Property Management Company',
      };
    }

    const account = await stripe.accounts.create(accountCreationDetails);
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeAccountId: account.id,
        stripeChargesEnabled: account.charges_enabled || false,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeDetailsSubmitted: account.details_submitted || false,
      },
    });

    console.log('updatedUser', updatedUser);
    return NextResponse.json({ account: account.id });
  } catch (error) {
    console.error('An error occurred when calling the Stripe API to create an account:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
