import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { logger } from '@/lib/logger';
import { createNotification } from '@/app/actions/notifications';
import { buildNotificationEmailData } from '@/lib/notification-builders';

export async function POST(req: Request) {
  const startTime = Date.now();

  console.log('🔔 [Clerk Webhook] Received webhook request');

  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  console.log('📋 [Clerk Webhook] Request headers:', {
    svix_id: svix_id ? `${svix_id.substring(0, 15)}...` : 'MISSING',
    svix_timestamp: svix_timestamp || 'MISSING',
    svix_signature: svix_signature ? `${svix_signature.substring(0, 20)}...` : 'MISSING'
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ [Clerk Webhook] Missing Svix headers');
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  console.log('📦 [Clerk Webhook] Payload preview:', JSON.stringify(body, null, 2).substring(0, 500));

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  console.log('🔐 [Clerk Webhook] Verifying signature...');
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log('✅ [Clerk Webhook] Signature verified');
  } catch (err) {
    console.error('❌ [Clerk Webhook] Error verifying webhook:', err);
    console.error('   Error type:', err instanceof Error ? err.name : typeof err);
    console.error('   Error message:', err instanceof Error ? err.message : String(err));
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log('🏷️ [Clerk Webhook] Event type:', eventType);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    console.log('👤 [Clerk Webhook] Processing user.created event');
    console.log('   User data:', {
      id,
      email: email_addresses[0]?.email_address,
      firstName: first_name,
      lastName: last_name,
      hasImage: !!image_url
    });

    try {
      console.log('💾 [Clerk Webhook] Creating user in database...');
      await prisma.user.create({
        data: {
          id: id,
          email: email_addresses[0]?.email_address || null,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });

      console.log('✅ [Clerk Webhook] User created successfully');
      logger.info('User created via webhook', {
        userId: id,
        email: email_addresses[0]?.email_address,
      });

      // Send welcome notification
      console.log('📧 [Clerk Webhook] Sending welcome notification...');
      try {
        const emailData = buildNotificationEmailData('welcome_renter', {});
        await createNotification({
          userId: id,
          content: 'Welcome to MatchBook!',
          actionType: 'welcome_renter',
          url: '/app/rent/searches',
          read: false,
          emailData
        });
        console.log('✅ [Clerk Webhook] Welcome notification sent successfully');
        logger.info('Welcome notification sent to new user', { userId: id });
      } catch (emailError) {
        // Don't fail webhook if email fails
        console.error('❌ [Clerk Webhook] Error sending welcome notification:', emailError);
        logger.error('Failed to send welcome notification', {
          userId: id,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('❌ [Clerk Webhook] Error creating user:', error);
      console.error('   Error type:', error instanceof Error ? error.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      logger.error('Error creating user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    console.log('🔄 [Clerk Webhook] Processing user.updated event');
    console.log('   User data:', {
      id,
      email: email_addresses[0]?.email_address,
      firstName: first_name,
      lastName: last_name,
      hasImage: !!image_url
    });

    try {
      console.log('💾 [Clerk Webhook] Updating user in database...');
      await prisma.user.update({
        where: { id: id },
        data: {
          email: email_addresses[0]?.email_address || null,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });

      console.log('✅ [Clerk Webhook] User updated successfully');
      logger.info('User updated via webhook', {
        userId: id,
        firstName: first_name,
        lastName: last_name,
      });
    } catch (error) {
      console.error('❌ [Clerk Webhook] Error updating user:', error);
      console.error('   Error type:', error instanceof Error ? error.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      logger.error('Error updating user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    console.log('🗑️ [Clerk Webhook] Processing user.deleted event');
    console.log('   User ID:', id);

    try {
      console.log('💾 [Clerk Webhook] Soft deleting user and clearing PII...');
      await prisma.user.update({
        where: { id: id },
        data: {
          deletedAt: new Date(),
          deletedBy: 'clerk_webhook',
          // Clear PII for privacy while maintaining referential integrity
          email: null,
          firstName: 'Deleted',
          lastName: 'User',
          fullName: 'Deleted User',
          imageUrl: null,
          // Clear sensitive data
          authenticatedFirstName: null,
          authenticatedMiddleName: null,
          authenticatedLastName: null,
          authenticatedDateOfBirth: null,
          stripeAccountId: null,
          stripeCustomerId: null,
          hospitableAccessToken: null,
          hospitableRefreshToken: null,
          hospitableAccountId: null,
        },
      });

      console.log('✅ [Clerk Webhook] User soft deleted successfully');
      logger.info('User soft deleted via webhook', {
        userId: id,
      });
    } catch (error) {
      console.error('❌ [Clerk Webhook] Error soft deleting user:', error);
      console.error('   Error type:', error instanceof Error ? error.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      logger.error('Error soft deleting user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const processingTime = Date.now() - startTime;
  console.log('✅ [Clerk Webhook] Webhook processed successfully');
  console.log('⏱️ [Clerk Webhook] Processing time:', processingTime, 'ms');

  return new Response('', { status: 200 });
}