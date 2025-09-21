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
      event: event.event,
      userAccessCode: event.order?.userAccessCode,
      status: event.order?.status,
      verificationMethod: event.order?.verificationMethod,
    });

    // Handle different event types
    switch (event.event) {
      case 'UPLOAD_ID_ENHANCED_REVIEW_STATUS':
      case 'UPLOAD_PASSPORT_ENHANCED_REVIEW_STATUS':
      case 'SELF_VERIFICATION_TRY_STATUS':
        await handleVerificationStatusUpdate(event);
        break;

      case 'USER_PII_UPDATE':
        await handleVerificationStarted(event);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.event}`);
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
    const { order } = event;
    const { userAccessCode, status, verificationMethod } = order || {};

    // First, try to find user by userAccessCode
    let user = await prisma.user.findFirst({
      where: {
        medallionUserAccessCode: userAccessCode
      }
    });

    // If user not found and we have email in the webhook payload, try email lookup
    if (!user && event.email) {
      console.log(`🔍 Webhook: userAccessCode lookup failed, trying email: ${event.email}`);
      user = await prisma.user.findFirst({
        where: {
          email: event.email
        }
      });

      // If found by email, store the userAccessCode for future lookups
      if (user) {
        console.log(`✅ Found user by email, storing userAccessCode: ${userAccessCode}`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { medallionUserAccessCode: userAccessCode }
        });
      }
    }

    // TODO: Check if webhook contains any other identifying information we can use
    // For now, log the full payload structure to understand what's available
    if (!user) {
      console.error(`❌ User not found for userAccessCode: ${userAccessCode}`);
      console.log('🔍 Available webhook data:', {
        event: event.event,
        hasEmail: !!event.email,
        hasOrder: !!event.order,
        orderKeys: event.order ? Object.keys(event.order) : [],
        fullEventKeys: Object.keys(event)
      });
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
        // Store verification method if available
        ...(verificationMethod && { medallionVerificationMethod: verificationMethod }),
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
    const { order } = event;
    const { userAccessCode } = order || {};

    // Find user by userAccessCode
    const user = await prisma.user.findFirst({
      where: {
        medallionUserAccessCode: userAccessCode
      }
    });

    if (!user) {
      console.error(`User not found for verification started webhook with userAccessCode: ${userAccessCode}`);
      return;
    }

    // Update verification started timestamp if not already set
    if (!user.medallionVerificationStartedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          medallionVerificationStartedAt: new Date(),
          medallionVerificationStatus: 'pending',
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