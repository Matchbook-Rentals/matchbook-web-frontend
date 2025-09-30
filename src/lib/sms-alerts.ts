/**
 * SMS Alert Service
 *
 * Sends urgent SMS alerts to admin subscribers for critical events:
 * - Payment disputes
 * - Refunds
 * - Payment failures
 * - Transfer failures
 *
 * Handles rate limiting, quiet hours, and subscription management
 */
import prismadb from './prismadb';
import { sendSMS } from './twilio';

interface DisputeAlertData {
  disputeId: string;
  amount: number; // in cents
  bookingId?: string | null;
  dueBy?: number | null; // Unix timestamp
}

interface RefundAlertData {
  refundId: string;
  amount: number; // in cents
  bookingId?: string | null;
  refundType: 'full' | 'partial';
}

interface PaymentFailureAlertData {
  matchId: string;
  amount: number; // in cents
  failureCode?: string | null;
  paymentMethod?: string;
}

interface TransferFailureAlertData {
  transferId: string;
  amount: number; // in cents
  hostId?: string;
}

interface MatchCreatedAlertData {
  matchId: string;
  listingAddress: string;
  renterName: string;
  monthlyRent: number; // in cents
}

interface BookingCreatedAlertData {
  bookingId: string;
  matchId: string;
  listingAddress: string;
  renterName: string;
  totalAmount: number; // in cents
  startDate: Date;
  endDate: Date;
}

interface PaymentSuccessAlertData {
  matchId: string;
  bookingId: string;
  amount: number; // in cents
  paymentMethod: string;
  renterName: string;
}

/**
 * Get all active admin alert subscriptions
 */
const getActiveSubscriptions = async (alertType: 'dispute' | 'refund' | 'payment_failure' | 'transfer_failure' | 'match_created' | 'booking_created' | 'payment_success') => {
  const whereClause: any = {
    alertsEnabled: true,
    phoneVerified: true,
  };

  // Add alert type filter
  switch (alertType) {
    case 'dispute':
      whereClause.alertOnDispute = true;
      break;
    case 'refund':
      whereClause.alertOnRefund = true;
      break;
    case 'payment_failure':
      whereClause.alertOnPaymentFailure = true;
      break;
    case 'transfer_failure':
      whereClause.alertOnTransferFailure = true;
      break;
    case 'match_created':
      whereClause.alertOnMatchCreated = true;
      break;
    case 'booking_created':
      whereClause.alertOnBookingCreated = true;
      break;
    case 'payment_success':
      whereClause.alertOnPaymentSuccess = true;
      break;
  }

  return await prismadb.adminAlertSubscription.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });
};

/**
 * Check if current time is within quiet hours
 */
const isWithinQuietHours = (subscription: any): boolean => {
  if (!subscription.quietHoursStart || !subscription.quietHoursEnd) {
    return false; // No quiet hours configured
  }

  try {
    const timezone = subscription.quietHoursTimezone || 'America/New_York';
    const now = new Date();

    // Get current time in subscription's timezone
    const currentTime = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = subscription.quietHoursStart.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = subscription.quietHoursEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false; // On error, allow alert
  }
};

/**
 * Check rate limiting for subscription
 */
const checkRateLimit = async (subscription: any): Promise<boolean> => {
  // Check daily limit
  if (subscription.alertsSentToday >= subscription.dailyAlertLimit) {
    console.warn(`Rate limit hit for ${subscription.phoneNumber}: ${subscription.alertsSentToday}/${subscription.dailyAlertLimit} today`);
    return false;
  }

  // Check minimum time between alerts (5 minutes)
  if (subscription.lastAlertSentAt) {
    const timeSinceLastAlert = Date.now() - subscription.lastAlertSentAt.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (timeSinceLastAlert < fiveMinutes) {
      console.warn(`Rate limit: Last alert sent ${Math.round(timeSinceLastAlert / 1000)}s ago (min 5 min)`);
      return false;
    }
  }

  return true;
};

/**
 * Update rate limit counters after sending
 */
const updateRateLimitCounters = async (subscriptionId: string) => {
  const now = new Date();
  const subscription = await prismadb.adminAlertSubscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) return;

  // Reset daily counter if it's a new day
  const lastAlertDate = subscription.lastAlertSentAt ? new Date(subscription.lastAlertSentAt) : null;
  const isNewDay = !lastAlertDate || lastAlertDate.toDateString() !== now.toDateString();

  await prismadb.adminAlertSubscription.update({
    where: { id: subscriptionId },
    data: {
      lastAlertSentAt: now,
      alertsSentToday: isNewDay ? 1 : subscription.alertsSentToday + 1,
    }
  });
};

/**
 * Send dispute alert to all subscribed admins
 */
