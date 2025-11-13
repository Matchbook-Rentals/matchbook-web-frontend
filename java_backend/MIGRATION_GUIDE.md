# Cron Job Email Migration Guide

This guide walks you through migrating your existing cron job email sending from direct Resend API calls to the queue-based Java worker system.

## Why Migrate?

**Current Issues:**
- Serverless timeout risks (10-minute limit)
- No rate limiting enforcement (Resend has 2 emails/sec limit)
- No automatic retry on failures
- Difficult to monitor email delivery
- Cost scales with invocations

**Benefits After Migration:**
- ✅ Guaranteed 2 emails/sec rate limiting
- ✅ Automatic retries (3 attempts with exponential backoff)
- ✅ No timeout issues (steady-state service)
- ✅ Dead letter queue for failed emails
- ✅ Centralized monitoring via `/health/queue` endpoint
- ✅ Fixed monthly cost (~$15-20)

---

## Current Email-Sending Cron Jobs

| Cron Job | Frequency | Emails/Run | Status |
|----------|-----------|------------|--------|
| check-unread-messages | Every 5 min | 5-100 | ✅ Queue-ready |
| process-rent-payments | Daily 1am PT | 4-20 + admin | ⚠️ Partial (admin needs fix) |
| retry-failed-rent-payments | Weekdays 10am PT | 0-10 | ✅ Queue-ready |
| send-move-in-reminders | Daily | 2-10 | ✅ Queue-ready |
| preview-rent-payments | Daily 1am PT | 1 | ✅ Queue-ready |

**Total Daily Volume:** ~1,500-6,000 emails/day (mostly from check-unread-messages)

---

## Migration Strategy Overview

### Phase 1: Enable Queue for Existing Code (30 minutes)
✅ **Safe** - No code changes, just flip environment variable

Most cron jobs already use `sendNotificationEmail()` which supports the queue!

### Phase 2: Migrate Direct Resend Calls (1-2 hours)
⚠️ **Requires code changes** - Replace direct Resend calls

Only affects:
- Admin summary email in `process-rent-payments`
- Trip invitation emails (non-cron)

### Phase 3: Optimize High-Volume Jobs (Optional)
💡 **Performance improvement** - Better batching for scale

---

## Phase 1: Enable Queue for Existing Code

### Step 1.1: Start the Java Worker

**Local Development:**
```bash
# In .env.local
REDIS_URL=redis://localhost:6380
USE_EMAIL_QUEUE=true
RESEND_API_KEY=re_your_actual_key

# Start services
docker compose up -d
```

**Production:**
```bash
# Deploy to Railway (recommended)
cd java_backend/worker
railway init
railway add redis
railway variables set RESEND_API_KEY=re_your_key
railway up

# Get Redis URL from Railway dashboard
# Add to Vercel environment variables:
REDIS_URL=<redis_url_from_railway>
USE_EMAIL_QUEUE=true
```

### Step 1.2: Verify Worker Health

```bash
# Local
curl http://localhost:8080/health

# Production
curl https://your-worker-url/health

# Should return:
{
  "status": "UP",
  "service": "matchbook-worker",
  "redis": "connected",
  "timestamp": 1699564800000
}
```

### Step 1.3: Enable Queue in Next.js

**Development:**
Already set in `.env.local` above

**Production (Vercel):**
1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Add:
   - `REDIS_URL` = (from Railway)
   - `USE_EMAIL_QUEUE` = `true`
4. Redeploy

### Step 1.4: Test with Preview Cron

Test with the lowest-impact cron job first:

```bash
# Trigger preview-rent-payments cron (sends 1 email)
curl -X POST http://localhost:3000/api/cron/preview-rent-payments \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Verify:**
1. Check worker logs: `docker compose logs worker -f`
2. Check queue stats: `curl http://localhost:8080/health/queue`
3. Verify email received

### Step 1.5: Test High-Volume Cron

Test the high-volume cron job:

```bash
# Trigger check-unread-messages (sends 5-100 emails)
curl -X POST http://localhost:3000/api/cron/check-unread-messages \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Monitor:**
```bash
# Watch queue processing
watch -n 1 'curl -s http://localhost:8080/health/queue | jq'

