# Railway Quick Fix Guide

Having issues deploying? Here are the most common problems and instant fixes.

---

## ❌ Error: "Dockerfile does not exist"

### Problem
```
Error: Dockerfile 'Dockerfile' does not exist
Build failed
```

### Root Cause
Railway is looking in the wrong directory. Your Dockerfile is at `java_backend/worker/Dockerfile`, but Railway is searching at the repository root.

### Fix (30 seconds)

**In Railway Dashboard:**

1. Click your **"matchbook-email-worker"** service
2. Click **"Settings"** tab (top navigation)
3. Scroll down to **"Source"** section
4. Look for **"Root Directory"** field
5. **Type:** `java_backend/worker`
6. Press **Enter** or click outside the field
7. Click **"Update"** (if button appears)

**Railway will automatically:**
- Detect the change
- Start a new deployment
- Build from the correct directory

**You should see:**
```
✓ Detected Dockerfile
✓ Building image...
```

### Verify It Worked

Check the build logs:
1. Click **"Deployments"** tab
2. Click the new deployment (should say "Building..." or "Deploying...")
3. Look for:
   ```
   Step 1/17 : FROM maven:3.9-eclipse-temurin-17
   ```

If you see Maven steps, it's working! ✅

---

## ❌ Error: "RESEND_API_KEY environment variable is required"

### Problem
Worker starts but crashes immediately:
```
Error: RESEND_API_KEY environment variable is required
Application failed to start
```

### Fix (1 minute)

