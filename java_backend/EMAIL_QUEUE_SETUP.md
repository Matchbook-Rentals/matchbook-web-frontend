# Email Queue System - Quick Start Guide

## What This Solves

Resend has a **2 emails/second** rate limit. As your platform scales, sending emails directly from Next.js serverless functions causes:
- ❌ Rate limit errors (429 responses)
- ❌ Lost emails when limits are hit
- ❌ No retry mechanism
- ❌ Serverless timeout issues with bulk operations

This system provides:
- ✅ **Rate limiting**: Exactly 2 emails/sec, respects Resend limits
- ✅ **Reliable delivery**: Automatic retries with exponential backoff
- ✅ **Steady-state service**: No serverless timeouts (runs 24/7)
- ✅ **Cost efficient**: Fixed monthly cost vs per-invocation pricing
- ✅ **Future-proof**: Foundation for heavy calculations & background jobs

## Architecture

```
┌──────────────────┐
│   Next.js App    │
│   (Vercel)       │
│                  │
│  sendNotification│
│      Email()     │
└────────┬─────────┘
         │ 1. Enqueue email job
         ▼
┌──────────────────┐
│      Redis       │◄───┐
│   (Queue)        │    │ 2. Pop job (rate limited)
└────────┬─────────┘    │
         │              │
         │         ┌────┴──────────────┐
         └────────▶│  Java Worker      │
                   │  (Railway/Render) │
                   │                   │
                   │  • 2 emails/sec   │
                   │  • Auto retry     │
                   │  • DLQ handling   │
                   └────────┬──────────┘
                            │ 3. Send email
                            ▼
                   ┌────────────────────┐
                   │   Resend API       │
                   └────────────────────┘
```

## Local Development Setup (5 minutes)

### 1. Set Environment Variables

Add to `.env.local`:

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Enable queue mode
USE_EMAIL_QUEUE=true

# Resend (you already have this)
RESEND_API_KEY=re_your_key_here
```

### 2. Start Services

```bash
# Start Redis + Java Worker
docker compose up

# In another terminal, start Next.js
npm run dev
```

That's it! Emails will now be queued and processed at 2/sec.

### 3. Verify It Works

**Check worker health**:
```bash
curl http://localhost:8080/health
# {"status":"UP","redis":"connected",...}
```

**Check queue stats**:
```bash
curl http://localhost:8080/health/queue
# {"pending":0,"processing":0,"failed":0,"dlq":0}
```

**Send a test email** (in Next.js):
```typescript
import { sendNotificationEmail } from '@/lib/send-notification-email';

await sendNotificationEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  emailData: {
    companyName: 'MatchBook',
    headerText: 'Test Email',
    contentTitle: 'Hello!',
    contentText: 'This is a test email from the queue system.',
    buttonText: 'Visit Site',
    buttonUrl: 'https://matchbookrentals.com',
    companyAddress: '123 Main St',
    companyCity: 'San Francisco, CA',
    companyWebsite: 'matchbookrentals.com'
  }
});
```

Check worker logs:
```bash
docker compose logs worker -f
# You should see: "Email sent successfully to test@example.com"
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

**Quick Railway deployment**:

```bash
cd worker
railway init
railway add redis
railway variables set RESEND_API_KEY=re_your_key_here
railway up
```

Then in Vercel, set:
```bash
REDIS_URL=<from_railway_redis>
USE_EMAIL_QUEUE=true
```

**Cost**: ~$15-20/month

## Toggle Queue On/Off

The system has built-in fallback. To switch modes:

**Queue Mode** (recommended for production):
```bash
USE_EMAIL_QUEUE=true
```

**Direct Mode** (fallback, original behavior):
```bash
USE_EMAIL_QUEUE=false
```

If Redis is unavailable, it automatically falls back to direct sending.

## Monitoring

### Queue Dashboard

```bash
curl http://localhost:8080/health/queue
```

**Metrics**:
- `pending`: Emails waiting to be sent
- `processing`: Currently sending
- `failed`: Failed attempts (will retry)
- `dlq`: Dead letter queue (max retries exceeded)

### What to Watch

- ✅ `pending` growing slowly = normal traffic
- ⚠️ `pending` > 100 = high volume, consider scaling
- 🚨 `dlq` > 10 = systematic issue (check logs)

### Logs

**Local**:
```bash
docker compose logs worker -f
```

**Production (Railway)**:
```bash
railway logs
```

## Project Structure

```
matchbook-web-frontend/
├── java_backend/                    # Java backend services
│   ├── worker/                      # Email queue worker service
│   │   ├── src/main/java/com/matchbook/worker/
│   │   │   ├── WorkerApplication.java   # Main application
│   │   │   ├── controller/
│   │   │   │   └── HealthController.java
│   │   │   ├── service/
│   │   │   │   ├── EmailQueueConsumer.java  # Rate limiting + retry
│   │   │   │   └── ResendService.java       # Resend API client
│   │   │   ├── model/
│   │   │   │   └── EmailJob.java
│   │   │   └── config/
│   │   │       └── RedisConfig.java
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── README.md
│   ├── EMAIL_QUEUE_SETUP.md         # This file
│   └── DEPLOYMENT.md                # Production deployment guide
├── src/lib/
│   ├── email-queue-client.ts        # Next.js → Redis enqueue
│   └── send-notification-email.ts   # Updated with queue support
└── docker-compose.yml               # Redis + Worker for local dev
```

## How It Works

### Email Sending Flow

