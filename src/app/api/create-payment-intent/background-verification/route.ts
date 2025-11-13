import { NextResponse, NextRequest } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { returnUrl } = body;

    // Generate a unique session identifier
    const sessionId = uuidv4();

    // Create a setup intent to save payment method for future use
    // We'll charge the saved payment method separately via another endpoint
    const setupIntent = await stripe.setupIntents.create({
      metadata: {
        userId,
        type: 'matchbookVerification',
        sessionId,
        amount: '2500', // Store amount in metadata for reference
      },
      // Restrict to only card and US bank account (ACH) payment methods
      payment_method_types: ['card', 'us_bank_account'],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      sessionId,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