# You should see:
# - "pending" count increase initially
# - "processing" = 0 or 1 (rate limited)
# - "pending" count decrease at ~2/sec
```

### Step 1.6: Rollout to Production

**Gradual Rollout (Recommended):**

1. **Week 1**: Enable queue for preview cron only
   ```typescript
   // In preview-rent-payments/route.ts
   // Force queue for this cron
   process.env.USE_EMAIL_QUEUE = 'true';
   ```

2. **Week 2**: Enable queue for low-volume crons
   - send-move-in-reminders
   - process-rent-payments (except admin email)
   - retry-failed-rent-payments

3. **Week 3**: Enable queue for high-volume cron
   - check-unread-messages

4. **Week 4**: Set `USE_EMAIL_QUEUE=true` globally

**Instant Rollout (All-at-once):**
Just set `USE_EMAIL_QUEUE=true` in Vercel and redeploy.

### ✅ Phase 1 Complete!

All cron jobs except direct Resend calls now use the queue. You should see:
- 📊 Queue stats showing activity
- 📧 Emails sending at 2/sec max
- 🔄 Automatic retries on failures
- 📝 Clean worker logs

---

## Phase 2: Migrate Direct Resend Calls

### Step 2.1: Migrate Admin Summary Email

**File:** `src/app/api/cron/process-rent-payments/route.ts`

**Current Code (line 735-743):**
```typescript
const { data, error } = await resend.emails.send({
  from: 'MatchBook Rentals <no-reply@matchbookrentals.com>',
  to: ['tyler.bennett52@gmail.com'],
  subject: `Payment Processing Failures - ${failuresByDate.size} dates affected`,
  html: summaryHtml,
});
```

**Replace With:**
```typescript
import { sendNotificationEmail } from '@/lib/send-notification-email';
import { generateEmailTemplateHtml } from '@/lib/email-template-html';

// Build admin email data
const emailHtml = `
  <html>
    <body>
      ${summaryHtml}
    </body>
  </html>
`;

await sendNotificationEmail({
  to: 'tyler.bennett52@gmail.com',
  subject: `Payment Processing Failures - ${failuresByDate.size} dates affected`,
  emailData: {
    companyName: 'MatchBook',
    headerText: 'Payment Processing Report',
    contentTitle: `${failuresByDate.size} dates with failures`,
    contentText: summaryHtml, // Or build proper email data
    buttonText: 'View Dashboard',
    buttonUrl: process.env.NEXT_PUBLIC_BASE_URL + '/admin',
    companyAddress: '123 Main St',
    companyCity: 'San Francisco, CA',
    companyWebsite: 'matchbookrentals.com'
  }
});
```

**Or** (Simpler - Raw HTML):
```typescript
import { emailQueueClient } from '@/lib/email-queue-client';

await emailQueueClient.enqueue({
  to: 'tyler.bennett52@gmail.com',
  subject: `Payment Processing Failures - ${failuresByDate.size} dates affected`,
  html: summaryHtml, // Already HTML, use directly
  metadata: {
    type: 'admin_payment_summary',
    failedDatesCount: String(failuresByDate.size),
  }
});
```

### Step 2.2: Migrate Trip Invitation Emails

**Files:**
- `src/app/api/send/route.ts`
- `src/app/api/emails/invite-to-trip/route.ts`

**Current Pattern:**
```typescript
await resend.emails.send({
  from: 'MatchBook <no-reply@matchbookrentals.com>',
  to: [email],
  subject: subject,
  react: EmailTemplate(emailData),
});
```

**Replace With:**
```typescript
import { sendNotificationEmail } from '@/lib/send-notification-email';

await sendNotificationEmail({
  to: email,
  subject: subject,
  emailData: emailData, // Already in correct format
});
```

### Step 2.3: Test Direct Call Migrations

**Test admin email:**
```bash
# Trigger with failures (or create test failures)
curl -X POST http://localhost:3000/api/cron/process-rent-payments \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Check queue
curl http://localhost:8080/health/queue

