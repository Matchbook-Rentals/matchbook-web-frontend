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
    const { accountType } = await req.json();
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
    const account = await stripe.accounts.create({
      email: user.email,
      business_type: accountType,
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
    });

    console.log(account);
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeAccountId: account.id,
      },
    });
    return NextResponse.json({ account: account.id });
  } catch (error: any) {
    console.error('An error occurred when calling the Stripe API to create an account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}