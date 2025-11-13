# MatchBook Email Worker Service

Java Spring Boot service for processing email queue with rate limiting and background job processing.

## Features

- **Email Queue Processing**: Processes emails from Redis queue with 2 emails/sec rate limiting (Resend limit)
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Dead Letter Queue**: Failed emails moved to DLQ after max retries
- **Health Monitoring**: Health check and queue statistics endpoints
- **Stuck Email Recovery**: Automatic recovery of stuck emails in processing queue

## Architecture

```
Next.js App → Redis Queue → Java Worker → Resend API
                ↓
          Queue Stats/Health
```

## Local Development

### Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- Resend API key

### Setup

1. **Set environment variables**:
   ```bash
   # In project root .env.local
   REDIS_URL=redis://localhost:6379
   RESEND_API_KEY=your_resend_api_key
   USE_EMAIL_QUEUE=true
   ```

2. **Start services with Docker Compose**:
   ```bash
   # From project root
   docker compose up
   ```

   This starts:
   - Redis on port 6379
   - Java worker on port 8080

3. **Or run worker locally (for development)**:
   ```bash
   cd worker
   mvn spring-boot:run
   ```

### Testing

Send a test email from Next.js:

```typescript
import { emailQueueClient } from '@/lib/email-queue-client';

await emailQueueClient.enqueue({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World</h1>',
});
```

### Monitoring

- **Health check**: `GET http://localhost:8080/health`
- **Queue stats**: `GET http://localhost:8080/health/queue`
- **Spring Actuator**: `GET http://localhost:8080/actuator/health`

Queue stats response:
```json
{
  "pending": 5,
  "processing": 1,
  "failed": 0,
  "dlq": 0,
  "total": 6,
  "timestamp": 1699564800000
}
```

## Production Deployment

### Railway

1. **Create Railway project**:
   ```bash
   railway init
   ```

2. **Add Redis**:
   ```bash
   railway add redis
   ```

3. **Set environment variables**:
   ```bash
   railway variables set RESEND_API_KEY=your_key
   railway variables set EMAIL_QUEUE_ENABLED=true
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### Render

1. **Create new Web Service**
2. **Select Docker environment**
3. **Set environment variables**:
   - `RESEND_API_KEY`
   - `REDIS_HOST` (from Render Redis instance)
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
   - `REDIS_USE_SSL=true`
4. **Deploy from GitHub**

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | Resend API key | Yes | - |
| `REDIS_HOST` | Redis hostname | Yes | `localhost` |
| `REDIS_PORT` | Redis port | No | `6379` |
| `REDIS_PASSWORD` | Redis password | No | - |
| `REDIS_USE_SSL` | Use SSL for Redis | No | `false` |
| `EMAIL_QUEUE_ENABLED` | Enable email queue consumer | No | `true` |
| `PORT` | Server port | No | `8080` |

## Queue Management

### Redis Keys

- `matchbook:emails:pending` - Pending emails
- `matchbook:emails:processing` - Currently processing
- `matchbook:emails:failed` - Failed attempts (for tracking)
- `matchbook:emails:dlq` - Dead letter queue (max retries exceeded)

### Retry Policy

- **Max attempts**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Rate limit**: 2 emails/second
- **Stuck email recovery**: Every 5 minutes

### Manual Queue Operations

Using Redis CLI:

```bash
# Check queue sizes
redis-cli LLEN matchbook:emails:pending
redis-cli LLEN matchbook:emails:processing
redis-cli LLEN matchbook:emails:dlq

# View pending emails
redis-cli LRANGE matchbook:emails:pending 0 -1

# Clear DLQ (after investigating)
redis-cli DEL matchbook:emails:dlq

# Re-queue DLQ emails
redis-cli RPOPLPUSH matchbook:emails:dlq matchbook:emails:pending
```

## Troubleshooting

### Emails not being sent

1. Check worker logs: `docker compose logs worker`
2. Check queue stats: `curl http://localhost:8080/health/queue`
3. Verify Redis connection: `curl http://localhost:8080/health`
4. Check RESEND_API_KEY is set correctly

### Rate limit errors

- Worker automatically handles Resend rate limits (2/sec)
- Failed emails are retried with exponential backoff
- Check logs for "Rate limit hit" warnings

### Stuck emails in processing queue

- Automatic recovery runs every 5 minutes
- Manual recovery: restart worker service

## Future Enhancements

- [ ] Add Resend batch API support (100 emails per request)
- [ ] Email delivery webhooks tracking
- [ ] Admin dashboard for queue management
- [ ] Heavy calculation workers
- [ ] Scheduled job processing
- [ ] Email template validation
- [ ] Prometheus metrics export
