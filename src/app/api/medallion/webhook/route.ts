import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prismadb";
import crypto from "crypto";

// Helper function to fetch user data from Medallion by userAccessCode
async function fetchUserByAccessCode(userAccessCode: string) {
  try {
    const apiKey = process.env.MEDALLION_API_KEY;
    if (!apiKey) {
      console.error('❌ MEDALLION_API_KEY not configured');
      return null;
    }

    console.log(`🔍 Fetching user data from Medallion for userAccessCode: ${userAccessCode.substring(0, 8)}...`);

    const response = await fetch('https://api-v3.authenticating.com/user/summary', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ userAccessCode })
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch user from Medallion: ${response.status} ${response.statusText}`);
      return null;
    }

    const userData = await response.json();
    console.log(`✅ Retrieved user data from Medallion:`, {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userAccessCode: userData.userAccessCode?.substring(0, 8) + '...'
    });

    return userData;
  } catch (error) {
    console.error('❌ Error fetching user from Medallion:', error);
    return null;
  }
}

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
      email: event.email || event.order?.email || event.user?.email,
      hasUserData: !!event.user,
      hasOrderData: !!event.order,
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

    // If not found by userAccessCode, try to find by email using Medallion's API
    if (!user) {
      console.log(`🔍 User not found by userAccessCode: ${userAccessCode}, trying Medallion API lookup`);

      // Fetch user data from Medallion by userAccessCode
      const medallionUserData = await fetchUserByAccessCode(userAccessCode);

      if (medallionUserData && medallionUserData.email) {
        console.log(`🔍 Found email from Medallion API: ${medallionUserData.email}, looking up user`);

        // Find user by email with pending verification status
        user = await prisma.user.findFirst({
          where: {
            email: medallionUserData.email,
            medallionVerificationStatus: 'pending',
            medallionVerificationStartedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });

        if (user) {
          console.log(`✅ Found user by email from Medallion API: ${user.id}, linking userAccessCode: ${userAccessCode}`);

          // Link the userAccessCode to our user record
          await prisma.user.update({
            where: { id: user.id },
            data: {
              medallionUserAccessCode: userAccessCode
            }
          });

          // Update our local user object
          user.medallionUserAccessCode = userAccessCode;
        }
      } else {
        console.log(`❌ Failed to get user data from Medallion API for userAccessCode: ${userAccessCode}`);

        // Fallback: Check if we have email data in the webhook event itself
        const eventEmail = event.email || event.order?.email || event.user?.email;

        if (eventEmail) {
          console.log(`🔍 Found email in webhook: ${eventEmail}, looking up user`);

          // Find user by email with pending verification status
          user = await prisma.user.findFirst({
            where: {
              email: eventEmail,
              medallionVerificationStatus: 'pending',
              medallionVerificationStartedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          });

          if (user) {
            console.log(`✅ Found user by webhook email: ${user.id}, linking userAccessCode: ${userAccessCode}`);

            // Link the userAccessCode to our user record
            await prisma.user.update({
              where: { id: user.id },
              data: {
                medallionUserAccessCode: userAccessCode
              }
            });

            // Update our local user object
            user.medallionUserAccessCode = userAccessCode;
          }
        }

        // If still no user found, try finding most recent pending user (final fallback)
        if (!user) {
          console.log('🔍 Trying to find most recent pending user as final fallback');

          user = await prisma.user.findFirst({
            where: {
              medallionVerificationStatus: 'pending',
              medallionVerificationStartedAt: {
                gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
              }
            },
            orderBy: {
              medallionVerificationStartedAt: 'desc'
            }
          });

          if (user) {
            console.log(`✅ Found recent pending user: ${user.id}, linking userAccessCode: ${userAccessCode}`);

            // Link the userAccessCode to our user record
            await prisma.user.update({
              where: { id: user.id },
              data: {
                medallionUserAccessCode: userAccessCode
              }
            });

            // Update our local user object
            user.medallionUserAccessCode = userAccessCode;
          }
        }
      }

      if (!user) {
        console.error(`❌ User not found for userAccessCode: ${userAccessCode}`);

        // Log available data for debugging
        console.log('🔍 Webhook debug info:', {
          userAccessCode,
          eventType: event.event,
          hasEmail: !!eventEmail,
          eventEmail,
          orderKeys: order ? Object.keys(order) : [],
          fullEventKeys: Object.keys(event),
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
    }

    // Map Medallion status to our status
    let verificationStatus: string;
    let isVerified: boolean;

    switch (status) {
      case 'approved':
      case 'completed':
      case 'success': // Handle success status from LOW_CODE_SDK
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