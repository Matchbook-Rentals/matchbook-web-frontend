import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
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

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await prisma.user.create({
        data: {
          id: id,
          email: email_addresses[0]?.email_address || null,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });

      logger.info('User created via webhook', {
        userId: id,
        email: email_addresses[0]?.email_address,
      });
    } catch (error) {
      logger.error('Error creating user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await prisma.user.update({
        where: { id: id },
        data: {
          email: email_addresses[0]?.email_address || null,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });

      logger.info('User updated via webhook', {
        userId: id,
        firstName: first_name,
        lastName: last_name,
      });
    } catch (error) {
      logger.error('Error updating user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
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

      logger.info('User soft deleted via webhook', {
        userId: id,
      });
    } catch (error) {
      logger.error('Error soft deleting user via webhook', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return new Response('', { status: 200 });
}