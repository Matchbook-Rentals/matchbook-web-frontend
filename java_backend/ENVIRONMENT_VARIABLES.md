# Environment Variables Reference

Complete reference for all environment variables needed for the Java email worker system.

---

## Quick Start

### Minimum Required Variables

**Java Worker (Railway/Production):**
```bash
RESEND_API_KEY=re_your_actual_key_here
```

**Next.js (Vercel/Production):**
```bash
REDIS_URL=redis://default:password@host:port
USE_EMAIL_QUEUE=true
RESEND_API_KEY=re_your_actual_key_here  # (if not already set)
```

That's it for production! Redis connection details are auto-configured by Railway.

---

## Java Worker Environment Variables

### Required

| Variable | Description | Example | Where to Set |
|----------|-------------|---------|--------------|
| `RESEND_API_KEY` | Resend API key for sending emails | `re_abc123...` | Railway, Render |

### Auto-Configured (Railway)

These are **automatically set** when you add Redis to Railway:

| Variable | Description | Example | Auto-Set By |
|----------|-------------|---------|-------------|
| `REDIS_HOST` | Redis hostname | `matchbook-redis.railway.internal` | Railway |
| `REDIS_PORT` | Redis port | `6379` | Railway |
| `REDIS_PASSWORD` | Redis password | `abc123xyz...` | Railway |

**You don't need to set these manually on Railway!**

### Optional (with defaults)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `EMAIL_QUEUE_ENABLED` | Enable/disable queue consumer | `true` | `true` or `false` |
| `PORT` | Server port | `8080` | `8080` |
| `REDIS_USE_SSL` | Use SSL for Redis connection | `false` | `true` (Render), `false` (Railway) |

---

## Next.js Environment Variables

### Required

| Variable | Description | Example | Where to Set |
|----------|-------------|---------|--------------|
| `REDIS_URL` | Full Redis connection URL | `redis://default:pass@host:port` | Vercel, Local |
| `USE_EMAIL_QUEUE` | Enable email queue (vs direct send) | `true` | Vercel, Local |
| `RESEND_API_KEY` | Resend API key (if not already set) | `re_abc123...` | Vercel, Local |

### Optional

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node environment | `development` | `production` |

---

## Environment-Specific Configuration

### Local Development

**`.env.local` (Next.js):**
```bash
# Redis (Docker Compose)
REDIS_URL=redis://localhost:6380

# Enable queue
USE_EMAIL_QUEUE=true

# Resend (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_key_here
```

**Java Worker (Docker Compose):**
No `.env` file needed! Environment variables are set in `docker-compose.yml`:
```yaml
environment:
  - REDIS_HOST=redis
  - REDIS_PORT=6379
  - RESEND_API_KEY=${RESEND_API_KEY}  # Reads from shell
  - EMAIL_QUEUE_ENABLED=true
```

**To run locally:**
```bash
# Set in your shell (or .bashrc/.zshrc)
export RESEND_API_KEY=re_your_key_here

# Start services
docker compose up -d
```

---

### Railway Production

**Worker (Railway):**
```bash
# Set via CLI
railway variables set RESEND_API_KEY=re_your_key_here
railway variables set EMAIL_QUEUE_ENABLED=true

# Auto-configured by Railway (don't set manually):
# REDIS_HOST=matchbook-redis.railway.internal
# REDIS_PORT=6379
# REDIS_PASSWORD=abc123xyz...
```

**Next.js (Vercel):**
```bash
# In Vercel Dashboard → Settings → Environment Variables

# Get Redis URL from Railway dashboard:
REDIS_URL=redis://default:password@roundhouse.proxy.rlwy.net:12345

# Enable queue
USE_EMAIL_QUEUE=true

# Resend (if not already set)
RESEND_API_KEY=re_your_key_here
```

**How to get Railway Redis URL:**
1. Railway dashboard → matchbook-redis service
2. "Connect" tab
3. Copy "Public Redis URL"

Or via CLI:
```bash
railway variables --service matchbook-redis | grep REDIS_URL
```

---

### Render Production

**Worker (Render):**
```bash
# In Render Dashboard → Environment Variables
RESEND_API_KEY=re_your_key_here
EMAIL_QUEUE_ENABLED=true
REDIS_USE_SSL=true  # Important for Render!

# These are auto-configured from Redis service:
# REDIS_HOST=<internal-redis-host>
# REDIS_PORT=6379
# REDIS_PASSWORD=<generated-password>
```

**Next.js (Vercel):**
```bash
# Get Redis URL from Render dashboard
REDIS_URL=rediss://default:password@host:port  # Note: rediss:// with SSL

# Enable queue
USE_EMAIL_QUEUE=true

# Resend
RESEND_API_KEY=re_your_key_here
```

---

### Staging/Preview Environment

