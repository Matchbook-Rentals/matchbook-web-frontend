# Java Backend Service

This monorepo includes a dedicated Java backend service for operations that don't fit well in Vercel's serverless environment.

## Location

All Java backend code is in the **`java_backend/`** directory.

## Why Java Backend?

Vercel serverless functions have limitations:
- ⏱️ **10-minute timeout** - Can't run long jobs
- 💰 **Per-invocation pricing** - Expensive at scale
- 🚫 **No rate limiting** - Hard to enforce 2 emails/sec (Resend limit)
- ❄️ **Cold starts** - Unpredictable latency

Java backend solves this:
- ✅ **No timeouts** - Run jobs for hours
- ✅ **Fixed cost** - ~$15-20/month regardless of volume
- ✅ **Rate limiting** - Token bucket algorithm enforces limits
- ✅ **Always warm** - Steady-state service, no cold starts
- ✅ **Heavy processing** - Offload expensive calculations

## Current Services

### Email Queue Worker

Processes emails from Redis queue with:
- Rate limiting (2 emails/sec for Resend)
- Automatic retries (3 attempts with exponential backoff)
- Dead letter queue for failed emails
- Health monitoring

**Quick Start**: See [`java_backend/QUICKSTART.md`](./java_backend/QUICKSTART.md)

## Local Development

```bash
# Start Java backend + Redis
docker compose up

# Worker runs on http://localhost:8080
# Redis runs on localhost:6379
```

## Enable Email Queue

Add to `.env.local`:

```bash
REDIS_URL=redis://localhost:6379
USE_EMAIL_QUEUE=true
```

That's it! All your existing `sendNotificationEmail()` calls now use the queue.

## Documentation

- **[java_backend/QUICKSTART.md](./java_backend/QUICKSTART.md)** - 30-second quick start
- **[java_backend/README.md](./java_backend/README.md)** - Full overview
- **[java_backend/EMAIL_QUEUE_SETUP.md](./java_backend/EMAIL_QUEUE_SETUP.md)** - Email queue guide
- **[java_backend/DEPLOYMENT.md](./java_backend/DEPLOYMENT.md)** - Production deployment

## Project Structure

```
matchbook-web-frontend/
├── java_backend/              # Java backend services
│   ├── worker/                # Email queue worker
│   │   ├── src/main/java/     # Java source code
│   │   ├── Dockerfile         # Production image
│   │   ├── pom.xml            # Maven dependencies
│   │   ├── railway.toml       # Railway deployment
│   │   └── render.yaml        # Render deployment
│   ├── README.md              # Overview
│   ├── QUICKSTART.md          # Quick start guide
│   ├── EMAIL_QUEUE_SETUP.md   # Email queue details
│   └── DEPLOYMENT.md          # Production setup
├── src/lib/
│   └── email-queue-client.ts  # Next.js → Java integration
└── docker-compose.yml         # Local dev setup
```

## Production Deployment

**Railway** (recommended):

```bash
cd java_backend/worker
railway init
railway add redis
railway variables set RESEND_API_KEY=re_your_key
railway up
```

**Cost**: ~$15-20/month for worker + Redis

See [`java_backend/DEPLOYMENT.md`](./java_backend/DEPLOYMENT.md) for Render, AWS, and other options.

## Future Services

The Java backend can be extended with:

- **Report Generator**: PDF invoices, statements
- **Analytics Worker**: Heavy data processing
- **Image Processor**: Thumbnail generation
- **File Converter**: CSV exports, imports
- **Scheduled Jobs**: Cron-style background tasks

Add new services in `java_backend/worker/src/main/java/com/matchbook/worker/`.

## Monitoring

### Health Endpoints

- **Basic health**: `GET http://localhost:8080/health`
- **Queue stats**: `GET http://localhost:8080/health/queue`

### Example Response

```json
{
  "status": "UP",
  "service": "matchbook-worker",
  "redis": "connected",
  "timestamp": 1699564800000
}
```

## Toggle On/Off

The system has automatic fallback:

**Queue Mode** (recommended):
```bash
USE_EMAIL_QUEUE=true  # In Next.js .env
```

**Direct Mode** (fallback):
```bash
USE_EMAIL_QUEUE=false  # Falls back to direct Resend API
```

If Redis is unavailable, it automatically falls back to direct sending.

## Tech Stack

- **Java 17** - Modern LTS version
- **Spring Boot 3** - Latest Spring framework
- **Redis** - Queue and cache
- **Maven** - Build tool
- **Docker** - Containerization

## Support

For questions or issues with the Java backend:

1. Check documentation in `java_backend/`
2. Review worker logs: `docker compose logs worker -f`
3. Check health endpoints: `curl http://localhost:8080/health`

## Summary

The Java backend provides a cost-effective, reliable foundation for operations that exceed Vercel's serverless limits. Start with the email queue, then expand to other services as needed.

**Next Steps**:
1. Read [`java_backend/QUICKSTART.md`](./java_backend/QUICKSTART.md)
2. Test locally with `docker compose up`
3. Deploy to production when ready
