# ACH Payment Failure Pages

When an ACH payment fails 3-5 days after initiation, we need dedicated pages for both the host and renter to understand the situation and take action.

## Architecture Overview

Instead of automatic cancellation after 48 hours, we provide manual action pages that:
- Explain what happened
- Show countdown timer (48 hours)
- Provide communication options
- Allow cancellation with consequences

## Page Routes

### Renter Page
**Route**: `/app/rent/booking/[bookingId]/payment-failure`

**Access Control**:
- Must be the renter (booking.userId === currentUserId)
- Booking must have `status = 'payment_failed'`
- Redirect if unauthorized or wrong status

### Host Page
**Route**: `/app/host/booking/[bookingId]/payment-failure`

**Access Control**:
- Must be the host (listing.userId === currentUserId)
- Booking must have `status = 'payment_failed'`
- Redirect if unauthorized or wrong status

---

## Renter Page Specification

### `/app/rent/booking/[bookingId]/payment-failure/page.tsx`

#### UI Components

**1. Alert Banner (Red/Urgent)**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Payment Failed</AlertTitle>
  <AlertDescription>
    Your ACH payment could not be processed.
    Reason: {humanReadableReason}
  </AlertDescription>
</Alert>
```

**2. Countdown Timer**
```tsx
<CountdownTimer
  deadline={booking.updatedAt + 48 hours}
  onExpire={() => {
    // Show "Time Expired" message
    // Disable retry button
    // Show only "Cancel Booking" option
  }}
/>

Display:
  "⏰ 42 hours, 15 minutes remaining to resolve"

When < 12 hours:
  Red text: "🚨 URGENT: Only 8 hours remaining"
```

**3. Failure Details Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>What Happened?</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Failure Reason: {humanReadableReason}</p>
    <p>Original Payment Method: ACH - Bank ending in {last4}</p>
    <p>Amount: ${amount}</p>
    <p>Booking ID: {bookingId}</p>
  </CardContent>
</Card>
```

**4. Action Buttons (Primary CTAs)**
```tsx
<div className="flex flex-col gap-4">
  {/* Primary Action - Retry with different payment */}
  <Button
    variant="default"
    size="lg"
    onClick={() => router.push(`/app/rent/match/${matchId}/retry-payment`)}
    disabled={timeExpired}
  >
    🔄 Retry Payment with Different Method
  </Button>

  {/* Secondary Action - Contact host */}
  <Button
    variant="outline"
    onClick={() => router.push(`/app/rent/messages?booking=${bookingId}`)}
  >
    💬 Message Host
  </Button>

  {/* Destructive Action - Cancel */}
  <Button
    variant="destructive"
    onClick={() => setShowCancelDialog(true)}
  >
    ❌ Cancel Booking
  </Button>
</div>
```

**5. Cancel Booking Dialog**
```tsx
<AlertDialog open={showCancelDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to cancel this booking?

        Consequences:
        • You will lose this property
        • The dates will become available to others
        • Your match will be marked as cancelled
        • You'll need to start a new search

        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep Booking</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleCancelBooking}
        className="bg-destructive"
      >
        Yes, Cancel Booking
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Server Action: `cancelBookingAsRenter()`

```typescript
// src/app/actions/cancel-booking.ts
export async function cancelBookingAsRenter(bookingId: string) {
  const { userId } = auth();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { include: { user: true } },
      user: true,
      match: true
    }
  });

  // Verify renter
  if (booking.userId !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify booking is in failed state
  if (booking.status !== 'payment_failed') {
    return { success: false, error: 'Booking not in failed state' };
  }

  // Cancel booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'renter',
      cancellationReason: 'Payment failure - renter cancelled'
    }
  });

  // Update match
  if (booking.matchId) {
    await prisma.match.update({
      where: { id: booking.matchId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });
  }

  // Remove listing unavailability
  await prisma.listingUnavailability.deleteMany({
    where: {
      listingId: booking.listingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      reason: 'Booking'
    }
  });

  // Send cancellation email to host
  await sendBookingCancelledEmail({
    hostEmail: booking.listing.user.email,
    hostName: `${booking.listing.user.firstName} ${booking.listing.user.lastName}`,
    renterName: `${booking.user.firstName} ${booking.user.lastName}`,
    bookingId,
    reason: 'Payment failure - renter cancelled',
    listingAddress: booking.listing.locationString
  });

  return { success: true };
}
```

---

## Host Page Specification

### `/app/host/booking/[bookingId]/payment-failure/page.tsx`

#### UI Components

**1. Informational Banner (Warning, not error)**
```tsx
<Alert variant="warning">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Booking Payment Failed</AlertTitle>
  <AlertDescription>
    The renter's ACH payment could not be processed.
    They have been notified and have 48 hours to resolve.
  </AlertDescription>
</Alert>
```

**2. Countdown Timer (Same as renter)**
```tsx
<CountdownTimer
  deadline={booking.updatedAt + 48 hours}
  label="Time remaining for renter to resolve"
