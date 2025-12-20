# World-Class Observability for Verification System

## Scope: Moderate (Structured Logging + Health Check + Basic Metrics)

**Hosting:** Vercel (will use Vercel Logs)
**Error Tracking:** None for now (console + database)
**Alerting:** Email only

---

## Implementation Plan

### 1. Structured JSON Logging (Replace console.log)

**Goal:** Make logs queryable in Vercel Logs with consistent structure.

**Install pino:**
```bash
npm install pino pino-pretty
```

**Create `src/lib/observability/logger.ts`:**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Pretty print in dev, JSON in prod
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

// Typed logging functions for verification flow
export const verificationLogger = {
  creditCheckStarted: (data: { verificationId: string; userId: string }) =>
    logger.info({ event: 'credit_check_started', ...data }),

  creditCheckCompleted: (data: { verificationId: string; userId: string; creditBucket: string; durationMs: number }) =>
    logger.info({ event: 'credit_check_completed', ...data }),

  creditCheckFailed: (data: { verificationId: string; userId: string; errorType: string; durationMs: number }) =>
    logger.error({ event: 'credit_check_failed', ...data }),

  backgroundCheckStarted: (data: { verificationId: string; userId: string; orderId?: string }) =>
    logger.info({ event: 'background_check_started', ...data }),

  backgroundCheckWebhookReceived: (data: { orderId: string; resultType: string; durationMs: number }) =>
    logger.info({ event: 'background_check_webhook_received', ...data }),

  paymentCaptured: (data: { verificationId: string; userId: string; amount: number }) =>
    logger.info({ event: 'payment_captured', ...data }),

  paymentFailed: (data: { verificationId: string; userId: string; error: string }) =>
    logger.error({ event: 'payment_failed', ...data }),
};

export default logger;
```

**Files to update (replace console.log with structured logging):**

| File | Changes |
|------|---------|
| `src/lib/verification/credit-check.ts` | Replace 20+ console.logs with verificationLogger calls |
| `src/lib/verification/background-check.ts` | Replace console.logs with verificationLogger calls |
| `src/app/api/background-check-webhook/route.ts` | Replace console.logs with verificationLogger calls |
| `src/app/api/verification/run/route.ts` | Replace console.logs with verificationLogger calls |
| `src/app/api/verification/capture-payment/route.ts` | Replace console.logs with verificationLogger calls |
| `src/app/api/verification/refund/route.ts` | Replace console.logs with verificationLogger calls |

**Keep existing console.log separators in dev mode only:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log("=".repeat(60));
  console.log("CREDIT CHECK STARTED");
  console.log("=".repeat(60));
}
verificationLogger.creditCheckStarted({ verificationId, userId });
```

---

### 2. Health Check Endpoint

**Create `src/app/api/health/route.ts`:**
```typescript
import prisma from "@/lib/prismadb";

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.status = 'unhealthy';
    checks.database = 'disconnected';
  }

  return Response.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503
  });
}
```

**Use for:** Uptime monitoring (UptimeRobot, Better Uptime, etc.)

---

### 3. Basic Metrics Tracking

**Create `src/lib/observability/metrics.ts`:**

Track key events in database for later analysis:

```typescript
import prisma from "@/lib/prismadb";

export async function trackMetric(
  name: string,
  value: number = 1,
  tags: Record<string, string> = {}
) {
  // Store in database for simple analytics
  // Can query later: SELECT name, COUNT(*) FROM Metric WHERE createdAt > NOW() - INTERVAL 1 DAY GROUP BY name
  await prisma.metric.create({
    data: {
      name,
      value,
      tags: JSON.stringify(tags),
    },
  }).catch(() => {}); // Non-blocking, ignore failures
}

// Convenience functions
export const metrics = {
  verificationStarted: () => trackMetric('verification_started'),
  creditCheckCompleted: (bucket: string, durationMs: number) =>
    trackMetric('credit_check_completed', durationMs, { bucket }),
  creditCheckFailed: (errorType: string) =>
    trackMetric('credit_check_failed', 1, { errorType }),
  backgroundCheckCompleted: (result: string) =>
    trackMetric('background_check_completed', 1, { result }),
  paymentCaptured: (amount: number) =>
    trackMetric('payment_captured', amount),
  paymentFailed: (errorType: string) =>
    trackMetric('payment_failed', 1, { errorType }),
};
```

**Add Prisma model:**
```prisma
model Metric {
  id        String   @id @default(cuid())
  name      String
  value     Float
  tags      String?  // JSON string
  createdAt DateTime @default(now())

  @@index([name, createdAt])
}
```

---

### 4. Simple Metrics Dashboard Query

**Create `src/app/api/dev/metrics/route.ts`:**
```typescript
// Returns last 24h metrics summary
// GET /api/dev/metrics
export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const summary = await prisma.$queryRaw`
    SELECT
      name,
      COUNT(*) as count,
      AVG(value) as avg_value,
      MAX(value) as max_value
    FROM Metric
    WHERE createdAt > ${since}
    GROUP BY name
  `;

  return Response.json({ since, summary });
}
```

---

## Implementation Order

1. **Create logger** (`src/lib/observability/logger.ts`)
2. **Create health endpoint** (`src/app/api/health/route.ts`)
3. **Add Metric model** to Prisma schema
4. **Create metrics module** (`src/lib/observability/metrics.ts`)
5. **Update credit-check.ts** - Replace console.logs, add metrics
6. **Update background-check.ts** - Replace console.logs, add metrics
7. **Update background-check-webhook/route.ts** - Replace console.logs, add metrics
8. **Update verification/run/route.ts** - Replace console.logs, add metrics
9. **Update payment routes** - Replace console.logs, add metrics
10. **Create metrics dashboard endpoint** (`src/app/api/dev/metrics/route.ts`)

---

## Files Summary

### New Files
- `src/lib/observability/logger.ts`
- `src/lib/observability/metrics.ts`
- `src/app/api/health/route.ts`
- `src/app/api/dev/metrics/route.ts`

### Modified Files
- `prisma/schema.prisma` (add Metric model)
- `src/lib/verification/credit-check.ts`
- `src/lib/verification/background-check.ts`
- `src/app/api/background-check-webhook/route.ts`
- `src/app/api/verification/run/route.ts`
- `src/app/api/verification/capture-payment/route.ts`
- `src/app/api/verification/refund/route.ts`
- `src/app/api/verification/cancel-payment/route.ts`

---

## What This Gives You

1. **Queryable logs in Vercel** - Search by event type, verificationId, userId
2. **Uptime monitoring** - `/api/health` for external monitors
3. **Basic analytics** - Track success/failure rates, latency
4. **Dev dashboard** - Quick view of last 24h metrics
5. **Keep dev experience** - Pretty logs still work locally