# Check logs
docker compose logs worker -f | grep "admin"
```

**Test trip invitation:**
```bash
# Use app to invite someone to a trip
# Or call API directly
curl -X POST http://localhost:3000/api/emails/invite-to-trip \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","tripName":"Test Trip"}'
```

### ✅ Phase 2 Complete!

All emails now go through the queue. No more direct Resend calls!

---

## Phase 3: Optimize High-Volume Jobs (Optional)

### Optimization 1: Parallel Enqueuing

**check-unread-messages** already uses `Promise.all()` for notification creation (good!), but we can optimize further:

**Current (line 280):**
```typescript
await Promise.all(allNotifications.map(n => createNotification(n)));
```

**Optimized (Batch enqueue):**
```typescript
import { emailQueueClient } from '@/lib/email-queue-client';

// Enqueue all emails in parallel
await Promise.all(
  allNotifications.map(async (notification) => {
    const html = generateEmailTemplateHtml(notification.emailData);
    return emailQueueClient.enqueue({
      to: notification.recipientEmail,
      subject: notification.subject,
      html,
      metadata: {
        notificationType: notification.type,
        userId: notification.userId,
      }
    });
  })
);
```

### Optimization 2: Move-In Reminders Parallel Processing

**Current (sequential):**
```typescript
for (const booking of upcomingBookings) {
  await createNotification(...); // One at a time
}
```

**Optimized (parallel):**
```typescript
await Promise.all(
  upcomingBookings.flatMap(booking => [
    createNotification({ /* renter notification */ }),
    createNotification({ /* host notification */ }),
  ])
);
```

### Optimization 3: Rent Payment Parallel Processing

**Current (sequential):**
```typescript
for (const payment of paymentsToProcess) {
  await processPayment(payment);
  await sendNotifications(); // Sequential
}
```

**Optimized (parallel notifications):**
```typescript
for (const payment of paymentsToProcess) {
  await processPayment(payment);

  // Send both notifications in parallel
  await Promise.all([
    createNotification({ /* renter */ }),
    createNotification({ /* host */ }),
  ]);
}
```

---

## Monitoring & Troubleshooting

### Health Check Dashboard

```bash
# Queue stats
curl http://localhost:8080/health/queue | jq

# Response:
{
  "pending": 15,      # Emails waiting
  "processing": 1,    # Currently sending
  "failed": 0,        # Failed attempts
  "dlq": 0,          # Dead letter queue
  "total": 16,
  "timestamp": 1699564800000
}
```

### Expected Queue Behavior

**Normal Operation:**
- `pending`: Varies (0-100+ after cron runs)
- `processing`: 0 or 1 (rate limited to 2/sec)
- `failed`: Low (< 10)
- `dlq`: 0 (should be rare)

**After Cron Run:**
1. `pending` spikes (all emails enqueued at once)
2. `processing` = 1 (worker pops one at a time)
3. `pending` decreases at ~2/sec
4. Queue clears in `pending ÷ 2` seconds

**Example:**
- check-unread-messages runs, enqueues 100 emails
- `pending` = 100
- Worker processes at 2/sec
- Queue clears in ~50 seconds

### Alerts to Set Up

**Critical Alerts:**
1. Worker down: Health check fails
2. Redis disconnected: `"redis": "disconnected"`
3. DLQ growing: `dlq > 10`

**Warning Alerts:**
1. Queue backlog: `pending > 500` for > 5 minutes
2. High failure rate: `failed > 50`

**Info Alerts:**
1. Queue depth after cron: `pending > 100` (normal after check-unread-messages)

### Common Issues

#### Issue: Emails not sending

**Check:**
```bash
# 1. Worker running?
docker compose ps worker

# 2. Redis connected?
curl http://localhost:8080/health

# 3. Queue has jobs?
curl http://localhost:8080/health/queue

# 4. Worker logs?
docker compose logs worker --tail=50
```

**Fix:**
- Worker down: `docker compose up -d`
- Redis disconnected: Check REDIS_URL
- Queue empty but emails missing: Check Next.js logs (enqueue failing?)
- Worker errors: Check RESEND_API_KEY

#### Issue: Queue growing infinitely

**Cause:** Emails failing repeatedly (rate limit, invalid API key, etc.)

**Check:**
```bash
# Check DLQ
curl http://localhost:8080/health/queue

