# Email Queue Worker Deployment Guide

This guide covers deploying the Java email worker service for production use.

## Overview

The email worker service processes emails from a Redis queue with:
- **Rate limiting**: 2 emails/second (Resend limit)
- **Automatic retries**: 3 attempts with exponential backoff
- **Dead letter queue**: Failed emails for manual review
- **Health monitoring**: Built-in health checks and metrics

## Architecture

```
┌─────────────┐      ┌─────────┐      ┌──────────────┐      ┌──────────┐
│  Next.js    │─────▶│  Redis  │─────▶│ Java Worker  │─────▶│  Resend  │
│  (Vercel)   │      │ Queue   │      │  (Railway)   │      │   API    │
└─────────────┘      └─────────┘      └──────────────┘      └──────────┘
                          │
                          ▼
                    Queue Stats
                    Health Checks
```

## Option 1: Railway (Recommended)

Railway offers easy deployment with built-in Redis.

### Setup Steps

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create Railway Project**:
   ```bash
   cd java_backend/worker
   railway init
   ```

3. **Add Redis**:
   ```bash
   railway add
   # Select Redis from the list
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set RESEND_API_KEY=re_your_actual_key_here
   railway variables set EMAIL_QUEUE_ENABLED=true

   # Redis connection (auto-configured by Railway)
   # REDIS_HOST, REDIS_PORT, REDIS_PASSWORD are set automatically
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Get Service URL**:
   ```bash
   railway domain
   ```

### Railway Configuration

The worker includes a Dockerfile that Railway will automatically detect and use.

**Estimated Cost**:
- Worker: $5-10/month (Starter plan, 512MB-1GB RAM)
- Redis: $10/month (512MB)
- **Total: ~$15-20/month**

### Update Next.js Environment

In Vercel, add these environment variables:

```bash
REDIS_URL=redis://:<redis_password>@<redis_host>:<redis_port>
USE_EMAIL_QUEUE=true
```

You can get the Redis URL from Railway dashboard.

## Option 2: Render

Render offers Docker-based deployment with a free tier for testing.

### Setup Steps

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Create Redis Instance**:
   - Go to Dashboard → New → Redis
   - Select region (closest to your Next.js deployment)
   - Choose plan (free tier available for testing)
   - Note the Internal Redis URL

3. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - **Settings**:
     - **Name**: `matchbook-worker`
     - **Region**: Same as Redis
     - **Branch**: `main`
     - **Root Directory**: `worker`
     - **Environment**: `Docker`
     - **Plan**: Starter ($7/month) or higher

4. **Environment Variables**:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   REDIS_HOST=<from_redis_internal_url>
   REDIS_PORT=6379
   REDIS_PASSWORD=<from_redis_internal_url>
   REDIS_USE_SSL=true
   EMAIL_QUEUE_ENABLED=true
   ```

5. **Deploy**: Render will auto-deploy on git push

**Estimated Cost**:
- Worker: $7-14/month (Starter plan)
- Redis: $10/month (256MB)
- **Total: ~$17-24/month**

## Option 3: AWS ECS (Enterprise)

For high-scale production deployments.

### Prerequisites
- AWS CLI configured
- ECR repository for Docker image
- ECS cluster
- ElastiCache Redis cluster

### Deploy with Terraform

```hcl
resource "aws_ecs_task_definition" "worker" {
  family                   = "matchbook-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = 512
  memory                  = 1024

  container_definitions = jsonencode([{
    name  = "worker"
    image = "${aws_ecr_repository.worker.repository_url}:latest"

    environment = [
      { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
      { name = "REDIS_PORT", value = "6379" },
      { name = "RESEND_API_KEY", value = var.resend_api_key },
      { name = "EMAIL_QUEUE_ENABLED", value = "true" }
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "wget -q -O /dev/null http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}
```

**Estimated Cost**: $30-100/month depending on scale

## Production Checklist

### Before Deployment

- [ ] Set `RESEND_API_KEY` in worker environment
- [ ] Configure Redis connection (URL, host, port, password)
- [ ] Set `USE_EMAIL_QUEUE=true` in Next.js environment
- [ ] Test email sending in staging environment
- [ ] Set up monitoring alerts

