# Railway Deployment Guide - Step by Step

Complete guide for deploying the Java email worker to Railway from scratch.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account (for connecting repository)
- Resend API key (from https://resend.com/api-keys)
- Command line access

---

## Part 1: Railway Setup (5 minutes)

### Step 1: Install Railway CLI

**macOS:**
```bash
brew install railway
```

**Linux/WSL:**
```bash
npm install -g @railway/cli
# or
curl -fsSL https://railway.app/install.sh | sh
```

**Windows:**
```bash
npm install -g @railway/cli
```

**Verify installation:**
```bash
railway version
# Should show: railway version X.X.X
```

### Step 2: Login to Railway

```bash
railway login
```

This opens your browser for authentication. Click "Authorize" to connect your GitHub account.

**Verify login:**
```bash
railway whoami
# Should show your Railway username
```

---

## Part 2: Create Railway Project (10 minutes)

### Step 3: Navigate to Worker Directory

```bash
cd /path/to/matchbook-web-frontend/java_backend/worker
```

### Step 4: Initialize Railway Project

```bash
railway init
```

**You'll be prompted:**

```
✔ Enter project name: matchbook-email-worker
✔ Create a new project or select existing?: Create new project
✔ Environment: production
```

**What this does:**
- Creates a new Railway project
- Links your local directory to the project
- Creates `.railway` directory (already gitignored)

### Step 5: Add Redis Database

```bash
railway add
```

**Select from the menu:**
```
? Select a service
❯ Redis
  PostgreSQL
  MySQL
  MongoDB
```

**Choose Redis, then:**
```
✔ Enter service name: matchbook-redis
✔ Redis version: 7
```

**What you get:**
- Redis instance (100MB free tier included)
- Automatically configured `REDIS_URL` environment variable
- Accessible only within Railway's private network

### Step 6: Set Environment Variables

```bash
# Set Resend API key
railway variables set RESEND_API_KEY=re_your_actual_api_key_here

# Enable email queue (default is true, but being explicit)
railway variables set EMAIL_QUEUE_ENABLED=true
```

**Verify variables:**
```bash
railway variables
```

You should see:
```
RESEND_API_KEY: re_xxxxx
EMAIL_QUEUE_ENABLED: true
REDIS_HOST: (auto-configured by Railway)
REDIS_PORT: (auto-configured by Railway)
REDIS_PASSWORD: (auto-configured by Railway)
```

---

## Part 3: Deploy (15 minutes)

### Step 7: Deploy Worker

```bash
railway up
```

**What happens:**
1. Railway detects `railway.toml` configuration
2. Builds Docker image using your Dockerfile
3. Provisions 512MB RAM / 0.5 vCPU (from railway.toml)
4. Deploys to Railway's infrastructure
5. Starts health checks on `/health` endpoint

**Build output:**
```
Building...
Step 1/17 : FROM maven:3.9-eclipse-temurin-17 AS builder
Step 2/17 : WORKDIR /app
...
Step 17/17 : ENTRYPOINT ["java", ...]
Successfully built abc123def456
Deploying...
Deployment successful!
```

**First deployment takes ~5-10 minutes** (Maven downloads dependencies, Spring Boot starts)

### Step 8: Check Deployment Status

```bash
railway status
```

**Healthy deployment shows:**
```
Service: matchbook-email-worker
Status: ✓ Running
Memory: 312MB / 512MB
CPU: 12%
Restarts: 0
```

### Step 9: Get Service URL

```bash
railway domain
```

**If no domain exists:**
```
? No domain found. Generate one? (Y/n) Y
Generated domain: matchbook-email-worker-production.up.railway.app
```

**Save this URL** - you'll need it for Next.js configuration.

### Step 10: Verify Worker Health

```bash
# Test health endpoint
curl https://matchbook-email-worker-production.up.railway.app/health

# Expected response:
{
  "status": "UP",
  "service": "matchbook-worker",
  "redis": "connected",
  "timestamp": 1699564800000
}
```

**If you see `"redis": "connected"` - you're good!** ✅

### Step 11: Check Queue Stats

```bash
curl https://matchbook-email-worker-production.up.railway.app/health/queue

# Expected response:
{
  "pending": 0,
  "processing": 0,
  "failed": 0,
  "dlq": 0,
  "total": 0,
  "timestamp": 1699564850000
}
```

---

## Part 4: Next.js Integration (10 minutes)

### Step 12: Get Redis Connection String

**In Railway dashboard:**
1. Go to https://railway.app/dashboard
2. Click your project "matchbook-email-worker"
3. Click "matchbook-redis" service
4. Click "Connect" tab
5. Copy the **Public Redis URL**

Should look like:
```
redis://default:password@roundhouse.proxy.rlwy.net:12345
```

**Or via CLI:**
```bash
railway variables --service matchbook-redis
# Look for REDIS_URL in the output
```

### Step 13: Configure Next.js (Vercel)

**In Vercel Dashboard:**
1. Go to your Next.js project
2. Settings → Environment Variables
3. Add the following:

```bash
# Name: REDIS_URL
# Value: redis://default:password@roundhouse.proxy.rlwy.net:12345
# Environment: Production, Preview, Development

# Name: USE_EMAIL_QUEUE
# Value: true
# Environment: Production, Preview, Development

# Name: RESEND_API_KEY (if not already set)
# Value: re_your_key_here
# Environment: Production, Preview, Development
```

4. Click "Save"
5. **Redeploy your Next.js app** (Vercel → Deployments → Redeploy)

### Step 14: Test End-to-End

**Send a test email from Next.js:**

```typescript
// In any API route or server action
import { emailQueueClient } from '@/lib/email-queue-client';

await emailQueueClient.enqueue({
  to: 'your-email@example.com',
  subject: 'Test from Railway Queue',
  html: '<h1>It works!</h1><p>Email sent via Railway worker</p>',
});
```

**Monitor the queue:**
```bash
# Watch queue process the email
watch -n 1 'curl -s https://your-worker-url/health/queue | jq'
```

You should see:
1. `pending: 1` (email queued)
2. `processing: 1` (worker picked it up)
3. `pending: 0, processing: 0` (email sent!)

**Check your inbox** - you should receive the test email within 1-2 seconds.

---

## Part 5: Monitoring & Maintenance

### Step 15: View Logs

**Real-time logs:**
```bash
railway logs
```

**Filter by keyword:**
```bash
railway logs | grep "Email sent"
railway logs | grep "ERROR"
```

**In Railway Dashboard:**
1. Go to project → "matchbook-email-worker" service
2. Click "Deployments" tab
3. Click latest deployment
4. Click "View Logs"

### Step 16: Set Up Monitoring (Optional but Recommended)

**Health Check with UptimeRobot (Free):**

1. Sign up at https://uptimerobot.com
2. Add Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: MatchBook Email Worker
   - URL: `https://your-worker-url/health`
   - Monitoring Interval: 5 minutes
3. Add alert email

**You'll get notified if worker goes down.**

### Step 17: Check Costs

```bash
railway billing
```

**Or in dashboard:**
1. Settings → Billing
2. View current usage

**Expected costs:**
- Worker: ~$5/month (512MB / 0.5 vCPU)
- Redis: Free (Railway includes 100MB)
- **Total: ~$5/month**

---

## Common Issues & Solutions

### Issue 1: Build Fails

**Error:** `Failed to build Docker image`

**Solution:**
```bash
# Test build locally first
cd java_backend/worker
docker build -t test-worker .

# If local build works, try again on Railway
railway up --force
```

### Issue 2: Redis Connection Failed

**Error:** `"redis": "disconnected"` in health check

**Check environment variables:**
```bash
railway variables
```

**Should have:**
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

**If missing:**
```bash
# Railway should auto-configure these, but you can set manually:
railway variables set REDIS_HOST=matchbook-redis.railway.internal
railway variables set REDIS_PORT=6379
```

### Issue 3: Worker Keeps Restarting

**Check logs:**
```bash
railway logs --tail=100
```

**Common causes:**
1. **Out of memory:** Increase to 1GB in `railway.toml`
2. **Invalid RESEND_API_KEY:** Update with correct key
3. **Java heap size:** Already configured in Dockerfile (`-XX:MaxRAMPercentage=75.0`)

**Increase memory:**
```toml
# In railway.toml
[deploy.resources]
memoryGB = 1  # Increase from 0.5 to 1GB
```

Then redeploy:
```bash
railway up
```

### Issue 4: Emails Not Sending

**1. Check worker logs:**
```bash
railway logs | grep "Email"
```

**2. Check queue stats:**
```bash
curl https://your-worker-url/health/queue
```

**If `pending` keeps growing:**
- Worker may be stuck
- Check for errors in logs
- Restart service: `railway restart`

**If `dlq` > 0:**
- Emails failed after 3 retries
- Check logs for error details
- Common: Invalid Resend API key, malformed email addresses

### Issue 5: Can't Access Worker URL

**Check if domain is generated:**
```bash
railway domain
```

**If no domain:**
```bash
# Generate one
railway domain generate
```

**Test health endpoint:**
```bash
curl https://your-worker-url/health
```

---

## Scaling Guide

### Horizontal Scaling (More Workers)

**When to scale:**
- Queue consistently > 100 pending emails
- You need > 2 emails/sec throughput
- You want high availability / redundancy

**How to scale:**
```toml
# In railway.toml
[deploy]
numReplicas = 2  # Run 2 workers (4 emails/sec)
```

Then deploy:
```bash
railway up
```

**Cost impact:**
- 2 replicas = ~$10/month (vs $5 for 1)
- Each replica adds 2 emails/sec capacity

### Vertical Scaling (More Resources)

**When to scale:**
- Worker using > 450MB RAM consistently
- Out of memory errors in logs

**How to scale:**
```toml
# In railway.toml
[deploy.resources]
memoryGB = 1     # Double memory
vCPU = 1         # Double CPU (probably not needed)
```

Then deploy:
```bash
railway up
```

**Cost impact:**
- 1GB RAM = ~$7-10/month (vs $5 for 512MB)

---

## Updating the Worker

### Deploy New Changes

```bash
# After making code changes
cd java_backend/worker

# Deploy
railway up

# Watch deployment
railway logs
```

**Railway automatically:**
- Builds new Docker image
- Runs health checks
- Switches traffic to new version
- Keeps old version running until health checks pass (zero downtime)

### Rollback to Previous Version

**In Railway Dashboard:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu → Rollback

**Or via CLI:**
```bash
railway rollback
```

---

## Environment Management

### Production vs Development

**Create separate environments:**

```bash
# Create staging environment
railway environment create staging

# Switch to staging
railway environment staging

# Deploy to staging
railway up

# Switch back to production
railway environment production
```

**Best practice:**
- `production` - Connected to live Next.js on Vercel
- `staging` - Connected to preview deployments
- `development` - Local testing with docker-compose

---

## Cleanup / Deletion

### Remove Service (Keep Project)

```bash
railway service delete matchbook-email-worker
```

### Delete Entire Project

```bash
railway project delete
```

**Or in dashboard:**
1. Project Settings
2. Danger Zone
3. Delete Project

---

## Quick Reference

### Essential Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Check status
railway status

# Environment variables
railway variables

# Open dashboard
railway open

# Restart service
railway restart

# Connect to Redis
railway connect redis
```

### Important URLs

- **Dashboard:** https://railway.app/dashboard
- **Docs:** https://docs.railway.app
- **Status:** https://status.railway.app
- **Support:** https://help.railway.app

### Configuration Files

- `railway.toml` - Deployment config (resources, health checks)
- `Dockerfile` - Build instructions
- `pom.xml` - Maven dependencies
- `application.properties` - Spring Boot config

---

## Success Checklist

After deployment, verify:

- [ ] `railway status` shows "Running"
- [ ] Health endpoint returns `"status": "UP"`
- [ ] Redis shows `"redis": "connected"`
- [ ] Queue stats endpoint responding
- [ ] Test email sends successfully
- [ ] Next.js can enqueue emails
- [ ] Email arrives in inbox
- [ ] Monitoring/alerts configured
- [ ] Costs within budget (~$5/month)

---

## Next Steps

1. **Monitor for 24-48 hours** - Watch logs and queue stats
2. **Migrate first cron job** - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. **Set up alerts** - UptimeRobot or similar
4. **Document runbook** - Share with team
5. **Plan for scale** - Add second worker if needed

---

## Support

**Railway Issues:**
- Discord: https://discord.gg/railway
- Help docs: https://help.railway.app

**Worker Issues:**
- Check logs: `railway logs`
- Health check: `curl https://your-url/health`
- Queue stats: `curl https://your-url/health/queue`

**Next.js Integration:**
- See [EMAIL_QUEUE_SETUP.md](./EMAIL_QUEUE_SETUP.md)
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

**Deployment should take ~30 minutes total from start to finish.**

Happy deploying! 🚀
