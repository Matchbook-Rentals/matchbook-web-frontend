# Retry Payment Page

## Purpose
This page allows renters to retry payment with a different payment method after an ACH payment failure.

## Route
`/app/rent/match/[matchId]/retry-payment`

## Implementation Status
⚠️ **TODO**: Full UI implementation needed

## Required Files

### 1. `page.tsx` (Server Component)
```typescript
export default async function RetryPaymentPage({ params }: { params: { matchId: string } }) {
  // Fetch match with booking and failure details
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      booking: true,
      listing: true,
      trip: { include: { user: true } }
    }
  });

  // Verify booking is in failed state
  if (!match?.booking || match.booking.status !== 'payment_failed') {
    redirect(`/app/rent/match/${params.matchId}`);
  }

  // Verify user is the renter
  const { userId } = auth();
  if (userId !== match.trip.userId) {
    redirect('/app/dashboard');
  }

  return (
    <RetryPaymentClient
      match={match}
      failureReason={match.booking.paymentFailureMessage}
      failureCode={match.booking.paymentFailureCode}
      originalAmount={match.paymentAmount}
    />
  );
}
```

### 2. `retry-payment-client.tsx` (Client Component)

**Features to implement:**
- Display clear failure reason
- Show 48-hour countdown timer
- Payment method selector (reuse `PaymentMethodsSection`)
- Amount breakdown
- "Retry Payment" button
- Call `processDirectPayment()` action
- Show success/error states

**UI Structure:**
```tsx
export default function RetryPaymentClient({ match, failureReason, originalAmount }) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Alert Banner */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription>
          {failureReason}
          <br />
          You have 48 hours to provide alternative payment.
        </AlertDescription>
      </Alert>

      {/* Countdown Timer */}
      <CountdownTimer deadline={/* calculated deadline */} />

      {/* Payment Method Selection */}
      <PaymentMethodsSection
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        // ... other props
      />

      {/* Amount Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show breakdown */}
        </CardContent>
      </Card>

      {/* Retry Button */}
      <Button
        onClick={handleRetryPayment}
        disabled={!selectedMethod || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Retry Payment'}
      </Button>
    </div>
  );
}
```

## Integration Points

### 1. Reuse Existing Components
- `PaymentMethodsSection` from `src/components/payment-review/sections/PaymentMethodsSection.tsx`
- `TotalDueSection` for amount display
- `processDirectPayment` from `src/app/actions/process-payment.ts`

### 2. Add Countdown Timer Component
Create `src/components/CountdownTimer.tsx`:
- Calculate deadline: `booking.updatedAt + 48 hours`
- Show hours:minutes:seconds remaining
- Red warning when <6 hours remain
- Auto-redirect when time expires

### 3. Update Dashboard
Add payment status badges to booking cards:
- 🟡 "Payment Processing" - ACH settling
- 🔴 "Payment Failed - Action Required" - with retry button
- 🟢 "Payment Confirmed" - settled

## Testing

### Test Scenarios
1. **Access Control**: Non-renter cannot access retry page
2. **Invalid Status**: Redirect if booking not in `payment_failed` status
3. **Retry Success**: Card payment succeeds immediately
4. **Retry Success**: ACH payment goes to processing
5. **Retry Failure**: Show error, allow another retry
6. **Expired**: Redirect after 48 hours

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

## Next Steps
1. Create `page.tsx` with server-side logic
2. Create `retry-payment-client.tsx` with full UI
3. Create `CountdownTimer.tsx` component
4. Add booking status badges to dashboard
5. Test full flow end-to-end
6. Add error tracking/monitoring

## See Also
- `/docs/payment-spec.md` - Complete payment specification
- Email templates in `/src/lib/emails.ts`
- Webhook handler in `/src/app/api/payment-webhook/route.ts`
