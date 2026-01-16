'use server';

import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { checkRole } from '@/utils/roles';
import { revalidatePath } from 'next/cache';

export interface UncapturedPayment {
  visibleId: string; // paymentIntentId for Stripe-only, verificationId if linked
  verificationId: string | null;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  subjectName: string | null;
  creditBucket: string | null;
  creditStatus: string | null;
  paymentAuthorizedAt: Date | null;
  paymentIntentId: string;
  paymentAmount: number;
  paymentStatus: string;
  createdAt: Date;
  purchaseId: string | null;
}

/**
 * Get all uncaptured payments directly from Stripe
 * This is more reliable than querying our database since paymentAuthorizedAt wasn't always set
 */
export async function getUncapturedPayments(): Promise<UncapturedPayment[]> {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized');
  }

  // Query Stripe directly for all payment intents with requires_capture status
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  const uncaptured = paymentIntents.data.filter(
    (pi) => pi.status === 'requires_capture' && pi.metadata?.type === 'matchbookVerification'
  );

  // Enrich with user data from our database
  const enrichedPayments: UncapturedPayment[] = await Promise.all(
    uncaptured.map(async (pi) => {
      const userId = pi.metadata?.userId || '';

      // Try to find user info
      let userEmail: string | null = null;
      let userName: string | null = null;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (user) {
          userEmail = user.email;
          userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
        }
      }

      // Try to find linked verification
      let verificationId: string | null = null;
      let subjectName: string | null = null;
      let creditBucket: string | null = null;
      let creditStatus: string | null = null;
      let purchaseId: string | null = null;

      // Look for purchase with this paymentIntentId in metadata
      const purchase = await prisma.purchase.findFirst({
        where: {
          metadata: {
            string_contains: pi.id,
          },
        },
        include: {
          verification: true,
        },
      });

      if (purchase?.verification) {
        verificationId = purchase.verification.id;
        subjectName = purchase.verification.subjectFirstName && purchase.verification.subjectLastName
          ? `${purchase.verification.subjectFirstName} ${purchase.verification.subjectLastName}`
          : null;
        creditBucket = purchase.verification.creditBucket;
        creditStatus = purchase.verification.creditStatus;
        purchaseId = purchase.id;
      }

      return {
        visibleId: verificationId || pi.id,
        verificationId,
        userId,
        userEmail,
        userName,
        subjectName,
        creditBucket,
        creditStatus,
        paymentAuthorizedAt: new Date(pi.created * 1000),
        paymentIntentId: pi.id,
        paymentAmount: pi.amount,
        paymentStatus: pi.status,
        createdAt: new Date(pi.created * 1000),
        purchaseId,
      };
    })
  );

  return enrichedPayments;
}

/**
 * Get all payments that failed to capture (expired, cancelled, etc.)
 */
export async function getFailedPayments(): Promise<UncapturedPayment[]> {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized');
  }

  // Query Stripe for canceled/expired payment intents
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  const failed = paymentIntents.data.filter(
    (pi) =>
      pi.metadata?.type === 'matchbookVerification' &&
      pi.status !== 'requires_capture' &&
      pi.status !== 'succeeded' &&
      pi.capture_method === 'manual'
  );

  const enrichedPayments: UncapturedPayment[] = await Promise.all(
    failed.map(async (pi) => {
      const userId = pi.metadata?.userId || '';

      let userEmail: string | null = null;
      let userName: string | null = null;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (user) {
          userEmail = user.email;
          userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
        }
      }

      let verificationId: string | null = null;
      let subjectName: string | null = null;
      let creditBucket: string | null = null;
      let creditStatus: string | null = null;
      let purchaseId: string | null = null;

      const purchase = await prisma.purchase.findFirst({
        where: {
          metadata: {
            string_contains: pi.id,
          },
        },
        include: {
          verification: true,
        },
      });

      if (purchase?.verification) {
        verificationId = purchase.verification.id;
        subjectName = purchase.verification.subjectFirstName && purchase.verification.subjectLastName
          ? `${purchase.verification.subjectFirstName} ${purchase.verification.subjectLastName}`
          : null;
        creditBucket = purchase.verification.creditBucket;
        creditStatus = purchase.verification.creditStatus;
        purchaseId = purchase.id;
      }

      return {
        visibleId: verificationId || pi.id,
        verificationId,
        userId,
        userEmail,
        userName,
        subjectName,
        creditBucket,
        creditStatus,
        paymentAuthorizedAt: new Date(pi.created * 1000),
        paymentIntentId: pi.id,
        paymentAmount: pi.amount,
        paymentStatus: pi.status,
        createdAt: new Date(pi.created * 1000),
        purchaseId,
      };
    })
  );

  return enrichedPayments;
}

/**
 * Capture a specific payment
 */
export async function capturePayment(
  verificationId: string | null,
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!checkRole('admin_dev')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    console.log(`[Admin] Capturing payment ${paymentIntentId}`);

    // Verify the payment intent is still capturable
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'requires_capture') {
      return {
        success: false,
        error: `Payment cannot be captured. Current status: ${paymentIntent.status}`,
      };
    }

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

    console.log(`[Admin] Payment captured: ${capturedPayment.id}, status: ${capturedPayment.status}`);

    // Update verification record if we have one
    if (verificationId) {
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          paymentCapturedAt: new Date(),
          auditHistory: {
            push: {
              eventType: 'admin_payment_capture',
              timestamp: new Date().toISOString(),
              data: {
                paymentIntentId: capturedPayment.id,
                amount: capturedPayment.amount,
                status: capturedPayment.status,
              },
              actorType: 'admin',
            },
          },
        },
      });

      // Update purchase status if exists
      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
        select: { purchaseId: true },
      });

      if (verification?.purchaseId) {
        await prisma.purchase.update({
          where: { id: verification.purchaseId },
          data: { status: 'completed' },
        });
      }
    } else {
      // Try to find and update purchase by paymentIntentId in metadata
      const purchase = await prisma.purchase.findFirst({
        where: {
          metadata: {
            string_contains: paymentIntentId,
          },
        },
      });

      if (purchase) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'completed' },
        });
      }
    }

    revalidatePath('/admin/uncaptured-payments');

    return { success: true };
  } catch (err: any) {
    console.error(`[Admin] Failed to capture payment:`, err);
    return {
      success: false,
      error: err.message || 'Failed to capture payment',
    };
  }
}

/**
 * Get summary stats
 */
export async function getPaymentStats(): Promise<{
  uncapturedCount: number;
  failedCount: number;
  totalUncapturedAmount: number;
}> {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized');
  }

  const [uncaptured, failed] = await Promise.all([
    getUncapturedPayments(),
    getFailedPayments(),
  ]);

  const totalUncapturedAmount = uncaptured.reduce(
    (sum, p) => sum + (p.paymentAmount || 0),
    0
  );

  return {
    uncapturedCount: uncaptured.length,
    failedCount: failed.length,
    totalUncapturedAmount,
  };
}