/>
```

**3. Situation Summary Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Booking Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p><strong>Renter:</strong> {renter.firstName} {renter.lastName}</p>
    <p><strong>Property:</strong> {listing.locationString}</p>
    <p><strong>Dates:</strong> {formatDateRange(startDate, endDate)}</p>
    <p><strong>Amount:</strong> ${amount}</p>
    <p><strong>Failure Reason:</strong> {humanReadableReason}</p>
    <p><strong>Status:</strong> Waiting for renter action</p>
  </CardContent>
</Card>
```

**4. What Happens Next Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>What Happens Next?</CardTitle>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2">
      <li>✉️ The renter has been notified via email</li>
      <li>⏰ They have 48 hours to retry with a different payment method</li>
      <li>💳 If they successfully retry, the booking will be confirmed</li>
      <li>❌ If time expires, you can cancel and make dates available</li>
      <li>💬 You can message them to discuss the situation</li>
    </ul>
  </CardContent>
</Card>
```

**5. Action Buttons**
```tsx
<div className="flex flex-col gap-4">
  {/* Primary Action - Wait/Message */}
  <Button
    variant="default"
    onClick={() => router.push(`/app/host/messages?booking=${bookingId}`)}
  >
    💬 Message Renter
  </Button>

  {/* Conditional - Only show after 48 hours OR if host wants to cancel early */}
  {(timeExpired || showForceCancel) && (
    <Button
      variant="destructive"
      onClick={() => setShowCancelDialog(true)}
    >
      ❌ Cancel Booking & Unapprove
    </Button>
  )}

  {/* Allow host to force cancel before 48h (with warning) */}
  {!timeExpired && !showForceCancel && (
    <Button
      variant="ghost"
      onClick={() => setShowForceCancel(true)}
    >
      I don't want to wait
    </Button>
  )}
</div>
```

**6. Cancel & Unapprove Dialog**
```tsx
<AlertDialog open={showCancelDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancel Booking & Unapprove?</AlertDialogTitle>
      <AlertDialogDescription>
        {timeExpired ? (
          "The 48-hour window has expired. You can now cancel this booking."
        ) : (
          "⚠️ The renter still has time to resolve payment. Are you sure you want to cancel now?"
        )}

        This will:
        • Cancel the booking immediately
        • Mark your approval as withdrawn
        • Make the dates available for other renters
        • Notify the renter that you've cancelled

        {!timeExpired && "Consider messaging the renter first to discuss the situation."}

        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep Booking</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleCancelAndUnapprove}
        className="bg-destructive"
      >
        Yes, Cancel & Unapprove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Server Action: `cancelBookingAsHost()`

```typescript
// src/app/actions/cancel-booking.ts
export async function cancelBookingAsHost(
  bookingId: string,
  reason?: string
) {
  const { userId } = auth();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { include: { user: true } },
      user: true,
      match: true
    }
  });

  // Verify host
  if (booking.listing.userId !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify booking is in failed state
  if (booking.status !== 'payment_failed') {
    return { success: false, error: 'Booking not in failed state' };
  }

  // Cancel booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'host',
      cancellationReason: reason || 'Payment failure - host cancelled'
    }
  });

  // Update match - mark as unapproved/cancelled
  if (booking.matchId) {
    await prisma.match.update({
      where: { id: booking.matchId },
      data: {
        status: 'unapproved', // Host withdrew approval
        approvedByHost: false,
        cancelledAt: new Date()
      }
    });
  }

  // Remove listing unavailability
  await prisma.listingUnavailability.deleteMany({
    where: {
      listingId: booking.listingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      reason: 'Booking'
    }
  });

  // Send cancellation email to renter
  await sendBookingCancelledByHostEmail({
    renterEmail: booking.user.email,
    renterName: `${booking.user.firstName} ${booking.user.lastName}`,
    hostName: `${booking.listing.user.firstName} ${booking.listing.user.lastName}`,
    bookingId,
    reason: reason || 'Payment could not be resolved in time',
    listingAddress: booking.listing.locationString
  });

  return { success: true };
}
```

---

## Notification System Integration

### Email Updates

Update `sendPaymentFailureEmails()` in `/src/lib/emails.ts`:

**Renter Email**:
```html
<a href="${process.env.NEXT_PUBLIC_URL}/app/rent/booking/${params.bookingId}/payment-failure" class="cta-button">
  View Payment Issue & Take Action
</a>
```

**Host Email**:
```html
<a href="${process.env.NEXT_PUBLIC_URL}/app/host/booking/${params.bookingId}/payment-failure" class="cta-button">
  View Booking Status
</a>
```

### In-App Notifications

Create notification records when payment fails:

```typescript
// In payment-webhook/route.ts after updating booking status

// Notification for renter
await prisma.notification.create({
  data: {
    userId: match.trip.userId,
    type: 'payment_failed',
    title: '⚠️ Payment Failed - Action Required',
    message: `Your payment for ${listing.locationString} could not be processed. You have 48 hours to retry with a different payment method.`,
    link: `/app/rent/booking/${booking.id}/payment-failure`,
    priority: 'urgent',
    read: false
  }
});

// Notification for host
await prisma.notification.create({
  data: {
    userId: match.listing.userId,
    type: 'payment_failed_host',
    title: 'Booking Payment Issue',
    message: `Payment for booking by ${renter.firstName} ${renter.lastName} failed. They have been notified and have 48 hours to resolve.`,
    link: `/app/host/booking/${booking.id}/payment-failure`,
    priority: 'high',
    read: false
  }
});
```

