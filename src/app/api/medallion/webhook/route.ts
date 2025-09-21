import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prismadb";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();

    // Verify webhook signature (if Medallion provides one)
    const signature = headersList.get('x-medallion-signature') || headersList.get('medallion-signature');
    const webhookSecret = process.env.MEDALLION_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`))) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    // Debug: Log the full payload to understand the structure
    console.log('Medallion webhook full payload:', JSON.stringify(event, null, 2));

    console.log('Medallion webhook received:', {
      type: event.type,
      userId: event.user_id,
      externalId: event.external_id,
      status: event.status,
    });

    // Handle different event types
    switch (event.type) {
      case 'verification.completed':
      case 'verification.approved':
      case 'verification.rejected':
      case 'verification.expired':
        await handleVerificationStatusUpdate(event);
        break;

      case 'verification.started':
        await handleVerificationStarted(event);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Medallion webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleVerificationStatusUpdate(event: any) {
  try {
    const { user_id: medallionUserId, external_id: userId, status, verification_result } = event;

    // Find user by either our user ID or Medallion user ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { medallionUserId: medallionUserId }
        ]
      }
    });

    if (!user) {
      console.error(`User not found for Medallion user ID: ${medallionUserId}, external ID: ${userId}`);
      return;
    }

    // Map Medallion status to our status
    let verificationStatus: string;
    let isVerified: boolean;

    switch (status) {
      case 'approved':
      case 'completed':
        verificationStatus = 'approved';
        isVerified = true;
        break;
      case 'rejected':
      case 'failed':
        verificationStatus = 'rejected';
        isVerified = false;
        break;
      case 'expired':
        verificationStatus = 'expired';
        isVerified = false;
        break;
      default:
        verificationStatus = status;
        isVerified = false;
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        medallionIdentityVerified: isVerified,
        medallionVerificationStatus: verificationStatus,
        medallionVerificationCompletedAt: isVerified ? new Date() : null,
        // Store the Medallion user ID if we don't have it
        medallionUserId: user.medallionUserId || medallionUserId,
      },
    });

    console.log(`Updated verification status for user ${user.id}: ${verificationStatus} (verified: ${isVerified})`);

    // Here you could add additional logic like:
    // - Send email notifications
    // - Update onboarding progress
    // - Trigger other workflows

  } catch (error) {
    console.error('Error handling verification status update:', error);
    throw error;
  }
}

async function handleVerificationStarted(event: any) {
  try {
    const { user_id: medallionUserId, external_id: userId } = event;

    // Find user by either our user ID or Medallion user ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { medallionUserId: medallionUserId }
        ]
      }
    });

    if (!user) {
      console.error(`User not found for verification started webhook: ${medallionUserId}, external ID: ${userId}`);
      return;
    }

    // Update verification started timestamp if not already set
    if (!user.medallionVerificationStartedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          medallionVerificationStartedAt: new Date(),
          medallionVerificationStatus: 'pending',
          medallionUserId: user.medallionUserId || medallionUserId,
        },
      });
    }

    console.log(`Verification started for user ${user.id}`);
  } catch (error) {
    console.error('Error handling verification started:', error);
    throw error;
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET(request: NextRequest) {
  // Some webhook services require a verification challenge
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: 'Medallion webhook endpoint active' });
}