import { NextRequest, NextResponse } from 'next/server';
import stripe from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { account } = await request.json();

    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: `${request.nextUrl.origin}/platform/onboarding/hosted`,
      return_url: `${request.nextUrl.origin}/platform/onboarding/hosted/${account}`,
      type: "account_onboarding",
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