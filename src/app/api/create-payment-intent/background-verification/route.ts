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

    // Create a payment intent for $25.00
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500, // Amount in cents
      currency: 'usd',
      metadata: {
        userId,
        type: 'matchbookVerification',
        sessionId,
      },
      // Set up automatic payment methods for better UX
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      sessionId,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
