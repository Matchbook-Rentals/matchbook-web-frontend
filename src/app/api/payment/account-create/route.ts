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
      return NextResponse.json({ error: 'User not found in database' }, { status: 500 });
    }
    if (!user.email) {
      return NextResponse.json({ error: 'User email is required for account creation' }, { status: 422 });
    }

    const accountCreationDetails: Stripe.AccountCreateParams = {
      type: 'express',
      email: user.email,
      business_profile: {
        url: 'matchbookrentals.com',
        mcc: '6513', // Real Estate Agents and Managers - Rentals
      },
      country: "US",
    };

    // Only set business_type and related fields if accountType is explicitly provided
    if (accountType) {
      accountCreationDetails.business_type = accountType as Stripe.AccountCreateParams.BusinessType;
      
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
    } else {
      // When no accountType is provided, default to individual but only prefill name
      // Users can still change to company/LLC during Stripe's onboarding flow
      if (user.firstName && user.lastName) {
        accountCreationDetails.business_type = 'individual';
        accountCreationDetails.individual = {
          first_name: user.firstName,
          last_name: user.lastName,
        };
      }
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
