import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prismadb";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();

    // Verify webhook signature (if configured)
    const signature = headersList.get('x-signature') ||
                     headersList.get('x-medallion-signature') ||
                     headersList.get('medallion-signature') ||
                     headersList.get('authorization');
    const webhookSecret = process.env.MEDALLION_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      console.log('🔐 Verifying webhook signature');

      try {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(body)
          .digest('hex');

        // Try different signature formats that Authenticate.com might use
        const validSignatures = [
          signature, // Raw signature
          `sha256=${expectedSignature}`, // GitHub style
          expectedSignature, // Plain hex
        ];

        const isValidSignature = validSignatures.some(sig => {
          try {
            return crypto.timingSafeEqual(
              Buffer.from(sig),
              Buffer.from(expectedSignature)
            );
          } catch {
            return false;
          }
        });

        if (!isValidSignature) {
          console.error('❌ Invalid webhook signature:', {
            receivedSignature: signature,
            expectedSignature,
            headers: Object.fromEntries(headersList.entries()),
          });
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        console.log('✅ Webhook signature verified');
      } catch (error) {
        console.error('❌ Signature verification failed:', error);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
      }
    } else if (webhookSecret) {
      console.warn('⚠️ Webhook secret configured but no signature header found');
    } else {
      console.log('ℹ️ No webhook secret configured - skipping signature verification');
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

    if (!userAccessCode) {
      console.error('❌ No userAccessCode in webhook event');
      return;
    }

    // Find user by userAccessCode (primary lookup)
    let user = await prisma.user.findFirst({
      where: {
        medallionUserAccessCode: userAccessCode
      }
    });

    if (!user) {
      console.error(`❌ User not found for userAccessCode: ${userAccessCode}`);

      // Log available data for debugging
      console.log('🔍 Webhook debug info:', {
        userAccessCode,
        eventType: event.event,
        hasEmail: !!event.email,
        orderKeys: order ? Object.keys(order) : [],
      });

      // Log recent pending users to help identify sync issues
      const recentPendingUsers = await prisma.user.findMany({
        where: {
          medallionVerificationStatus: 'pending',
          medallionVerificationStartedAt: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
          }
        },
        select: {
          id: true,
          email: true,
          medallionUserAccessCode: true,
          medallionVerificationStartedAt: true
        },
        orderBy: {
          medallionVerificationStartedAt: 'desc'
        },
        take: 10
      });

      console.log('🔍 Recent pending users:', recentPendingUsers.map(u => ({
        id: u.id.substring(0, 8),
        email: u.email,
        accessCode: u.medallionUserAccessCode?.substring(0, 8) + '...',
        startedAt: u.medallionVerificationStartedAt
      })));

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