**Worker (Railway Staging):**
```bash
# Create staging environment
railway environment create staging
railway environment staging

# Set variables (same as production)
railway variables set RESEND_API_KEY=re_your_staging_key_here
railway variables set EMAIL_QUEUE_ENABLED=true
```

**Next.js (Vercel Preview):**
```bash
# In Vercel Dashboard → Environment Variables
# Set for "Preview" environment only

REDIS_URL=redis://...staging-redis-url...
USE_EMAIL_QUEUE=true
RESEND_API_KEY=re_your_staging_key_here
```

---

## How to Set Environment Variables

### Railway (CLI)

```bash
# Set single variable
railway variables set RESEND_API_KEY=re_abc123

# Set multiple variables
railway variables set EMAIL_QUEUE_ENABLED=true REDIS_USE_SSL=false

# View all variables
railway variables

# Delete variable
railway variables delete SOME_VAR
```

### Railway (Dashboard)

1. Go to https://railway.app/dashboard
2. Select your project
3. Click "matchbook-email-worker" service
4. Click "Variables" tab
5. Click "New Variable"
6. Enter name and value
7. Click "Add"

### Vercel (Dashboard)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Enter:
   - **Name**: `REDIS_URL`
   - **Value**: `redis://...`
   - **Environment**: Production, Preview, Development
5. Click "Save"
6. **Redeploy** for changes to take effect

### Vercel (CLI)

```bash
# Set for production
vercel env add REDIS_URL production

# Set for all environments
vercel env add USE_EMAIL_QUEUE
# Then select: Production, Preview, Development

# Pull env vars to local
vercel env pull .env.local
```

### Local (Docker Compose)

```bash
# Option 1: Shell environment
export RESEND_API_KEY=re_abc123
docker compose up -d

# Option 2: .env file in project root
echo "RESEND_API_KEY=re_abc123" >> .env
docker compose up -d

# Option 3: Directly in docker-compose.yml
# Edit environment section with hard-coded values (not recommended for secrets)
```

---

## Variable Details

### `RESEND_API_KEY`

**Required in:** Java Worker, Next.js
**Format:** `re_` prefix followed by alphanumeric string
**Where to get:** https://resend.com/api-keys
**Example:** `re_abc123def456ghi789`

**Testing:**
```bash
# Test API key works
curl https://api.resend.com/emails \
  -H "Authorization: Bearer re_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "delivered@resend.dev",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

**Security:**
- Never commit to git
- Use different keys for dev/staging/production
- Rotate keys periodically

### `REDIS_URL`

**Required in:** Next.js
**Format:** `redis://[user:password@]host:port[/database]`
**Examples:**
```bash
# Railway (with password)
redis://default:abc123xyz@roundhouse.proxy.rlwy.net:12345

# Render (with SSL)
rediss://default:abc123xyz@oregon-redis.render.com:6379

# Upstash (with SSL)
rediss://:abc123xyz@us1-secure-lemur-12345.upstash.io:6379

# Local (no password)
redis://localhost:6380
```

**Components:**
- `redis://` or `rediss://` (SSL)
- `default:` - username (usually "default")
- `password@` - Redis password
- `host:port` - Redis server location
- `/0` - database number (optional, defaults to 0)

**Testing:**
```bash
# Test Redis connection (requires redis-cli)
redis-cli -u "redis://default:password@host:port" ping
# Should return: PONG
```

### `USE_EMAIL_QUEUE`

**Required in:** Next.js
**Format:** `true` or `false` (string, not boolean)
**Default:** `false`

**When `true`:**
- Emails enqueue to Redis
- Java worker processes them
- 2 emails/sec rate limiting
- Automatic retries

**When `false`:**
- Emails send directly via Resend API
- No rate limiting
- No retries
- No queue visibility

**Testing:**
```typescript
// This code path changes based on USE_EMAIL_QUEUE
await sendNotificationEmail({
  to: 'test@example.com',
  subject: 'Test',
  emailData: {...}
});

// With USE_EMAIL_QUEUE=true:
// → Enqueues to Redis
// → Returns immediately
// → Worker sends async

// With USE_EMAIL_QUEUE=false:
// → Sends directly to Resend
// → Waits for response
// → Returns after send
```

### `EMAIL_QUEUE_ENABLED`

**Required in:** Java Worker
**Format:** `true` or `false` (string)
**Default:** `true`

**When `true`:**
- Worker consumes from Redis queue
- Processes emails at 2/sec
- Retry logic active

**When `false`:**
- Worker starts but doesn't consume queue
- Useful for debugging
- Queue builds up (not recommended for production)

**Use case for `false`:**
- Debugging worker startup issues
- Testing Redis connectivity without processing
- Temporarily pausing email sending

### Redis Auto-Configured Variables

**These are set automatically by Railway/Render when you add Redis:**

