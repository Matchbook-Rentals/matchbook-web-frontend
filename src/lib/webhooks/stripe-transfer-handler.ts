/**
 * Stripe Transfer Webhook Event Handlers
 *
 * Handles transfer events when using destination charges.
 * Transfers are automatically created when using `transfer_data` parameter.
 * For documentation, see /docs/webhooks/stripe.md
 */
import prismadb from '@/lib/prismadb';
import { sendTransferFailureAlert } from '@/lib/sms-alerts';
import {
  TransferCreatedEvent,
  TransferUpdatedEvent,
  TransferPaidEvent,
  TransferFailedEvent
} from './stripe-event-types';

/**
 * Handle transfer.created events
 * Fires when a transfer to a host's connected account is created
 */
export async function handleTransferCreated(event: TransferCreatedEvent): Promise<void> {
  const transfer = event.data.object;

  console.log(`💸 Transfer created: ${transfer.id}`);
  console.log(`   Amount: $${(transfer.amount / 100).toFixed(2)}`);
  console.log(`   Destination: ${transfer.destination}`);
  console.log(`   Source transaction: ${transfer.source_transaction}`);

  // Find the host user by their Stripe account ID
  const host = await prismadb.user.findFirst({
    where: { stripeAccountId: transfer.destination }
  });

  if (host) {
    console.log(`   Host: ${host.email} (${host.id})`);

    // If transfer is linked to a payment intent, track it
    if (transfer.source_transaction) {
      const match = await prismadb.match.findFirst({
        where: { stripePaymentIntentId: transfer.source_transaction }
      });

      if (match) {
        console.log(`   Match ID: ${match.id}`);

        // TODO: Create or update PaymentTransaction record to track the transfer
        // This helps with financial reporting and reconciliation
      }
    }
  } else {
    console.warn(`⚠️ Transfer to unknown account: ${transfer.destination}`);
  }

  // TODO: Log transfer for audit trail
  // TODO: Track in PaymentTransaction model
}

/**
 * Handle transfer.updated events
 * Fires when transfer details change (rare)
 */
export async function handleTransferUpdated(event: TransferUpdatedEvent): Promise<void> {
  const transfer = event.data.object;

  console.log(`🔄 Transfer updated: ${transfer.id}`);
  console.log(`   Amount: $${(transfer.amount / 100).toFixed(2)}`);
  console.log(`   Destination: ${transfer.destination}`);

  // Find the host user
  const host = await prismadb.user.findFirst({
    where: { stripeAccountId: transfer.destination }
  });

  if (host) {
    console.log(`   Host: ${host.email} (${host.id})`);

    // Check if transfer was reversed
    if (transfer.reversed) {
      console.error(`   ⚠️ TRANSFER REVERSED! Amount reversed: $${(transfer.amount_reversed / 100).toFixed(2)}`);

      // TODO: Alert admin - this is unusual and may indicate a problem
      // TODO: Notify host about reversal
      // TODO: Update PaymentTransaction status
    }
  }

  // TODO: Update PaymentTransaction record if tracking
}

/**
 * Handle transfer.paid events
 * Fires when the transfer successfully arrives in the host's Stripe balance
 */
export async function handleTransferPaid(event: TransferPaidEvent): Promise<void> {
  const transfer = event.data.object;

  console.log(`✅ Transfer PAID: ${transfer.id}`);
  console.log(`   Amount: $${(transfer.amount / 100).toFixed(2)}`);
  console.log(`   Destination: ${transfer.destination}`);

  // Find the host user
  const host = await prismadb.user.findFirst({
    where: { stripeAccountId: transfer.destination }
  });

  if (host) {
    console.log(`   Host: ${host.email} (${host.id})`);
    console.log(`   ✅ Host received funds in their Stripe balance`);

    // If transfer is linked to a payment intent, mark as transferred
    if (transfer.source_transaction) {
      const match = await prismadb.match.findFirst({
        where: { stripePaymentIntentId: transfer.source_transaction }
      });

      if (match) {
        console.log(`   Match ID: ${match.id}`);

        // TODO: Update PaymentTransaction to mark transfer as completed
        // TODO: Send notification to host that funds are available
        // Note: Funds still need to be paid out from Stripe to their bank account
      }
    }
  } else {
    console.warn(`⚠️ Transfer paid to unknown account: ${transfer.destination}`);
  }

  // TODO: Update PaymentTransaction status to 'transferred'
}

/**
 * Handle transfer.failed events
 * Fires when a transfer fails (very rare with destination charges)
 */
export async function handleTransferFailed(event: TransferFailedEvent): Promise<void> {
  const transfer = event.data.object;

  console.error(`❌ TRANSFER FAILED: ${transfer.id}`);
  console.error(`   Amount: $${(transfer.amount / 100).toFixed(2)}`);
  console.error(`   Destination: ${transfer.destination}`);

  // Find the host user
  const host = await prismadb.user.findFirst({
    where: { stripeAccountId: transfer.destination }
  });

  if (host) {
    console.error(`   Host: ${host.email} (${host.id})`);
    console.error(`   🚨 CRITICAL: Transfer to host FAILED!`);

    // If transfer is linked to a payment intent
    if (transfer.source_transaction) {
      const match = await prismadb.match.findFirst({
        where: { stripePaymentIntentId: transfer.source_transaction },
        include: {
          booking: true,
          listing: { include: { user: true } }
        }
      });

      if (match && match.booking) {
        console.error(`   Match ID: ${match.id}`);
        console.error(`   Booking ID: ${match.booking.id}`);

        // TODO: Mark booking as having transfer issues
        // TODO: Send urgent notification email to admin
        // TODO: Send notification to host about transfer failure
        // TODO: The renter's payment succeeded but host didn't receive funds
        //       This requires manual intervention to resolve

        // Possible causes:
        // - Host's account was disabled after payment
        // - Host deauthorized the platform
        // - Account limits exceeded
      }
    }

    // Send SMS alert to subscribed admins (critical alert)
    await sendTransferFailureAlert({
      transferId: transfer.id,
      amount: transfer.amount,
      hostId: host.id,
    });

    // TODO: Update PaymentTransaction status to 'transfer_failed'
    // TODO: Implement automatic retry or manual resolution flow

  } else {
    console.error(`⚠️ Transfer failed for unknown account: ${transfer.destination}`);

    // Send SMS alert for unknown account transfer failure
    await sendTransferFailureAlert({
      transferId: transfer.id,
      amount: transfer.amount,
      hostId: undefined,
    });
  }

  console.error(`🚨 URGENT: Manual intervention required for failed transfer!`);
}
