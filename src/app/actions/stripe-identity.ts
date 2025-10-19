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
        stripeAccountId: true,
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
    // IMPORTANT: Session reuse is REQUIRED by Stripe for retry attempts
    // Reference: https://docs.stripe.com/identity/how-sessions-work
    //
    // From Stripe docs:
    // "If the verification process is interrupted and resumes later, attempt to reuse
    // the same VerificationSession instead of creating a new one. Each VerificationSession
    // tracks failed verification attempts, so reusing the same session can help maintain
    // a history of verification attempts."
    //
    // Status flow for retries:
    // 1. User starts verification → status: 'requires_input'
    // 2. Verification fails (e.g., expired ID) → status: 'requires_input' with last_error
    // 3. User clicks "Try Again" → REUSE same session with same client_secret
    // 4. Stripe tracks retry history within the session
    //
    // Future enhancement: Parse session.last_error and display user-friendly message
    // Error codes: document_expired, document_unreadable, selfie_document_face_mismatch, etc.
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
            hasError: !!existingSession.last_error,
            errorCode: existingSession.last_error?.code,
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

    // Check if we can link this verification to their Connect account
    // This allows Identity verification to automatically fulfill Connect ID requirements
    let relatedPerson = undefined;

    if (user.stripeAccountId) {
      try {
        // Fetch account to check business_type
        const account = await stripe.accounts.retrieve(user.stripeAccountId);

        // Only attach to related_person if account is individual
        // Per Stripe docs: "You can't collect person.verification.additional_document
        // and company.verification.document with Stripe Identity"
        if (account.business_type === 'individual') {
          // List persons on the account (for individual accounts, there's typically one)
          const persons = await stripe.accounts.listPersons(user.stripeAccountId, { limit: 1 });
          const personId = persons.data[0]?.id;

          if (personId) {
            relatedPerson = {
              account: user.stripeAccountId,
              person: personId,
            };

            logger.info('Linking Identity verification to Connect account', {
              userId: user.id,
              accountId: user.stripeAccountId,
              personId: personId,
              businessType: 'individual',
            });
          } else {
            logger.warn('No Person found on Connect account, creating standalone session', {
              userId: user.id,
              accountId: user.stripeAccountId,
            });
          }
        } else {
          logger.info('Skipping related_person attachment - account is not individual', {
            userId: user.id,
            accountId: user.stripeAccountId,
            businessType: account.business_type,
          });
        }
      } catch (error) {
        logger.warn('Could not link verification to Connect account, creating standalone session', {
          userId: user.id,
          accountId: user.stripeAccountId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Fall back to standalone verification
      }
    } else {
      logger.info('No Connect account yet, creating standalone Identity verification', {
        userId: user.id,
      });
    }

    // Create a new verification session (modal-based flow)
    // If relatedPerson is defined, this will automatically attach to Connect account
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      ...(relatedPerson && { related_person: relatedPerson }),
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
      linkedToConnectAccount: !!relatedPerson,
      connectAccountId: relatedPerson ? user.stripeAccountId : undefined,
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
 * Returns cached status from database (does not poll Stripe)
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
 * Polls Stripe directly for fresh verification status and updates database
 * Use this as a fallback when webhooks fail or are delayed
 *
 * Called automatically by RSC on page load when user has pending verification session
 * This ensures UI is always up-to-date even if webhooks are delayed
 *
 * @returns Object containing fresh verification status from Stripe
 */
export async function refreshStripeVerificationStatus() {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        id: true,
        stripeVerificationSessionId: true,
        stripeVerificationStatus: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.stripeVerificationSessionId) {
      return {
        success: false,
        error: 'No verification session found',
      };
    }

    logger.info('Polling Stripe for fresh verification status', {
      userId: user.id,
      sessionId: user.stripeVerificationSessionId,
      currentStatus: user.stripeVerificationStatus,
    });

    // Fetch fresh status from Stripe
    const session = await stripe.identity.verificationSessions.retrieve(
      user.stripeVerificationSessionId
    );

    logger.info('Received fresh status from Stripe', {
      userId: user.id,
      sessionId: session.id,
      oldStatus: user.stripeVerificationStatus,
      newStatus: session.status,
    });

    // Update database with fresh data
    const updatedUser = await prismadb.user.update({
      where: { id: user.id },
      data: {
        stripeVerificationStatus: session.status,
        stripeVerificationLastCheck: new Date(),
        stripeVerificationReportId: session.last_verification_report?.id || null,
        stripeIdentityPayload: session as any, // Store full session data
      },
      select: {
        stripeVerificationStatus: true,
        stripeVerificationSessionId: true,
        stripeVerificationReportId: true,
        stripeVerificationLastCheck: true,
      },
    });

    // If newly verified, extract authenticated name and DOB from verification report
    if (session.status === 'verified' && session.last_verification_report) {
      try {
        const report = await stripe.identity.verificationReports.retrieve(
          session.last_verification_report.id
        );

        // Extract verified data from the document
        const verifiedData = report.document;
        if (verifiedData) {
          const updateData: any = {};

          // Update authenticated name if available
          if (verifiedData.first_name) {
            updateData.authenticatedFirstName = verifiedData.first_name;
          }
          if (verifiedData.last_name) {
            updateData.authenticatedLastName = verifiedData.last_name;
          }

          // Update DOB if available (convert from YYYY-MM-DD to DD-MM-YYYY for consistency)
          if (verifiedData.dob) {
            const dobParts = verifiedData.dob.split('-'); // [YYYY, MM, DD]
            if (dobParts.length === 3) {
              updateData.authenticatedDateOfBirth = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prismadb.user.update({
              where: { id: user.id },
              data: updateData,
            });

            logger.info('Updated authenticated user data from verification report', {
              userId: user.id,
              reportId: report.id,
              updatedFields: Object.keys(updateData),
            });
          }
        }
      } catch (reportError) {
        logger.warn('Could not fetch verification report details', {
          userId: user.id,
          reportId: session.last_verification_report.id,
          error: reportError instanceof Error ? reportError.message : 'Unknown error',
        });
        // Don't fail the whole operation if report fetch fails
      }
    }

    return {
      success: true,
      status: updatedUser.stripeVerificationStatus,
      sessionId: updatedUser.stripeVerificationSessionId,
      reportId: updatedUser.stripeVerificationReportId,
      lastCheck: updatedUser.stripeVerificationLastCheck,
      statusChanged: user.stripeVerificationStatus !== session.status,
    };
  } catch (error) {
    logger.error('Error refreshing Stripe verification status', {
      userId: clerkUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: 'Failed to refresh verification status',
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
