/**
 * Stripe Connect Webhook Event Handlers
 *
 * Handles connected account (host) events: account.updated, deauthorization, person updates, bank account changes
 * For documentation, see /docs/webhooks/stripe.md
 */
import prismadb from '@/lib/prismadb';

export async function handleAccountUpdated(event: any): Promise<void> {
  const account = event.data.object;
  const accountId = account.id;

  console.log(`📋 Account updated: ${accountId}`);
  console.log(`   charges_enabled: ${account.charges_enabled}`);
  console.log(`   payouts_enabled: ${account.payouts_enabled}`);
  console.log(`   requirements.currently_due: ${JSON.stringify(account.requirements?.currently_due || [])}`);

  // Find the user with this Stripe account
  const user = await prismadb.user.findFirst({
    where: { stripeAccountId: accountId }
  });

  if (user) {
    // Determine account status
    let accountStatus = 'enabled';
    if (account.requirements?.disabled_reason) {
      accountStatus = 'disabled';
    } else if (account.requirements?.past_due && account.requirements.past_due.length > 0) {
      accountStatus = 'restricted';
    } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      accountStatus = 'pending';
    }

    // Update user with latest account information
    await prismadb.user.update({
      where: { id: user.id },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeAccountStatus: accountStatus,
        stripeRequirementsDue: JSON.stringify({
          currently_due: account.requirements?.currently_due || [],
          past_due: account.requirements?.past_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          disabled_reason: account.requirements?.disabled_reason || null
        }),
        stripeAccountLastChecked: new Date(),
      },
    });

    console.log(`✅ Updated user ${user.id} - status: ${accountStatus}`);

    // Handle critical status changes
    if (!account.charges_enabled) {
      console.warn(`⚠️ Host ${user.id} CANNOT accept charges!`);
      console.warn(`   Reason: ${account.requirements?.disabled_reason || 'Unknown'}`);

      // TODO: Send email notification to host
      // TODO: Pause all listings for this host
      // TODO: Notify admin dashboard
    }

    if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      console.warn(`📝 Host ${user.id} has missing requirements:`, account.requirements.currently_due);

      // TODO: Send email to host with required documents list
      // TODO: Show banner in host dashboard
    }

    if (account.requirements?.past_due && account.requirements.past_due.length > 0) {
      console.error(`🚨 Host ${user.id} has OVERDUE requirements:`, account.requirements.past_due);

      // TODO: Mark host as restricted
      // TODO: Send urgent email
      // TODO: Pause listings
    }

  } else {
    console.warn(`⚠️ Received account.updated for unknown account: ${accountId}`);
  }
}

export async function handleAccountDeauthorized(event: any): Promise<void> {
  const account = event.data.object;
  const accountId = account.id;

  console.log(`🚨 Account DEAUTHORIZED: ${accountId}`);

  // Find the user with this Stripe account
  const user = await prismadb.user.findFirst({
    where: { stripeAccountId: accountId },
    include: {
      listings: true,
      bookings: {
        where: {
          status: {
            in: ['reserved', 'pending_payment', 'confirmed']
          }
        }
      }
    }
  });

  if (user) {
    // Clear Stripe account information
    await prismadb.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: null,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      },
    });

    console.log(`❌ Cleared Stripe account from user ${user.id}`);

    // Handle active bookings
    if (user.bookings.length > 0) {
      console.warn(`⚠️ Host has ${user.bookings.length} active bookings`);
      // TODO: Cancel pending bookings
      // TODO: Notify renters
      // TODO: Issue refunds if needed
    }

    // TODO: Pause/unpublish all listings
    // TODO: Send notification to host confirming disconnection
    // TODO: Alert admin dashboard
    // TODO: Log security event

  } else {
    console.warn(`⚠️ Received deauthorization for unknown account: ${accountId}`);
  }
}

export async function handlePersonUpdated(event: any): Promise<void> {
  const person = event.data.object;
  const accountId = person.account;

  console.log(`👤 Person updated for account: ${accountId}`);
  console.log(`   verification.status: ${person.verification?.status}`);

  // Find the user with this Stripe account
  const user = await prismadb.user.findFirst({
    where: { stripeAccountId: accountId }
  });

  if (user) {
    const verificationStatus = person.verification?.status;

    if (verificationStatus === 'verified') {
      console.log(`✅ Identity verified for user ${user.id}`);
      // TODO: Update dashboard to show verified status
      // TODO: Send success email
    } else if (verificationStatus === 'unverified') {
      console.warn(`❌ Identity verification FAILED for user ${user.id}`);
      // TODO: Send email with instructions to retry
      // TODO: Show error in dashboard
    } else if (verificationStatus === 'pending') {
      console.log(`⏳ Identity verification pending for user ${user.id}`);
      // TODO: Update dashboard with pending status
    }

  } else {
    console.warn(`⚠️ Received person.updated for unknown account: ${accountId}`);
  }
}

export async function handleExternalAccountUpdated(event: any): Promise<void> {
  const externalAccount = event.data.object;
  const accountId = externalAccount.account;

  console.log(`🏦 External account updated for: ${accountId}`);
  console.log(`   status: ${externalAccount.status}`);
  console.log(`   last4: ${externalAccount.last4}`);

  // Find the user with this Stripe account
  const user = await prismadb.user.findFirst({
    where: { stripeAccountId: accountId }
  });

  if (user) {
    if (externalAccount.status === 'verification_failed' || externalAccount.status === 'errored') {
      console.error(`🚨 PAYOUT BANK ACCOUNT INVALID for user ${user.id}`);
      console.error(`   Last4: ${externalAccount.last4}`);

      // TODO: Send urgent email to host
      // TODO: Show critical banner in host dashboard
      // TODO: Log for admin review
      // Note: Payments will succeed but funds will accumulate in Stripe
    } else if (externalAccount.status === 'verified') {
      console.log(`✅ Bank account verified for user ${user.id}`);
      // TODO: Send confirmation email
    }

  } else {
    console.warn(`⚠️ Received external_account.updated for unknown account: ${accountId}`);
  }
}
