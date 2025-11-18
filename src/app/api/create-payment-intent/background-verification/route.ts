import { NextResponse, NextRequest } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prismadb';

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🎯 [Verification Setup] Creating card-only setup intent for user:', userId);

    // Parse request body
    const body = await req.json();
    const { returnUrl } = body;

    // Get or create Stripe customer for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        email: true,
        fullName: true,
      }
    });

    if (!user) {
      console.error('❌ [Verification Setup] User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      console.log('🕳 [Verification Setup] No Stripe customer exists, creating new one...');

      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.fullName || undefined,
        metadata: {
          userId: userId,
        },
      });

      console.log('📦 [Verification Setup] Stripe customer created:', customer.id);

      // Save the Stripe customer ID to the user
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      stripeCustomerId = customer.id;
    } else {
      console.log('🆗 [Verification Setup] Using existing Stripe customer:', stripeCustomerId);
    }

    // Generate a unique session identifier
    const sessionId = uuidv4();

    // Create a setup intent to save payment method for future use
    // We'll charge the saved payment method separately via another endpoint
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId, // Attach to customer so payment methods are saved
      metadata: {
        userId,
        type: 'matchbookVerification',
        sessionId,
        amount: '2500', // Store amount in metadata for reference
      },
      // Restrict to only card payment methods (no ACH/bank accounts)
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging the payment method later
    });

    console.log('✅ [Verification Setup] Card-only setup intent created:', setupIntent.id);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      sessionId,
    });
  } catch (error: any) {
    console.error('❌ [Verification Setup] Error creating setup intent:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
