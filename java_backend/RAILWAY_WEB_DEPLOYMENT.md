# Railway Web UI Deployment Guide

Complete guide for deploying the Java email worker using Railway's web dashboard (no CLI required).

**Time Required:** 20-30 minutes
**Cost:** ~$5/month (512MB RAM, 0.5 vCPU + free Redis)

---

## Prerequisites

- Railway account (free signup at https://railway.app)
- GitHub account
- Resend API key (get from https://resend.com/api-keys)
- Your code pushed to GitHub

---

## Part 1: Push Code to GitHub (5 minutes)

### Step 1: Commit and Push

**If not already pushed:**

```bash
cd /path/to/matchbook-web-frontend

# Check status
git status

# Add java_backend if not committed
git add java_backend/ contracts/ docker-compose.yml JAVA_BACKEND.md

# Commit
git commit -m "Add Java email worker"

# Push to GitHub
git push origin main
```

**Verify on GitHub:**
1. Go to your GitHub repository
2. Check that `java_backend/` folder exists
3. Verify `java_backend/worker/` has all files

---

## Part 2: Create Railway Project (10 minutes)

### Step 2: Sign Up / Login to Railway

1. Go to https://railway.app
2. Click **"Login"** (top right)
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account

### Step 3: Create New Project

1. Click **"New Project"** (big button in center or top right)
2. You'll see options:
   - Deploy from GitHub repo
   - Deploy from template
   - Provision Redis
   - Provision PostgreSQL
   - Empty Project

3. Click **"Deploy from GitHub repo"**

### Step 4: Connect GitHub Repository

**First time:**
1. Click **"Configure GitHub App"**
2. In popup, select:
   - **All repositories** (or select specific repo)
3. Click **"Install & Authorize"**
4. You'll return to Railway

**Selecting your repo:**
1. You'll see a list of your repositories
2. Search for or click **"matchbook-web-frontend"**
3. Railway will start analyzing your repo

### Step 5: Configure Worker Service

**CRITICAL: Set Root Directory First!**

Railway needs to know where your service code lives.

**Settings panel appears:**

1. **Service Name:**
   - Change from default to: `matchbook-email-worker`

2. **Root Directory:** ⚠️ **MOST IMPORTANT STEP**
   - Click the **"Root Directory"** field
   - Type: `java_backend/worker`
   - Press Enter/Tab to confirm
   - **This tells Railway where to find your Dockerfile**

3. **Branch:**
   - Should auto-select `main`
   - Leave as is

4. **Build Configuration:**
   - After setting root directory, Railway auto-detects:
   ```
   ✓ Detected Dockerfile
   ✓ Detected railway.toml configuration
   ```

5. Click **"Deploy"** (bottom right)

**First deployment starts!** This takes 5-10 minutes:
- Maven downloads dependencies
- Spring Boot compiles
- Docker image builds
- Service deploys

You'll see build logs streaming. ✨

### Step 6: Add Redis Database

While worker is building:

1. Click your project name (top breadcrumb)
2. Click **"+ New"** button (top right)
3. Select **"Database"**
4. Select **"Add Redis"**

**Redis configuration:**
1. **Name:** Change to `matchbook-redis`
2. **Region:** Same as worker (usually auto-selected)
3. Click **"Add Redis"**

Redis provisions in ~30 seconds. You'll see:
```
✓ matchbook-redis deployed
  Status: Running
```

---

## Part 3: Configure Environment Variables (5 minutes)

### Step 7: Set Resend API Key

1. Click on **"matchbook-email-worker"** service (in project view)
2. Click **"Variables"** tab (top navigation)
3. Click **"+ New Variable"** button
4. Enter:
   - **Variable Name:** `RESEND_API_KEY`
   - **Value:** `re_your_actual_api_key_here`
5. Click **"Add"**

**The service will automatically redeploy with the new variable.**

### Step 8: Verify Auto-Configured Variables

Railway automatically configured Redis connection!

In the **Variables** tab, you should see:
- ✓ `RESEND_API_KEY` (you just added)
- ✓ `REDIS_HOST` (auto-added, something like `matchbook-redis.railway.internal`)
- ✓ `REDIS_PORT` (auto-added, `6379`)
- ✓ `REDIS_PASSWORD` (auto-added, random string)

**You don't need to add these Redis variables - they're automatic!**

### Step 9: Add Optional Variables (Recommended)

Add one more variable for clarity:

1. Click **"+ New Variable"**
2. Enter:
   - **Variable Name:** `EMAIL_QUEUE_ENABLED`
   - **Value:** `true`
3. Click **"Add"**

---

## Part 4: Configure Service Settings (5 minutes)

### Step 10: Generate Public URL

Your worker needs a URL for health checks and Next.js to access it:

1. Click **"matchbook-email-worker"** service
2. Click **"Settings"** tab
3. Scroll to **"Networking"** section
4. Under **"Public Networking"**, click **"Generate Domain"**

**You'll get a URL like:**
```
matchbook-email-worker-production.up.railway.app
```

**Save this URL!** You'll need it for:
- Health checks
- Next.js REDIS_URL configuration
- Monitoring

### Step 11: Verify Resource Allocation

Railway reads your `railway.toml` file automatically!

1. Still in **"Settings"** tab
2. Scroll to **"Resources"** section
3. Verify:
   - **Memory:** 512 MB (0.5 GB)
   - **vCPU:** 0.5 (half a core)

**If different, update:**
1. Click **"Edit"** next to Resources
2. Set:
   - Memory: `512 MB`
   - vCPU: `0.5`
3. Click **"Update"**

### Step 12: Configure Health Checks

Railway uses your `railway.toml` health check config:

1. In **"Settings"** tab
2. Scroll to **"Health Check"** section
3. Should show:
   - **Path:** `/health`
   - **Timeout:** 100 seconds

**If not set:**
1. Click **"Edit"**
2. Set:
   - **Health Check Path:** `/health`
   - **Health Check Timeout:** `100`
3. Click **"Update"**

---

## Part 5: Verify Deployment (5 minutes)

### Step 13: Check Build Status

1. Click **"Deployments"** tab (top navigation)
2. You should see recent deployment:
   ```
   ✓ main@abc123f - Deployed
     5 minutes ago
   ```

**If still building:**
- Status shows: "🟡 Building..."
- Wait for it to complete (first build takes 5-10 min)

**If failed:**
- Status shows: "🔴 Failed"
- Click on the deployment
- Check build logs for errors
- Common issues:
  - Wrong root directory (should be `java_backend/worker`)
  - Missing `RESEND_API_KEY`

### Step 14: Check Service Health

1. Click on latest deployment
2. Click **"View Logs"** button
3. Look for:
   ```
   Started WorkerApplication in 2.732 seconds
   Email queue consumer initialized. Rate limit: 2.0 emails/sec
   Email queue consumer started
   ```

**Good signs:**
- ✓ Application started
- ✓ Email queue consumer started
- ✓ No errors in logs

### Step 15: Test Health Endpoint

**Get your service URL:**
1. Click project breadcrumb (top)
2. Click **"matchbook-email-worker"**
3. Copy the URL under service name

**Test in browser or terminal:**

**Browser:**
```
https://matchbook-email-worker-production.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "UP",
  "service": "matchbook-worker",
  "redis": "connected",
  "timestamp": 1699564800000
}
```

**Terminal:**
```bash
curl https://matchbook-email-worker-production.up.railway.app/health
```

**If you see `"redis": "connected"` - you're good!** ✅

### Step 16: Test Queue Endpoint

**In browser or terminal:**
```
https://matchbook-email-worker-production.up.railway.app/health/queue
```

**Expected response:**
```json
{
  "pending": 0,
  "processing": 0,
  "failed": 0,
  "dlq": 0,
  "total": 0,
  "timestamp": 1699564850000
}
```

All zeros is perfect - means queue is empty and ready!

---

## Part 6: Get Redis Connection URL (3 minutes)

### Step 17: Find Redis URL

You need this for Next.js configuration.

**Method 1: Variables Tab (Easiest)**
1. Click project breadcrumb (top)
2. Click **"matchbook-redis"** service
3. Click **"Variables"** tab
4. Find `REDIS_URL`
5. Click the **👁️ (eye icon)** to reveal value
6. Click **📋 (copy icon)** to copy

**Looks like:**
```
redis://default:abc123xyz789@roundhouse.proxy.rlwy.net:12345
```

**Method 2: Connect Tab**
1. Click **"matchbook-redis"** service
2. Click **"Connect"** tab
3. Under **"Available Connection URLs"**
4. Copy the **"Redis URL"**

**Save this URL!** You'll add it to Vercel.

---

## Part 7: Configure Next.js on Vercel (5 minutes)

### Step 18: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Click your Next.js project
3. Click **"Settings"** (top navigation)
4. Click **"Environment Variables"** (left sidebar)

### Step 19: Add REDIS_URL

1. Click **"Add New"** button
2. Enter:
   - **Name:** `REDIS_URL`
   - **Value:** (paste Redis URL from Step 17)
   - **Environment:** Check all:
     - ✓ Production
     - ✓ Preview
     - ✓ Development
3. Click **"Save"**

### Step 20: Add USE_EMAIL_QUEUE

1. Click **"Add New"** button again
2. Enter:
   - **Name:** `USE_EMAIL_QUEUE`
   - **Value:** `true`
   - **Environment:** Check all:
     - ✓ Production
     - ✓ Preview
     - ✓ Development
3. Click **"Save"**

### Step 21: Add RESEND_API_KEY (if not already set)

**Check if already exists:**
- Look for `RESEND_API_KEY` in environment variables list

**If NOT there:**
1. Click **"Add New"**
2. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_your_resend_key`
   - **Environment:** Check all three
3. Click **"Save"**

### Step 22: Redeploy Next.js

**Important:** Environment variables only apply after redeployment!

1. Click **"Deployments"** (top navigation)
2. Click **"•••"** menu on latest deployment
3. Click **"Redeploy"**
4. Confirm: **"Redeploy"**

Wait 2-3 minutes for redeployment to complete.

---

## Part 8: Test End-to-End (5 minutes)

### Step 23: Send Test Email

**Option 1: From Next.js App**

If you have access to trigger email sending in your app:
1. Login to your app
2. Perform action that sends email (e.g., create notification)
3. Watch for email arrival

**Option 2: Via API Route (if you have one)**

```bash
curl -X POST https://your-nextjs-app.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

**Option 3: Create Test Route**

Create `src/app/api/test-queue/route.ts`:
```typescript
import { emailQueueClient } from '@/lib/email-queue-client';
import { NextResponse } from 'next/server';

export async function GET() {
  await emailQueueClient.enqueue({
    to: 'your-email@example.com',
    subject: 'Test from Railway Queue',
    html: '<h1>It works!</h1><p>Email sent via Railway worker</p>',
  });

  return NextResponse.json({ success: true });
}
```

Then visit: `https://your-app.vercel.app/api/test-queue`

### Step 24: Monitor Queue Processing

**In browser, refresh this URL every few seconds:**
```
https://matchbook-email-worker-production.up.railway.app/health/queue
```

**Watch the progression:**
1. `pending: 1` - Email queued
2. `processing: 1` - Worker picked it up
3. `pending: 0, processing: 0` - Email sent!

**Or auto-refresh with watch command:**
```bash
watch -n 1 'curl -s https://your-worker-url/health/queue'
```

### Step 25: Check Worker Logs

**In Railway dashboard:**
1. Click **"matchbook-email-worker"** service
2. Click **"Deployments"** tab
3. Click latest deployment
4. Click **"View Logs"**

**Look for:**
```
Processing email job abc-123-xyz (attempt 1)
Email sent successfully to your-email@example.com (jobId: abc-123-xyz)
```

### Step 26: Verify Email Received

Check your inbox! Email should arrive within 1-2 seconds.

**Subject:** Test from Railway Queue
**Body:** It works! Email sent via Railway worker

---

## Part 9: Set Up Monitoring (Optional, 5 minutes)

### Step 27: Configure Railway Metrics

Railway has built-in monitoring:

1. Click **"matchbook-email-worker"** service
2. Click **"Metrics"** tab

**You'll see graphs for:**
- Memory usage
- CPU usage
- Network traffic
- Request count

**Watch for:**
- Memory should be ~300-500 MB (under 512 MB limit)
- CPU should be low (< 20%) when idle
- Spikes are normal when processing emails

### Step 28: Set Up External Monitoring (Recommended)

**UptimeRobot (Free):**

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Click **"Add New Monitor"**
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** MatchBook Email Worker
   - **URL:** `https://your-worker-url/health`
   - **Monitoring Interval:** 5 minutes
5. Click **"Create Monitor"**

**Add alert contact:**
1. **My Settings** → **Alert Contacts**
2. Add your email
3. Confirm verification email

**You'll get notified if worker goes down!**

---

## Troubleshooting

### Build Failed - "Dockerfile does not exist"

**Error:** `Dockerfile 'Dockerfile' does not exist`

**Cause:** Root directory not set correctly.

**Fix:**
1. Click **"matchbook-email-worker"** service
2. Click **"Settings"** tab
3. Scroll to **"Source"** section
4. Find **"Root Directory"** field
5. Set to: `java_backend/worker`
6. Click **"Update"** or **"Save"**
7. Service will automatically redeploy

**Verify:**
- After setting, you should see build start
- Logs should show: "Detected Dockerfile"

### Build Failed - Other Errors

**Error:** "Failed to build image" (other reasons)

**Check:**
1. **Settings** → **Root Directory** = `java_backend/worker` ✓
2. **Variables** → `RESEND_API_KEY` is set
3. **Deployments** → View Logs → Check error details

**Fix:**
- Update root directory if wrong
- Add missing environment variables
- Check Dockerfile syntax if modified

### Redis Connection Failed

**Error:** Health check shows `"redis": "disconnected"`

**Check:**
1. Redis service is running (should show green dot)
2. Both services in same project
3. Variables tab shows `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**Fix:**
1. Click **matchbook-redis** → Check status
2. If stopped, click **"Restart"**
3. If missing variables, delete and re-add Redis:
   - Delete **matchbook-redis** service
   - Click **"+ New"** → **"Database"** → **"Redis"**

### Health Check Timeout

**Error:** Health checks failing / service shows unhealthy

**Check:**
1. Logs show "Started WorkerApplication"
2. Health check path = `/health`
3. Service is actually listening on port 8080

**Fix:**
1. **Settings** → **Health Check Path** = `/health`
2. **Settings** → **Health Check Timeout** = `100` seconds
3. Check logs for Spring Boot startup errors

### Can't Access Service URL

**Error:** Domain doesn't load

**Check:**
1. **Settings** → **Networking** → Public domain generated
2. Service shows as "Running" (green dot)
3. Health checks passing

**Fix:**
1. **Settings** → **Networking** → **Generate Domain** (if none)
2. Wait 1-2 minutes for DNS propagation
3. Try incognito/private browsing mode

### Emails Not Sending

**Check:**
1. Health endpoint: `"status": "UP"`
2. Redis connected: `"redis": "connected"`
3. Queue stats: No errors
4. Worker logs: No exceptions

**Common causes:**
1. **Invalid Resend API key:**
   - Update `RESEND_API_KEY` variable
   - Service auto-redeploys
2. **Next.js not enqueuing:**
   - Check Vercel env vars
   - Verify `REDIS_URL` is correct
   - Verify `USE_EMAIL_QUEUE=true`
3. **Redis connection from Next.js:**
   - Test: `redis-cli -u $REDIS_URL ping`
   - Should return PONG

---

## Configuration Summary

### Railway Project Structure

```
matchbook-email-worker (Project)
├── matchbook-email-worker (Service)
│   ├── Root Directory: java_backend/worker
│   ├── Resources: 512MB RAM, 0.5 vCPU
│   ├── Health Check: /health
│   └── Variables:
│       ├── RESEND_API_KEY (manual)
│       ├── EMAIL_QUEUE_ENABLED=true (manual)
│       ├── REDIS_HOST (auto)
│       ├── REDIS_PORT (auto)
│       └── REDIS_PASSWORD (auto)
└── matchbook-redis (Service)
    ├── Type: Redis 7
    ├── Memory: 100MB (free tier)
    └── Network: Internal to project
```

### Vercel Environment Variables

```
Production, Preview, Development:
├── REDIS_URL=redis://default:pass@host:port (from Railway)
├── USE_EMAIL_QUEUE=true
└── RESEND_API_KEY=re_your_key
```

---

## Cost Breakdown

**Railway:**
- Worker: ~$5/month (512MB RAM, 0.5 vCPU)
- Redis: $0/month (free tier, 100MB included)
- **Subtotal: ~$5/month**

**Vercel:**
- No change (existing Next.js hosting)

**Resend:**
- No change (existing email API)

**Total New Costs: ~$5/month**

---

## Next Steps

✅ **Worker deployed and running**
✅ **Redis connected**
✅ **Next.js integrated**
✅ **Test email sent successfully**

**Now:**

1. **Monitor for 24-48 hours**
   - Watch metrics in Railway dashboard
   - Check logs periodically
   - Verify emails sending

2. **Migrate cron jobs**
   - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
   - Start with low-volume cron (preview-rent-payments)
   - Gradually migrate others

3. **Set up alerts**
   - UptimeRobot for uptime monitoring
   - Railway notifications for deployments
   - Email alerts for DLQ growth

4. **Document for team**
   - Share Railway credentials
   - Document environment variables
   - Create runbook for common issues

---

## Quick Reference

**Railway URLs:**
- Dashboard: https://railway.app/dashboard
- Your project: https://railway.app/project/[project-id]
- Worker service: https://railway.app/project/[project-id]/service/[service-id]

**Important Endpoints:**
- Health: `https://your-worker-url/health`
- Queue stats: `https://your-worker-url/health/queue`
- Actuator: `https://your-worker-url/actuator/health`

**Common Actions:**
- View logs: Service → Deployments → Latest → View Logs
- Restart: Service → Settings → Restart
- Variables: Service → Variables
- Metrics: Service → Metrics

---

**Total time: ~30 minutes from start to finish**

Congratulations! Your Java email worker is deployed and running on Railway! 🎉
