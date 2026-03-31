/**
 * Stripe Account Notification Builders (DRAFT — not yet wired up)
 *
 * Helper functions to create in-app notifications when a host's
 * Stripe Connect account is restricted, has past-due requirements,
 * or has currently-due requirements.
 *
 * These will be called from stripe-connect-handler.ts handleAccountUpdated
 * once approved.
 */

import prismadb from '@/lib/prismadb';

// ============================================================================
// Notification: Account Restricted (charges disabled)
// ============================================================================

interface AccountRestrictedNotificationData {
  userId: string;
  stripeAccountId: string;
  disabledReason: string | null;
}

export async function notifyAccountRestricted({
  userId,
  stripeAccountId,
  disabledReason,
}: AccountRestrictedNotificationData) {
  try {
    await prismadb.notification.create({
      data: {
        userId,
        actionType: 'stripe_account_restricted',
        content: 'Your Stripe account has been restricted. Please update your account to continue accepting payments.',
        url: '/app/host/dashboard/overview',
        actionId: stripeAccountId,
        isRead: false,
      }
    });

    console.log(`✅ Created stripe_account_restricted notification for user ${userId}`);
  } catch (err) {
    console.error('Failed to create notification for restricted account:', err);
  }
}

// ============================================================================
// Notification: Requirements Past Due (already overdue)
// ============================================================================

interface RequirementsPastDueNotificationData {
  userId: string;
  stripeAccountId: string;
  pastDueRequirements: string[];
}

export async function notifyRequirementsPastDue({
  userId,
  stripeAccountId,
  pastDueRequirements,
}: RequirementsPastDueNotificationData) {
  try {
    await prismadb.notification.create({
      data: {
        userId,
        actionType: 'stripe_requirements_past_due',
        content: 'Your Stripe account has overdue requirements. Please update your account immediately to avoid service interruption.',
        url: '/app/host/dashboard/overview',
        actionId: stripeAccountId,
        isRead: false,
      }
    });

    console.log(`✅ Created stripe_requirements_past_due notification for user ${userId}`);
    console.log(`   Past due: ${pastDueRequirements.join(', ')}`);
  } catch (err) {
    console.error('Failed to create notification for past due requirements:', err);
  }
}

// ============================================================================
// Notification: Requirements Currently Due (warning, not yet restricted)
// ============================================================================

interface RequirementsDueNotificationData {
  userId: string;
  stripeAccountId: string;
  currentlyDueRequirements: string[];
}

export async function notifyRequirementsDue({
  userId,
  stripeAccountId,
  currentlyDueRequirements,
}: RequirementsDueNotificationData) {
  try {
    await prismadb.notification.create({
      data: {
        userId,
        actionType: 'stripe_requirements_due',
        content: 'Your Stripe account needs attention. Please update your information to keep your account in good standing.',
        url: '/app/host/dashboard/overview',
        actionId: stripeAccountId,
        isRead: false,
      }
    });

    console.log(`✅ Created stripe_requirements_due notification for user ${userId}`);
    console.log(`   Currently due: ${currentlyDueRequirements.join(', ')}`);
  } catch (err) {
    console.error('Failed to create notification for due requirements:', err);
  }
}