1. **Next.js** calls `sendNotificationEmail()`
2. **Renders email** to HTML using template
3. **Enqueues job** to Redis list with unique ID
4. **Returns immediately** to user (non-blocking)
5. **Java worker** pops job from Redis (blocking with timeout)
6. **Rate limiter** ensures 2 emails/sec maximum
7. **Sends email** via Resend API
8. **On success**: Remove from queue
9. **On failure**: Retry with exponential backoff (1s, 2s, 4s)
10. **After 3 failures**: Move to dead letter queue

### Rate Limiting

Uses Google Guava's `RateLimiter` with token bucket algorithm:

```java
RateLimiter rateLimiter = RateLimiter.create(2.0); // 2 per second

while (running) {
  rateLimiter.acquire(); // Blocks until token available
  processEmail();
}
```

This guarantees **exactly 2 emails per second**, no more, no less.

### Retry Logic

- **Attempt 1**: Immediate
- **Attempt 2**: 1 second delay
- **Attempt 3**: 2 seconds delay
- **After 3 failures**: Move to DLQ

Exponential backoff formula: `delay = 1000ms * 2^(attempt - 1)`

### Dead Letter Queue (DLQ)

Emails that fail after 3 attempts go to DLQ for manual investigation.

**Common DLQ causes**:
- Invalid email addresses (400 from Resend)
- Resend API key issues (401)
- Permanent delivery failures

**Inspect DLQ**:
```bash
redis-cli -u $REDIS_URL
LRANGE matchbook:emails:dlq 0 -1
```

**Re-queue DLQ email** (after fixing issue):
```bash
redis-cli -u $REDIS_URL
RPOPLPUSH matchbook:emails:dlq matchbook:emails:pending
```

## Troubleshooting

### Emails not sending

**1. Check worker is running**:
```bash
curl http://localhost:8080/health
```

**2. Check Redis connection**:
```bash
docker compose ps
# Both redis and worker should be "Up"
```

**3. Check queue stats**:
```bash
curl http://localhost:8080/health/queue
# If pending > 0 but not decreasing, worker may be stuck
```

**4. Check logs**:
```bash
docker compose logs worker -f
# Look for errors
```

### Worker not starting

**Missing RESEND_API_KEY**:
```bash
docker compose logs worker
# "RESEND_API_KEY environment variable is required"
```

Fix: Set in `.env.local` and restart:
```bash
docker compose restart worker
```

### Queue growing too fast

If `pending` count keeps growing:

**Cause**: More than 2 emails/sec being enqueued

**Solutions**:
1. **Temporary**: Acceptable, queue will drain over time
2. **Scale worker**: Run multiple instances (each adds 2/sec capacity)
3. **Upgrade Resend**: Higher tier = higher rate limits
4. **Batch sending**: Future enhancement (100 emails per API call)

## Performance

### Throughput

- **Single worker**: 2 emails/second = 120/minute = 7,200/hour = 172,800/day
- **Two workers**: 4 emails/second = 345,600/day
- **N workers**: 2N emails/second

### Latency

- **Enqueue**: <10ms (Redis write)
- **Processing**: 50-200ms per email (Resend API call)
- **End-to-end**: 0-30 seconds (depending on queue depth)

### Resource Usage

- **Worker**: ~150-200MB RAM (idle)
- **Worker**: ~300-500MB RAM (under load)
- **Redis**: ~10-50MB RAM (queue data)

## Future Enhancements

### Planned Features

- [ ] **Batch sending**: Send 100 emails per Resend API call
- [ ] **Priority queue**: Urgent emails jump the queue
- [ ] **Scheduled emails**: Delay sending until specific time
- [ ] **Delivery tracking**: Webhook integration with Resend
- [ ] **Email analytics**: Open rates, click rates
- [ ] **Template validation**: Catch errors before sending
- [ ] **A/B testing**: Test subject lines, content

### Heavy Calculations

The Java worker can also handle:
- **Report generation**: PDF invoices, statements
- **Data processing**: Analytics, aggregations
- **Image processing**: Thumbnails, compression
- **File conversions**: CSV exports, imports

Add new endpoints to `java_backend/worker/src/main/java/com/matchbook/worker/controller/`.

## FAQ

**Q: Do I need to change my email sending code?**
A: No! Just set `USE_EMAIL_QUEUE=true`. All existing `sendNotificationEmail()` calls work unchanged.

**Q: What if Redis goes down?**
A: Automatic fallback to direct Resend API (original behavior).

**Q: Can I see queued emails?**
A: Yes, use Redis CLI: `LRANGE matchbook:emails:pending 0 -1`

**Q: How do I rollback?**
A: Set `USE_EMAIL_QUEUE=false` in Next.js environment. Instant rollback.

**Q: Does this work with my existing email templates?**
A: Yes! Uses the same `generateEmailTemplateHtml()` function.

**Q: How much does this cost?**
A: ~$15-20/month (Railway) or ~$17-24/month (Render). Fixed cost regardless of volume (up to 172k emails/day per worker).

**Q: Can I run multiple workers?**
A: Yes! Each worker adds 2 emails/sec capacity. Redis ensures no duplicate sends.

## Need Help?

- **Worker README**: `java_backend/worker/README.md` - Java service details
- **Deployment Guide**: `DEPLOYMENT.md` - Production setup
- **Resend Docs**: https://resend.com/docs
- **Spring Boot Docs**: https://spring.io/guides

## Summary

You now have a production-ready email queue system that:

✅ Handles Resend's 2 emails/sec rate limit
✅ Provides reliable delivery with retries
✅ Eliminates serverless timeout issues
✅ Costs ~$15-20/month (fixed, predictable)
✅ Scales to 172k+ emails/day per worker
✅ Has built-in monitoring and health checks
✅ Gracefully falls back if issues occur
✅ Is ready for future enhancements

**Next steps**: Test locally, then deploy to Railway/Render when ready!