1. Click **"Variables"** tab
2. Click **"+ New Variable"**
3. Enter:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_actual_key_here` (get from https://resend.com/api-keys)
4. Click **"Add"**

**Service auto-redeploys with the new variable.**

---

## ❌ Error: "redis: disconnected"

### Problem
Health check shows Redis not connected:
```json
{
  "status": "UP",
  "redis": "disconnected"
}
```

### Causes & Fixes

**Cause 1: Redis service not running**

**Fix:**
1. Go to Railway dashboard
2. Look for **"matchbook-redis"** service
3. Check the status dot (should be green)
4. If red/gray, click the service → **"Restart"**

**Cause 2: Redis not added to project**

**Fix:**
1. Click **"+ New"** (top right)
2. Select **"Database"**
3. Select **"Add Redis"**
4. Name it: `matchbook-redis`
5. Click **"Add Redis"**
6. Worker will auto-reconnect

**Cause 3: Wrong environment variables**

**Check Variables tab for:**
- `REDIS_HOST` (should be something like `matchbook-redis.railway.internal`)
- `REDIS_PORT` (should be `6379`)
- `REDIS_PASSWORD` (should be a long random string)

**If missing:** Delete and re-add Redis (see Cause 2)

---

## ❌ Error: "Service keeps restarting"

### Problem
Service deploys but restarts every few seconds:
```
Status: Restarting
Restarts: 5
```

### Causes & Fixes

**Cause 1: Out of memory**

**Check:**
1. Click **"Metrics"** tab
2. Look at Memory graph
3. If hitting 512MB limit (red line)

**Fix:**
1. Click **"Settings"** tab
2. Scroll to **"Resources"**
3. Click **"Edit"**
4. Change Memory to: `1024 MB` (1 GB)
5. Click **"Update"**

**Cause 2: Application crash on startup**

**Check logs:**
1. Click **"Deployments"** tab
2. Click latest deployment
3. Click **"View Logs"**
4. Look for errors (red text)

**Common fixes:**
- Missing `RESEND_API_KEY` → Add it (see above)
- Redis connection → Check Redis service (see above)
- Port conflict → Check `PORT` variable (should be `8080` or unset)

---

## ❌ Error: "Cannot access service URL"

### Problem
Domain doesn't load:
```
This site can't be reached
```

### Fix

**Generate public domain:**
1. Click **"Settings"** tab
2. Scroll to **"Networking"** section
3. Under **"Public Networking"**, click **"Generate Domain"**
4. Wait 30 seconds for DNS propagation
5. Try accessing the URL again

**Check service is running:**
- Service should have green dot (Running)
- If red/gray, check **"Deployments"** for errors

---

## ❌ Error: "Health check failing"

### Problem
Service shows as "Unhealthy":
```
Health Check: Failed
```

### Fix

**Verify health check path:**
1. Click **"Settings"** tab
2. Scroll to **"Health Check"** section
3. Should be set to: `/health`
4. Timeout should be: `100` seconds

**If wrong:**
1. Click **"Edit"**
2. Set path: `/health`
3. Set timeout: `100`
4. Click **"Update"**

**Check if application actually started:**
1. Click **"Deployments"** → Latest → **"View Logs"**
2. Look for: `Started WorkerApplication in X.XXX seconds`
3. If not there, check for error messages above

---

## ✅ Success Checklist

### Deployment Settings

- [ ] Root Directory: `java_backend/worker`
- [ ] Branch: `main`
- [ ] Service Name: `matchbook-email-worker`

### Environment Variables

- [ ] `RESEND_API_KEY` = `re_...` (set manually)
- [ ] `REDIS_HOST` = `matchbook-redis.railway.internal` (auto)
- [ ] `REDIS_PORT` = `6379` (auto)
- [ ] `REDIS_PASSWORD` = `...` (auto)
- [ ] `EMAIL_QUEUE_ENABLED` = `true` (optional)

### Service Configuration

- [ ] Resources: 512 MB RAM, 0.5 vCPU
- [ ] Health Check Path: `/health`
- [ ] Health Check Timeout: `100` seconds
- [ ] Public Domain: Generated

### Verification

- [ ] Build successful (green checkmark)
- [ ] Service running (green dot)
- [ ] Health check: `{"status":"UP","redis":"connected"}`
- [ ] Queue stats: `{"pending":0,"processing":0,...}`

---

## Quick Tests

### Test 1: Health Endpoint

```bash
curl https://your-worker-url.up.railway.app/health
```

**Good response:**
```json
{
  "status": "UP",
  "service": "matchbook-worker",
  "redis": "connected",
  "timestamp": 1699564800000
}
```

### Test 2: Queue Stats

```bash
curl https://your-worker-url.up.railway.app/health/queue
```

**Good response:**
```json
{
  "pending": 0,
  "processing": 0,
  "failed": 0,
  "dlq": 0,
  "total": 0,
  "timestamp": 1699564800000
}
```

### Test 3: Actuator Health

```bash
curl https://your-worker-url.up.railway.app/actuator/health
```

**Good response:**
```json
{
  "status": "UP"
}
```

---

## Still Having Issues?

### Check These First

1. **Root directory is correct:** `java_backend/worker`
2. **Redis service exists** and is running (green dot)
3. **RESEND_API_KEY is set** in Variables tab
4. **Logs show no errors** (Deployments → View Logs)
5. **Service is running** (green dot, not restarting)

### Get Help

**Railway Discord:**
- https://discord.gg/railway
- #help channel
- Community is very responsive

**Check Railway Status:**
- https://status.railway.app
- Make sure platform is operational

**Review Full Guides:**
- [RAILWAY_WEB_DEPLOYMENT.md](./RAILWAY_WEB_DEPLOYMENT.md) - Complete step-by-step
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - CLI deployment
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - All env vars explained

---

## Emergency Rollback

If you need to undo everything:

1. **Delete Worker Service:**
   - Click service → Settings → Danger Zone → Delete Service

2. **Delete Redis Service:**
   - Click matchbook-redis → Settings → Danger Zone → Delete Service

3. **Start Over:**
   - Follow [RAILWAY_WEB_DEPLOYMENT.md](./RAILWAY_WEB_DEPLOYMENT.md) from beginning
   - Double-check root directory setting!

---

**Most issues are fixed by setting Root Directory to `java_backend/worker`** ✅
