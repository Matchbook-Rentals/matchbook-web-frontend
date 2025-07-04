import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prismadb from '@/lib/prismadb';

// Function to verify Stripe webhook signature
const verifyStripeSignature = (req: Request, body: string, signature: string): boolean => {
  try {
    // Get Stripe webhook secret from environment variables
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.error('Missing Stripe webhook secret');
      return false;
    }

    // Verify the signature
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    return true;
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return false;
  }
};

export async function POST(req: Request) {
  try {
    // Get the request body as text
    const body = await req.text();
    
    // Get the signature from the request header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    // Verify the signature
    if (!verifyStripeSignature(req, body, signature)) {
      return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    // Handle the webhook event
    console.log(`Webhook event received: ${event.type}`);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract metadata
      const { userId, type, matchId, hostUserId } = paymentIntent.metadata;
      
      if (type === 'matchbookVerification') {
        // Extract the session ID
        const sessionId = paymentIntent.metadata.sessionId;
        
        // Create a purchase record with isRedeemed=false and store the session ID
        await prismadb.purchase.create({
          data: {
            type: 'matchbookVerification',
            amount: paymentIntent.amount,
            userId: userId || null,
            email: paymentIntent.receipt_email || null,
            status: 'completed',
            isRedeemed: false,
            metadata: JSON.stringify({ 
              sessionId,
              paymentIntentId: paymentIntent.id 
            }),
          },
        });
        
        console.log(`User ${userId} verification payment succeeded - purchase created with session ID: ${sessionId}`);
      } else if (type === 'lease_deposit_and_rent' && matchId) {
        // Handle lease deposit and rent payment
        console.log(`Processing lease payment for match ${matchId}`);
        
        // Update match with payment success
        await prismadb.match.update({
          where: { id: matchId },
          data: {
            paymentStatus: 'completed',
            paymentIntentId: paymentIntent.id,
            paymentCompletedAt: new Date(),
          },
        });
        
        console.log(`Match ${matchId} payment completed successfully`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const { type, matchId } = paymentIntent.metadata;
      
      if (type === 'lease_deposit_and_rent' && matchId) {
        // Handle payment failure
        console.log(`Payment failed for match ${matchId}`);
        
        await prismadb.match.update({
          where: { id: matchId },
          data: {
            paymentStatus: 'failed',
            paymentIntentId: paymentIntent.id,
          },
        });
        
        console.log(`Match ${matchId} payment marked as failed`);
      }
    }

    // Return a success response
    return NextResponse.json({ received: true, type: event.type });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}