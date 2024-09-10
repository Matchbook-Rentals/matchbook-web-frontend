import { NextResponse, NextRequest } from 'next/server';
import stripe from '@/lib/stripe';
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

    const accountCreationDetails: any = {
      email: user.email,
      business_profile: {
        url: 'matchbookrentals.com',
      },
      controller: {
        stripe_dashboard: {
          type: "none",
        },
        fees: {
          payer: "application"
        },
        losses: {
          payments: "application"
        },
        requirement_collection: "application",
      },
      capabilities: {
        transfers: { requested: true }
      },
      country: "US",
    };

    if (accountType) {
      accountCreationDetails.business_type = accountType;
    }
    if (accountType === 'individual') {
      accountCreationDetails.individual = {
        first_name: user.firstName,
        last_name: user.lastName,
      };
    }

    const account = await stripe.accounts.create(accountCreationDetails);
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeAccountId: account.id,
      },
    });

    console.log('updatedUser', updatedUser);
    return NextResponse.json({ account: account.id });
  } catch (error: any) {
    console.error('An error occurred when calling the Stripe API to create an account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}