# If dlq > 0, inspect:
docker exec matchbook-redis-worker redis-cli LRANGE matchbook:emails:dlq 0 -1
```

**Fix:**
- Invalid API key: Update RESEND_API_KEY in worker
- Rate limit issues: Worker already handles this, check logs
- Invalid email format: Fix schema validation

#### Issue: Emails delayed

**Expected:** Queue processes at 2 emails/sec = 120 emails/min

**If slower:**
1. Check worker CPU/memory: `docker stats matchbook-worker`
2. Check Redis latency: `redis-cli --latency`
3. Check Resend API response times in worker logs

**If faster (unexpected):**
- You may be running multiple workers (good for scale!)
- Each worker adds 2 emails/sec capacity

---

## Rollback Plan

If issues occur, you can instantly rollback:

### Emergency Rollback (Instant)

**In Vercel:**
```bash
# Set environment variable
USE_EMAIL_QUEUE=false

# Redeploy
vercel --prod
```

All emails immediately go back to direct Resend API.

### Partial Rollback (Specific Cron)

```typescript
// In specific cron file (e.g., process-rent-payments/route.ts)

// Force direct sending for this cron only
const originalQueueSetting = process.env.USE_EMAIL_QUEUE;
process.env.USE_EMAIL_QUEUE = 'false';

// ... cron logic ...

// Restore setting
process.env.USE_EMAIL_QUEUE = originalQueueSetting;
```

### Gradual Rollback

Reverse the gradual rollout:
1. Disable queue for high-volume cron (check-unread-messages)
2. Disable queue for medium-volume crons
3. Disable queue for low-volume crons
4. Set `USE_EMAIL_QUEUE=false` globally

---

## Testing Checklist

Before migrating each cron job, test:

- [ ] Worker is running and healthy
- [ ] Redis is connected
- [ ] Queue stats endpoint responding
- [ ] Test email sends successfully
- [ ] Worker logs show processing
- [ ] Email actually received
- [ ] Rate limiting working (2/sec max)
- [ ] Retries working on failure
- [ ] DLQ captures max retry failures
- [ ] Monitoring dashboards updated

---

## Performance Expectations

### Throughput

**Single Worker:**
- 2 emails/sec
- 120 emails/min
- 7,200 emails/hour
- 172,800 emails/day

**Your Current Volume:**
- 1,500-6,000 emails/day
- **Well within single worker capacity** ✅

### Latency

**From enqueue to delivery:**
- Empty queue: <2 seconds
- 100 emails queued: ~50 seconds (for your email)
- 1000 emails queued: ~8 minutes (for your email)

**Cron job execution time:**
- Before: Limited by email sending (sequential, no rate limit)
- After: Instant (just enqueue, return immediately)

### Cost

**Before (Direct Resend):**
- Serverless invocations + Resend API
- Variable cost scaling with volume

**After (Queue System):**
- Worker: $10/month (Railway/Render)
- Redis: $10/month
- Resend API: Same
- **Total: +$20/month fixed cost**

At 6,000 emails/day, this is **far more cost effective** than serverless at scale.

---

## Next Steps

1. **Deploy worker** (Railway/Render) - See [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Phase 1**: Enable queue for existing code (~30 min)
3. **Phase 2**: Migrate direct Resend calls (~1-2 hours)
4. **Phase 3**: Optimize high-volume jobs (optional)
5. **Set up monitoring**: Uptime checks, alerts
6. **Document runbook**: Team training on queue system

---

## Support

- **Queue contract**: [`/contracts/README.md`](../contracts/README.md)
- **Email queue setup**: [`EMAIL_QUEUE_SETUP.md`](./EMAIL_QUEUE_SETUP.md)
- **Deployment guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Worker README**: [`worker/README.md`](./worker/README.md)

For issues or questions, check worker logs first:
```bash
docker compose logs worker -f
```

Happy migrating! 🚀