### After Deployment

- [ ] Verify worker health: `GET https://worker-url/health`
- [ ] Check queue stats: `GET https://worker-url/health/queue`
- [ ] Send test email from Next.js
- [ ] Monitor logs for errors
- [ ] Set up Uptime monitoring (UptimeRobot, Checkly, etc.)

## Monitoring

### Health Check Endpoints

- **Basic health**: `GET /health`
  ```json
  {
    "status": "UP",
    "service": "matchbook-worker",
    "redis": "connected",
    "timestamp": 1699564800000
  }
  ```

- **Queue stats**: `GET /health/queue`
  ```json
  {
    "pending": 5,
    "processing": 1,
    "failed": 0,
    "dlq": 0,
    "total": 6
  }
  ```

- **Spring Actuator**: `GET /actuator/health`

### Recommended Monitoring Tools

1. **Uptime Monitoring**:
   - UptimeRobot (free)
   - Checkly
   - Pingdom

2. **Log Aggregation**:
   - Railway: Built-in logs
   - Render: Built-in logs
   - AWS: CloudWatch

3. **Metrics** (Future):
   - Prometheus
   - Grafana
   - Datadog

### Alerts to Configure

- Worker service down (health check fails)
- Redis connection errors
- Dead letter queue growing (DLQ > 10 emails)
- High queue depth (pending > 100 emails)

## Scaling

### Vertical Scaling

Increase worker resources if processing is slow:

**Railway**:
```bash
railway variables set RAILWAY_RAM_GB=2
```

**Render**: Update plan in dashboard

### Horizontal Scaling (Future)

Run multiple worker instances:
- Each worker will compete for jobs from Redis queue
- Redis atomic operations ensure no duplicate processing
- Scale to N workers = 2N emails/second throughput

## Troubleshooting

### Emails not sending

1. **Check worker logs**:
   - Railway: `railway logs`
   - Render: Dashboard → Logs tab

2. **Verify Redis connection**:
   ```bash
   curl https://worker-url/health
   # Check "redis": "connected"
   ```

3. **Check queue stats**:
   ```bash
   curl https://worker-url/health/queue
   # High pending count = worker not processing
   # High DLQ count = systematic failures
   ```

### High DLQ count

Emails in DLQ have exceeded max retries (3 attempts). Common causes:

- Invalid email addresses (400 errors from Resend)
- Invalid RESEND_API_KEY (401 errors)
- Resend account issues

**Investigate DLQ emails**:
```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# View DLQ emails
LRANGE matchbook:emails:dlq 0 -1
```

### Rate limit errors

- Worker automatically handles rate limits
- Check logs for "Rate limit hit" warnings
- If frequent, consider:
  - Upgrading Resend plan (higher rate limits)
  - Implementing batch sending (future enhancement)

## Rollback

If deployment fails:

**Railway**:
```bash
railway rollback
```

**Render**: Dashboard → Rollback to previous deploy

**Fallback to Direct Sending**:

In Next.js environment (Vercel), set:
```bash
USE_EMAIL_QUEUE=false
```

This will send emails directly via Resend until worker is fixed.

## Cost Optimization

### For Low Volume (<100 emails/day)

- Use Render free tier for Redis (testing only)
- Use Railway Hobby plan ($5/month)
- **Total: ~$5-15/month**

### For Medium Volume (100-1000 emails/day)

- Railway: $15-20/month (recommended)
- Render: $17-24/month
- AWS: $30-50/month

### For High Volume (>1000 emails/day)

- Consider AWS ECS with ElastiCache
- Implement batch sending (100 emails per API call)
- Horizontal scaling (multiple workers)

## Next Steps

After successful deployment:

1. **Monitor for 24-48 hours** to ensure stability
2. **Migrate cron job emails** to use queue (rent payments, reminders)
3. **Implement batch sending** for bulk operations
4. **Add Resend webhooks** for delivery tracking
5. **Set up alerting** for DLQ and failures
6. **Document runbooks** for common issues

## Support

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Resend docs: https://resend.com/docs
- Spring Boot docs: https://spring.io/projects/spring-boot
