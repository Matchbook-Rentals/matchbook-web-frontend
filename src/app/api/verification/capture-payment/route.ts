import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { logPaymentEvent } from '@/lib/audit-logger';

// Capture a pre-authorized payment after successful verification
export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    console.log('💰 [Verification] Capturing payment:', paymentIntentId);

    // Retrieve the payment intent to verify it belongs to this user
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId) {
      console.error('❌ [Verification] User mismatch - payment belongs to different user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (paymentIntent.status !== 'requires_capture') {
      console.error('❌ [Verification] Payment not in capturable state:', paymentIntent.status);
      return NextResponse.json(
        { error: `Payment cannot be captured. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

    console.log('✅ [Verification] Payment captured:', {
      id: capturedPayment.id,
      status: capturedPayment.status,
      amount: capturedPayment.amount,
    });

    // Create Purchase record now that payment is captured
    await prisma.purchase.create({
      data: {
        type: 'matchbookVerification',
        amount: capturedPayment.amount,
        userId: userId,
        status: 'completed',
        isRedeemed: false,
        metadata: JSON.stringify({
          paymentIntentId: capturedPayment.id,
        }),
      },
    });

    console.log('✅ [Verification] Purchase record created');

    // Update Verification with payment capture audit
    const verification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (verification) {
      const updatedVerification = await prisma.verification.update({
        where: { id: verification.id },
        data: {
          paymentCapturedAt: new Date(),
        },
      });

      // Log to audit history
      await logPaymentEvent(
        verification.id,
        'payment_captured',
        capturedPayment.id,
        capturedPayment.amount,
        true
      );

      // Comprehensive audit trail for payment capture
      console.log("\n" + "=".repeat(70));
      console.log("💰 VERIFICATION AUDIT TRAIL - PAYMENT CAPTURED");
      console.log("=".repeat(70));

      console.log("\n--- IDENTIFICATION ---");
      console.log("Verification ID:", updatedVerification.id);
      console.log("User ID:", userId);
      console.log("Subject Name:", updatedVerification.subjectFirstName, updatedVerification.subjectLastName);

      console.log("\n--- PAYMENT DETAILS ---");
      console.log("Payment Intent ID:", capturedPayment.id);
      console.log("Amount:", (capturedPayment.amount / 100).toFixed(2), capturedPayment.currency?.toUpperCase());
      console.log("Status:", capturedPayment.status);
      console.log("Payment Method:", capturedPayment.payment_method);
      console.log("Captured At:", new Date().toISOString());

      console.log("\n--- STRIPE METADATA ---");
      console.log("Customer ID:", capturedPayment.customer || "N/A");
      console.log("Receipt Email:", capturedPayment.receipt_email || "N/A");

      console.log("\n" + "=".repeat(70) + "\n");
    }

    return NextResponse.json({
      success: true,
      status: capturedPayment.status,
    });
  } catch (error: any) {
    console.error('❌ [Verification] Error capturing payment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to capture payment',
        details: error.raw?.message,
      },
      { status: 500 }
    );
  }
}
