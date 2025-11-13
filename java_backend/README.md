# MatchBook Java Backend

Dedicated Java backend service for handling rate-limited operations and heavy processing tasks that don't fit well in Vercel's serverless environment.

## Purpose

This backend solves limitations of serverless architecture:

- **Rate limiting**: Resend API has 2 emails/sec limit - this service enforces that properly
- **No timeouts**: Vercel has 10-minute max - this can run hours-long jobs
- **Cost optimization**: Fixed monthly cost vs per-invocation pricing
- **Heavy calculations**: Offload expensive operations from Next.js
- **Background jobs**: True async processing with queues and workers

## Current Features

### ✅ Email Queue Worker

Processes emails from Redis queue with:
- Rate limiting (2 emails/sec)
- Automatic retries with exponential backoff
- Dead letter queue for failed emails
- Health monitoring and queue statistics

**See**: [`worker/README.md`](./worker/README.md) for technical details

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MatchBook Monorepo                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐            ┌──────────────────┐           │
│  │   Next.js   │            │  Java Backend    │           │
│  │  (Vercel)   │            │  (Railway/Render)│           │
│  │             │            │                  │           │
│  │  - Web UI   │───Redis───▶│  - Email Queue  │───────────┼──▶ Resend
│  │  - APIs     │            │  - Heavy Calc   │           │
│  │  - SSR      │            │  - Background   │           │
│  └─────────────┘            │    Jobs         │           │
│                             └──────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Local Development

```bash
# From project root
docker compose up

# Worker runs on http://localhost:8080
# Redis runs on localhost:6379
```

### Test Email Queue

```bash
# Check worker health
curl http://localhost:8080/health

# Check queue stats
curl http://localhost:8080/health/queue
```

### Production Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full guide.

**Quick Railway deployment**:

```bash
cd java_backend/worker
railway init
railway add redis
railway variables set RESEND_API_KEY=re_your_key
railway up
```

## Project Structure

```
java_backend/
├── worker/                       # Email queue worker service
│   ├── src/main/java/
│   │   └── com/matchbook/worker/
│   │       ├── WorkerApplication.java
│   │       ├── controller/
│   │       │   └── HealthController.java
│   │       ├── service/
│   │       │   ├── EmailQueueConsumer.java
│   │       │   └── ResendService.java
│   │       ├── model/
│   │       │   └── EmailJob.java
│   │       └── config/
│   │           └── RedisConfig.java
│   ├── Dockerfile
│   ├── pom.xml
│   ├── railway.toml
│   └── render.yaml
├── EMAIL_QUEUE_SETUP.md         # Email queue quick start
├── DEPLOYMENT.md                # Production deployment guide
└── README.md                    # This file
```

## Environment Variables

### Required

```bash
RESEND_API_KEY=re_your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Optional

```bash
REDIS_PASSWORD=                  # For production Redis
REDIS_USE_SSL=false              # Set to true in production
EMAIL_QUEUE_ENABLED=true         # Toggle queue consumer
PORT=8080                        # Server port
```

## Next.js Integration

The Next.js app integrates via Redis queue:

```typescript
// src/lib/email-queue-client.ts
import { emailQueueClient } from '@/lib/email-queue-client';

// Enqueue email (non-blocking)
await emailQueueClient.enqueue({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello</h1>'
});
```

Existing `sendNotificationEmail()` calls automatically use the queue when:

```bash
USE_EMAIL_QUEUE=true  # In Next.js .env.local
```

## Monitoring

### Health Endpoints

- **Basic health**: `GET /health`
- **Queue statistics**: `GET /health/queue`
- **Spring Actuator**: `GET /actuator/health`

### Queue Stats Response

```json
{
  "pending": 5,      // Waiting to be sent
  "processing": 1,   // Currently sending
  "failed": 0,       // Failed attempts
  "dlq": 0,          // Dead letter queue
  "total": 6,
  "timestamp": 1699564800000
}
```

### Logs

**Local**:
```bash
docker compose logs worker -f
```

**Production (Railway)**:
```bash
railway logs
```

## Future Services

This backend is designed to grow with additional services:

### Planned

- [ ] **Report Generator**: PDF invoices, lease documents, statements
- [ ] **Analytics Worker**: Heavy data aggregations, metrics
- [ ] **Image Processor**: Thumbnail generation, compression
- [ ] **File Converter**: CSV exports, document conversions
- [ ] **Scheduled Jobs**: Cron-style background tasks
- [ ] **Webhook Processor**: Handle third-party webhooks

### Adding New Services

1. Create new package: `src/main/java/com/matchbook/worker/newservice/`
2. Add controller with endpoints
3. Add to Spring Boot component scan
4. Document in this README

## Tech Stack

- **Java 17**: Modern LTS Java version
- **Spring Boot 3**: Latest Spring framework
- **Maven**: Build tool and dependency management
- **Redis**: Queue and cache (via Lettuce client)
- **Docker**: Containerization
- **Guava**: Rate limiting utilities

## Cost Estimate

### Railway (Recommended)

- Worker service: $5-10/month
- Redis: $10/month
- **Total: ~$15-20/month**

### Render

- Worker service: $7-14/month
- Redis: $10/month
- **Total: ~$17-24/month**

### AWS (Enterprise)

- ECS Fargate: $20-40/month
- ElastiCache: $15-30/month
- **Total: ~$35-70/month**

## Performance

- **Email throughput**: 2 emails/sec = 172,800 emails/day per worker
- **Memory usage**: ~200-500MB RAM
- **Startup time**: ~30-40 seconds (Spring Boot)
- **Latency**: <200ms per email (Resend API call)

## Development

### Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- Resend API key

### Build

```bash
cd java_backend/worker
mvn clean package
```

### Run Locally (without Docker)

```bash
# Terminal 1: Start Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: Start worker
cd java_backend/worker
export RESEND_API_KEY=re_your_key
export REDIS_HOST=localhost
mvn spring-boot:run
```

### Tests (Future)

```bash
mvn test
```

## Documentation

- **[EMAIL_QUEUE_SETUP.md](./EMAIL_QUEUE_SETUP.md)**: Email queue quick start guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Production deployment instructions
- **[worker/README.md](./worker/README.md)**: Worker service technical details

## Troubleshooting

### Worker won't start

Check environment variables:
```bash
docker compose logs worker
# Look for "RESEND_API_KEY environment variable is required"
```

### Emails not sending

1. Check health: `curl http://localhost:8080/health`
2. Check queue: `curl http://localhost:8080/health/queue`
3. Check logs: `docker compose logs worker -f`

### Redis connection errors

Verify Redis is running:
```bash
docker compose ps redis
# Should show "Up"

redis-cli ping
# Should return "PONG"
```

## Contributing

When adding new features:

1. **Create feature branch**: `git checkout -b feature/new-service`
2. **Add service code**: In `worker/src/main/java/`
3. **Add tests**: In `worker/src/test/java/`
4. **Update docs**: Document in README
5. **Test locally**: `docker compose up`
6. **Submit PR**: With clear description

## Support

- **Spring Boot**: https://spring.io/projects/spring-boot
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Redis**: https://redis.io/docs

## License

Same as parent MatchBook project.

---

**Need Help?** Check the documentation or review the worker source code in `worker/src/main/java/`.