export async function sendDisputeAlert(data: DisputeAlertData): Promise<void> {
  console.log(`📱 Preparing dispute alert: ${data.disputeId}`);

  const subscriptions = await getActiveSubscriptions('dispute');

  if (subscriptions.length === 0) {
    console.log('No active dispute alert subscriptions');
    return;
  }

  const dueByFormatted = data.dueBy
    ? new Date(data.dueBy * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  const message = `🚨 DISPUTE ALERT

Amount: $${(data.amount / 100).toFixed(2)}
${data.bookingId ? `Booking: ${data.bookingId.substring(0, 8)}` : 'No booking linked'}
Due: ${dueByFormatted}

Action required - Check admin dashboard`;

  for (const subscription of subscriptions) {
    // Check quiet hours
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    // Check rate limit
    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    // Send SMS
    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Dispute alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send dispute alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send refund alert to all subscribed admins
 */
export async function sendRefundAlert(data: RefundAlertData): Promise<void> {
  console.log(`📱 Preparing refund alert: ${data.refundId}`);

  const subscriptions = await getActiveSubscriptions('refund');

  if (subscriptions.length === 0) {
    console.log('No active refund alert subscriptions');
    return;
  }

  const message = `💸 REFUND PROCESSED

Amount: $${(data.amount / 100).toFixed(2)}
Type: ${data.refundType === 'full' ? 'Full refund' : 'Partial refund'}
${data.bookingId ? `Booking: ${data.bookingId.substring(0, 8)}` : 'No booking linked'}

Check admin dashboard for details`;

  for (const subscription of subscriptions) {
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Refund alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send refund alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send payment failure alert to all subscribed admins
 */
export async function sendPaymentFailureAlert(data: PaymentFailureAlertData): Promise<void> {
  console.log(`📱 Preparing payment failure alert: ${data.matchId}`);

  const subscriptions = await getActiveSubscriptions('payment_failure');

  if (subscriptions.length === 0) {
    console.log('No active payment failure alert subscriptions');
    return;
  }

  const failureReason = data.failureCode || 'Unknown reason';

  const message = `❌ PAYMENT FAILED

Amount: $${(data.amount / 100).toFixed(2)}
Reason: ${failureReason}
Match: ${data.matchId.substring(0, 8)}
${data.paymentMethod ? `Method: ${data.paymentMethod}` : ''}

Action may be required - Check dashboard`;

  for (const subscription of subscriptions) {
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Payment failure alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send payment failure alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send transfer failure alert to all subscribed admins
 */
export async function sendTransferFailureAlert(data: TransferFailureAlertData): Promise<void> {
  console.log(`📱 Preparing transfer failure alert: ${data.transferId}`);

  const subscriptions = await getActiveSubscriptions('transfer_failure');

  if (subscriptions.length === 0) {
    console.log('No active transfer failure alert subscriptions');
    return;
  }

  const message = `🚨 TRANSFER FAILED

Amount: $${(data.amount / 100).toFixed(2)}
Transfer: ${data.transferId.substring(0, 12)}
${data.hostId ? `Host: ${data.hostId.substring(0, 8)}` : ''}

URGENT - Manual intervention required`;

  for (const subscription of subscriptions) {
    // Transfer failures are critical - skip quiet hours check

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Transfer failure alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send transfer failure alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send test alert to specific phone number
 */
export async function sendTestAlert(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  const message = `🔔 TEST ALERT

This is a test alert from Matchbook admin system.

If you received this, your SMS alerts are working correctly!

Time: ${new Date().toLocaleString()}`;

  return await sendSMS(phoneNumber, message);
}

/**
 * Send match created alert to all subscribed admins
 */
export async function sendMatchCreatedAlert(data: MatchCreatedAlertData): Promise<void> {
  console.log(`📱 Preparing match created alert: ${data.matchId}`);

  const subscriptions = await getActiveSubscriptions('match_created');

  if (subscriptions.length === 0) {
    console.log('No active match created alert subscriptions');
    return;
  }

  const message = `🎉 NEW MATCH

Renter: ${data.renterName}
Property: ${data.listingAddress}
Monthly Rent: $${(data.monthlyRent / 100).toFixed(2)}
Match ID: ${data.matchId.substring(0, 8)}

View in admin dashboard`;

  for (const subscription of subscriptions) {
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Match created alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send match created alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send booking created alert to all subscribed admins
 */
export async function sendBookingCreatedAlert(data: BookingCreatedAlertData): Promise<void> {
  console.log(`📱 Preparing booking created alert: ${data.bookingId}`);

  const subscriptions = await getActiveSubscriptions('booking_created');

  if (subscriptions.length === 0) {
    console.log('No active booking created alert subscriptions');
    return;
  }

  const startDate = new Date(data.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endDate = new Date(data.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const message = `📅 NEW BOOKING

Renter: ${data.renterName}
Property: ${data.listingAddress}
Amount: $${(data.totalAmount / 100).toFixed(2)}
Dates: ${startDate} - ${endDate}
Booking ID: ${data.bookingId.substring(0, 8)}

View in admin dashboard`;

  for (const subscription of subscriptions) {
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Booking created alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send booking created alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}

/**
 * Send payment success alert to all subscribed admins
 */
export async function sendPaymentSuccessAlert(data: PaymentSuccessAlertData): Promise<void> {
  console.log(`📱 Preparing payment success alert: ${data.matchId}`);

  const subscriptions = await getActiveSubscriptions('payment_success');

  if (subscriptions.length === 0) {
    console.log('No active payment success alert subscriptions');
    return;
  }

  const message = `💰 PAYMENT RECEIVED

Renter: ${data.renterName}
Amount: $${(data.amount / 100).toFixed(2)}
Method: ${data.paymentMethod}
Booking ID: ${data.bookingId.substring(0, 8)}

Payment processed successfully`;

  for (const subscription of subscriptions) {
    if (isWithinQuietHours(subscription)) {
      console.log(`Skipping ${subscription.phoneNumber} - within quiet hours`);
      continue;
    }

    if (!(await checkRateLimit(subscription))) {
      continue;
    }

    const result = await sendSMS(subscription.phoneNumber, message);

    if (result.success) {
      await updateRateLimitCounters(subscription.id);
      console.log(`✅ Payment success alert sent to ${subscription.user.email}`);
    } else {
      console.error(`❌ Failed to send payment success alert to ${subscription.phoneNumber}: ${result.error}`);
    }
  }
}
