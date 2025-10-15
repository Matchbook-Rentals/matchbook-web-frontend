'use server';

import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * Creates a Stripe Identity verification session for the current user
 *
 * This initiates the identity verification flow using Stripe Identity (NOT Stripe Connect).
 * Stripe Identity is a separate product from Connect and is used to verify user identities
 * for fraud prevention, compliance, and trust & safety.
 *
 * @returns Object containing clientSecret for frontend verification modal, or error
 */
export async function createStripeVerificationSession() {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get user data from database
    const user = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeVerificationSessionId: true,
        stripeVerificationStatus: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user already has a verified session
    if (user.stripeVerificationStatus === 'verified') {
      return {
        success: false,
        error: 'User is already verified',
        alreadyVerified: true
      };
    }

    // Check if there's an existing session that can be reused
    if (user.stripeVerificationSessionId) {
      try {
        const existingSession = await stripe.identity.verificationSessions.retrieve(
          user.stripeVerificationSessionId
        );

        // If session is still usable (not verified, canceled, or expired), return it
        if (existingSession.status === 'requires_input' || existingSession.status === 'processing') {
          logger.info('Reusing existing Stripe Identity session', {
            userId: user.id,
            sessionId: existingSession.id,
            status: existingSession.status,
          });

          return {
            success: true,
            clientSecret: existingSession.client_secret,
            sessionId: existingSession.id,
          };
        }
      } catch (error) {
        // If session doesn't exist or errored, we'll create a new one
        logger.warn('Could not retrieve existing session, creating new one', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Creating new Stripe Identity verification session', {
      userId: user.id,
      email: user.email,
    });

    // Create a new verification session (modal-based flow)
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      provided_details: {
        email: user.email || undefined,
      },
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        user_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      },
    });

    // Store session ID and initial status in database
    await prismadb.user.update({
      where: { id: user.id },
      data: {
        stripeVerificationSessionId: verificationSession.id,
        stripeVerificationStatus: verificationSession.status,
        stripeVerificationLastCheck: new Date(),
      },
    });

    logger.info('Stripe Identity session created successfully', {
      userId: user.id,
      sessionId: verificationSession.id,
      status: verificationSession.status,
    });

    return {
      success: true,
      clientSecret: verificationSession.client_secret,
      sessionId: verificationSession.id,
    };
  } catch (error) {
    logger.error('Error creating Stripe Identity verification session', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: 'Failed to create verification session. Please try again.',
    };
  }
}

/**
 * Retrieves the current verification status for the logged-in user
 *
 * @returns Object containing verification status and related data
 */
export async function getStripeVerificationStatus() {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        stripeVerificationSessionId: true,
        stripeVerificationStatus: true,
        stripeVerificationLastCheck: true,
        stripeVerificationReportId: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      status: user.stripeVerificationStatus,
      sessionId: user.stripeVerificationSessionId,
      reportId: user.stripeVerificationReportId,
      lastCheck: user.stripeVerificationLastCheck,
    };
  } catch (error) {
    logger.error('Error getting Stripe verification status', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Failed to get verification status',
    };
  }
}

/**
 * Cancels an ongoing verification session
 * This allows the user to start a fresh verification attempt
 *
 * @returns Success/error response
 */
export async function cancelStripeVerificationSession() {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        stripeVerificationSessionId: true,
        stripeVerificationStatus: true,
      },
    });

    if (!user?.stripeVerificationSessionId) {
      return { success: false, error: 'No active verification session' };
    }

    // Can only cancel sessions that are in progress
    if (user.stripeVerificationStatus === 'verified') {
      return { success: false, error: 'Cannot cancel verified session' };
    }

    logger.info('Canceling Stripe Identity session', {
      userId: user.id,
      sessionId: user.stripeVerificationSessionId,
    });

    // Cancel the session in Stripe
    await stripe.identity.verificationSessions.cancel(
      user.stripeVerificationSessionId
    );

    // Update database
    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: {
        stripeVerificationStatus: 'canceled',
        stripeVerificationLastCheck: new Date(),
      },
    });

    logger.info('Stripe Identity session canceled successfully', {
      userId: clerkUser.id,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error canceling Stripe verification session', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Failed to cancel verification session',
    };
  }
}
