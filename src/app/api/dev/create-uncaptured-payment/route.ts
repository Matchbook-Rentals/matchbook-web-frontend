import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';

/**
 * DEV ONLY: Create an uncaptured payment for testing the admin capture page
 *
 * This simulates a scenario where:
 * 1. User authorized payment (hold placed)
 * 2. Credit check succeeded (we got charged by iSoftPull)
 * 3. But payment capture failed/was missed
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Dev] Creating uncaptured payment for user:', userId);

    // Step 1: Create a PaymentIntent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500, // $25.00
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        userId,
        type: 'verification_test',
        createdBy: 'dev_route',
      },
      // Use a test payment method
      payment_method: 'pm_card_visa',
      confirm: true, // This will place the hold immediately
      return_url: 'http://localhost:3000/dev/payment-complete', // Required for some payment methods
    });

    console.log('[Dev] PaymentIntent created:', paymentIntent.id, 'status:', paymentIntent.status);

    // Step 2: Create Purchase record (with pending status since not captured)
    const purchase = await prisma.purchase.create({
      data: {
        type: 'matchbookVerification',
        amount: paymentIntent.amount,
        userId,
        email: user.email,
        status: 'pending', // Not completed because not captured
        isRedeemed: false,
        metadata: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          createdBy: 'dev_route',
        }),
      },
    });

    console.log('[Dev] Purchase created:', purchase.id);

    // Step 3: Create Verification record that looks like credit check succeeded
    const verification = await prisma.verification.create({
      data: {
        userId,
        purchaseId: purchase.id,
        subjectFirstName: user.firstName || 'Test',
        subjectLastName: user.lastName || 'User',
        status: 'PROCESSING_BGS', // Credit check passed, waiting for background check
        creditStatus: 'completed', // This is key - credit check succeeded
        creditBucket: 'Good', // Simulated credit bucket
        creditCheckedAt: new Date(),
        paymentAuthorizedAt: new Date(), // Payment was authorized
        paymentCapturedAt: null, // But NOT captured - this is the bug we're simulating
        screeningDate: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        auditHistory: [
          {
            eventType: 'dev_uncaptured_payment_created',
            timestamp: new Date().toISOString(),
            data: {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              status: paymentIntent.status,
            },
            actorType: 'dev_route',
          },
        ],
      },
    });

    console.log('[Dev] Verification created:', verification.id);

    return NextResponse.json({
      success: true,
      message: 'Uncaptured payment created successfully',
      data: {
        verificationId: verification.id,
        purchaseId: purchase.id,
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        amount: paymentIntent.amount,
        amountFormatted: `$${(paymentIntent.amount / 100).toFixed(2)}`,
      },
      instructions: 'Go to /admin/uncaptured-payments to see and capture this payment',
    });
  } catch (error: any) {
    console.error('[Dev] Error creating uncaptured payment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create uncaptured payment',
        details: error.raw?.message || error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Show usage instructions
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    endpoint: '/api/dev/create-uncaptured-payment',
    method: 'POST',
    description: 'Creates a test uncaptured payment for testing the admin capture page',
    authentication: 'Required - must be logged in',
    notes: [
      'Creates a Stripe PaymentIntent with manual capture (places hold)',
      'Creates Purchase and Verification records',
      'Simulates a scenario where credit check passed but payment capture was missed',
      'Go to /admin/uncaptured-payments to capture the payment',
    ],
    usage: 'curl -X POST http://localhost:3000/api/dev/create-uncaptured-payment -H "Cookie: <your-auth-cookie>"',
  });
}