---

## Database Schema Updates

Add fields to Booking model:

```prisma
model Booking {
  // ... existing fields

  cancelledAt         DateTime?
  cancelledBy         String?   // "renter", "host", "system"
  cancellationReason  String?   @db.Text
}
```

Add fields to Match model:

```prisma
model Match {
  // ... existing fields

  cancelledAt         DateTime?
  unapprovedAt        DateTime? // When host withdrew approval
}
```

---

## Shared Components

### CountdownTimer Component

**File**: `/src/components/CountdownTimer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: Date | string;
  label?: string;
  onExpire?: () => void;
}

export function CountdownTimer({
  deadline,
  label = "Time remaining",
  onExpire
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  const isUrgent = timeLeft.hours < 12 && !timeLeft.expired;
  const isCritical = timeLeft.hours < 6 && !timeLeft.expired;

  if (timeLeft.expired) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Time Expired</strong> - The 48-hour window has closed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={isCritical ? "destructive" : isUrgent ? "warning" : "default"}>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={`text-2xl font-bold mt-1 ${isCritical ? 'text-red-600' : ''}`}>
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
          {isCritical && (
            <span className="text-xs mt-1 text-red-600">
              🚨 URGENT: Less than 6 hours remaining
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

---

## File Structure

```
src/
├── app/
│   ├── rent/
│   │   └── booking/
│   │       └── [bookingId]/
│   │           └── payment-failure/
│   │               ├── page.tsx (server component)
│   │               └── payment-failure-client.tsx (client component)
│   │
│   ├── host/
│   │   └── booking/
│   │       └── [bookingId]/
│   │           └── payment-failure/
│   │               ├── page.tsx (server component)
│   │               └── payment-failure-client.tsx (client component)
│   │
│   └── actions/
│       └── cancel-booking.ts (server actions)
│
├── components/
│   ├── CountdownTimer.tsx
│   └── booking/
│       └── CancelBookingDialog.tsx
│
└── lib/
    └── emails.ts (add booking cancellation emails)
```

---

## Implementation Checklist

### Phase 1: Database & Backend
- [ ] Add `cancelledAt`, `cancelledBy`, `cancellationReason` to Booking model
- [ ] Add `cancelledAt`, `unapprovedAt` to Match model
- [ ] Run `npx prisma db push`
- [ ] Create `cancel-booking.ts` server actions
- [ ] Add booking cancellation emails to `emails.ts`

### Phase 2: Shared Components
- [ ] Create `CountdownTimer.tsx` component
- [ ] Create `CancelBookingDialog.tsx` component
- [ ] Test countdown timer behavior

### Phase 3: Renter Page
- [ ] Create `/app/rent/booking/[bookingId]/payment-failure/page.tsx`
- [ ] Create client component with all UI elements
- [ ] Test access control
- [ ] Test cancel flow
- [ ] Test retry payment redirect

### Phase 4: Host Page
- [ ] Create `/app/host/booking/[bookingId]/payment-failure/page.tsx`
- [ ] Create client component with all UI elements
- [ ] Test access control
- [ ] Test cancel & unapprove flow
- [ ] Test messaging redirect

### Phase 5: Integration
- [ ] Update `payment-webhook/route.ts` to create notifications
- [ ] Update email templates with new links
- [ ] Test end-to-end flow with Stripe test webhooks
- [ ] Add logging/monitoring

---

## Testing Scenarios

### Test 1: Renter Cancels
1. Trigger payment failure webhook
2. Renter navigates to failure page
3. Renter clicks "Cancel Booking"
4. Verify booking cancelled
5. Verify match cancelled
6. Verify dates released
7. Verify host receives email

### Test 2: Host Cancels After 48h
1. Trigger payment failure webhook
2. Advance time 48+ hours (or mock timer)
3. Host navigates to failure page
4. Host clicks "Cancel & Unapprove"
5. Verify booking cancelled
6. Verify match unapproved
7. Verify dates released
8. Verify renter receives email

### Test 3: Renter Retries Successfully
1. Trigger payment failure webhook
2. Renter navigates to failure page
3. Renter clicks "Retry Payment"
4. Renter submits card payment
5. Payment succeeds immediately
6. Verify booking confirmed
7. Verify both parties notified

### Test 4: Timer Expiration
1. Trigger payment failure webhook
2. Mock time to be > 48 hours
3. Verify timer shows "expired"
4. Verify retry button disabled
5. Verify cancel button still works

---

## See Also

- `/docs/stripe-webhooks.md` - Webhook event documentation
- `/docs/payment-spec.md` - Payment flow specification
- `/src/app/app/rent/match/[matchId]/retry-payment/README.md` - Retry payment UI spec
