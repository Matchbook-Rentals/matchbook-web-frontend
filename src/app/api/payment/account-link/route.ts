import { NextRequest, NextResponse } from 'next/server';
import stripe from "@/lib/stripe";
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { account, returnUrl, refreshUrl } = await request.json();

    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: refreshUrl || `${request.nextUrl.origin}/app/onboarding/hosted`,
      return_url: returnUrl || `${request.nextUrl.origin}/app/onboarding/hosted/${account}`,
      type: "account_onboarding",
      collection_options: {
        fields: 'eventually_due',
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error(
      "An error occurred when calling the Stripe API to create an account link:",
      error
    );
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}