#### `REDIS_HOST`
**Examples:**
- Railway: `matchbook-redis.railway.internal`
- Render: `oregon-redis.render.com`
- Local: `localhost`

#### `REDIS_PORT`
**Default:** `6379`
**Note:** Rarely changes

#### `REDIS_PASSWORD`
**Format:** Random alphanumeric string
**Example:** `Jx9Kp2Lm4Nq8Rt5Vw7Y`
**Note:** Generated by platform, don't set manually

#### `REDIS_USE_SSL`
**Required for:**
- Render: `true`
- Upstash: `true`
- Railway: `false` (internal network)
- Local: `false`

---

## Security Best Practices

### DO ✅

- Use different API keys for dev/staging/production
- Store secrets in environment variables (not code)
- Use platform secret managers (Railway, Vercel)
- Rotate API keys periodically
- Use `.env.local` for local development
- Add `.env*` to `.gitignore`

### DON'T ❌

- Commit API keys to git
- Share API keys in Slack/email
- Hard-code secrets in `docker-compose.yml`
- Use production keys in development
- Expose secrets in client-side code

---

## Troubleshooting

### "RESEND_API_KEY is not configured"

**Check:**
```bash
# Railway
railway variables | grep RESEND_API_KEY

# Vercel
vercel env ls

# Local
echo $RESEND_API_KEY
```

**Fix:**
```bash
# Railway
railway variables set RESEND_API_KEY=re_your_key

# Vercel
vercel env add RESEND_API_KEY

# Local
export RESEND_API_KEY=re_your_key
```

### "REDIS_URL environment variable not set"

**Check Next.js env vars:**
```bash
vercel env ls | grep REDIS_URL
```

**Get from Railway:**
```bash
railway variables --service matchbook-redis
```

**Copy the REDIS_URL value to Vercel**

### "Redis connection error" / "redis": "disconnected"

**Check worker logs:**
```bash
railway logs | grep -i redis
```

**Common issues:**
1. **Wrong password:** Check REDIS_PASSWORD matches
2. **Wrong host:** Should be internal Railway host (`.railway.internal`)
3. **SSL mismatch:** Set `REDIS_USE_SSL=false` for Railway, `true` for Render
4. **Firewall:** Redis service not accessible (check Railway service networking)

**Fix:**
```bash
# Railway usually auto-configures these
# If broken, try re-adding Redis:
railway service delete matchbook-redis
railway add  # Select Redis again
```

### "Port already in use" (Local)

**Error:** `port 6379 is already allocated`

**This is expected!** You have another Redis running.

**Solution:** Use port 6380 (already configured in docker-compose.yml)
```bash
# In .env.local
REDIS_URL=redis://localhost:6380  # Not 6379
```

---

## Environment Variables Checklist

### Pre-Deployment

- [ ] Get Resend API key from https://resend.com/api-keys
- [ ] Set `RESEND_API_KEY` in Railway
- [ ] Deploy worker to Railway
- [ ] Get Redis URL from Railway dashboard
- [ ] Set `REDIS_URL` in Vercel
- [ ] Set `USE_EMAIL_QUEUE=true` in Vercel
- [ ] Redeploy Next.js on Vercel

### Post-Deployment

- [ ] Test health endpoint: `curl https://worker-url/health`
- [ ] Verify `"redis": "connected"`
- [ ] Test queue: `curl https://worker-url/health/queue`
- [ ] Send test email from Next.js
- [ ] Verify email received
- [ ] Check worker logs for errors

---

## Quick Reference Card

**Print this out and keep handy:**

```
┌─────────────────────────────────────────────────────────┐
│         MATCHBOOK EMAIL QUEUE - ENV VARS                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  JAVA WORKER (Railway):                                 │
│    RESEND_API_KEY=re_your_key                          │
│    (Redis vars auto-configured)                         │
│                                                         │
│  NEXT.JS (Vercel):                                      │
│    REDIS_URL=redis://default:pass@host:port            │
│    USE_EMAIL_QUEUE=true                                 │
│    RESEND_API_KEY=re_your_key                          │
│                                                         │
│  LOCAL (Docker Compose):                                │
│    export RESEND_API_KEY=re_your_key                   │
│    REDIS_URL=redis://localhost:6380                     │
│    USE_EMAIL_QUEUE=true                                 │
│                                                         │
│  GET REDIS_URL:                                         │
│    Railway Dashboard → matchbook-redis → Connect       │
│                                                         │
│  TEST HEALTH:                                           │
│    curl https://worker-url/health                       │
│    curl https://worker-url/health/queue                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Step-by-step Railway deployment
- [EMAIL_QUEUE_SETUP.md](./EMAIL_QUEUE_SETUP.md) - Email queue setup guide
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migrating cron jobs
- [worker/README.md](./worker/README.md) - Worker service details
