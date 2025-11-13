# Java Backend - Quick Start

## 30-Second Start

```bash
# From project root
docker compose up

# Worker: http://localhost:8080
# Redis: localhost:6379
```

## What's Running?

- **Email Queue Worker**: Processes emails at 2/sec with auto-retry
- **Redis**: Queue storage and cache

## Health Check

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/queue
```

## Enable in Next.js

Add to `.env.local`:

```bash
REDIS_URL=redis://localhost:6379
USE_EMAIL_QUEUE=true
RESEND_API_KEY=re_your_key_here
```

Restart Next.js. All emails now route through the queue!

## Documentation

- **[README.md](./README.md)** - Overview and architecture
- **[EMAIL_QUEUE_SETUP.md](./EMAIL_QUEUE_SETUP.md)** - Detailed email queue guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[worker/README.md](./worker/README.md)** - Worker service details

## Production Deploy (Railway)

```bash
cd java_backend/worker
railway init
railway add redis
railway variables set RESEND_API_KEY=re_your_key
railway up
```

**Cost**: ~$15-20/month

## Need Help?

Check the docs above or review the code in `worker/src/main/java/`.
