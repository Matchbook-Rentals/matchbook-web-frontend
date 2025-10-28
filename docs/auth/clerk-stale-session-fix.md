# Clerk Idle Tab Session Recovery Fix

## Problem

Users were experiencing app errors in production when leaving browser tabs idle for extended periods. This was an intermittent issue that occurred in Next.js 14.0/14.1 but may still occur in 14.2+.

## Root Cause

The issue stems from multiple interacting problems:

1. **Clerk Token Refresh Failures** (Clerk Issue #1616)
   - Clerk tokens are short-lived JWTs that refresh every 60 seconds
   - When tabs sit idle, the token refresh can fail with "Failed to fetch" errors
   - This is a known Clerk issue that's difficult to reproduce consistently
   - Symptoms: Users see app errors after returning to idle tabs, requiring cache clear or browser restart

2. **Next.js RSC Payload Caching**
   - Next.js 14.0/14.1 had aggressive default caching for RSC (React Server Components) payloads
   - Cached RSC payloads can contain stale authentication state
   - When user returns to idle tab, Next.js tries to use stale cached RSC data
   - This conflicts with expired/refreshing Clerk sessions → app error

3. **Combined Effect**
   - User leaves tab idle > 5 minutes
   - Clerk session expires or token needs refresh
   - User returns to tab
   - Next.js serves stale RSC payload OR Clerk token refresh fails
   - Result: "Failed to fetch" or generic app error

## Solution

We implemented three defensive fixes that work together:

### 1. Extended RSC Stale Time (`src/app/layout.tsx`)

```typescript
<ClerkProvider
  __experimental_staleTimes={{
    dynamic: 180000 // 3 minutes
  }}
  // ...
>
```

**What it does:**
- Keeps RSC payloads in client-side router cache for 3 minutes instead of default 30 seconds
- Reduces unnecessary refetches that could conflict with token refresh
- Only affects client-side navigation, not server rendering

**Why it helps:**
- Prevents race conditions between RSC refetch and token refresh
- Reduces load on Clerk API (fewer token refresh requests)

### 2. AuthRecovery Component (`src/components/AuthRecovery.tsx`)

**What it does:**
- Listens for tab visibility changes and window focus events
- When tab becomes active, attempts silent Clerk token refresh
- Only redirects to `/sign-in` on genuine authentication errors
- Logs all auth failures for monitoring

**Why it helps:**
- Proactively refreshes tokens before user interacts with stale session
- Prevents "Failed to fetch" errors by preemptively handling them
- Graceful degradation: only redirects on real auth failures, not network blips

**Key code:**
```typescript
await client.session.getToken({ skipCache: true });
```
- Forces fresh token fetch when tab regains focus
- Clerk's internal caching prevents network spam

### 3. Enhanced Global Error Boundary (`src/app/global-error.tsx`)

**What it does:**
- Detects Clerk-specific errors in the global error boundary
- Redirects to `/sign-in` instead of showing generic error page
- Prevents infinite reload loops on auth errors

**Detection patterns:**
- "ClerkJS"
- "Token refresh failed"
- "Failed to fetch" + stack includes "clerk"
- "session_token_invalid"
- "unauthorized" + stack includes "clerk"
- "unauthenticated" + stack includes "clerk"

**Why it helps:**
- Better UX: sends user to login instead of showing cryptic error
- Prevents reload loops that make the problem worse
- Logs auth errors with `isClerkAuthError` flag for analytics

## How It Works Together

**Normal Flow (No Issues):**
1. User leaves tab idle
2. Returns to tab → `AuthRecovery` detects visibility change
3. Silently refreshes Clerk token
4. User continues working normally

**Token Refresh Fails (Network Blip):**
1. User returns to idle tab
2. `AuthRecovery` attempts refresh → fails with network error
3. Error is logged, but NOT redirected (might be temporary)
4. User can still try to use app
5. If they trigger another auth check, normal Clerk error handling takes over

**Session Actually Expired:**
1. User returns to idle tab
2. `AuthRecovery` attempts refresh → fails with "session_token_invalid"
3. Immediately redirects to `/sign-in`
4. Error logged with full context

**Catastrophic Error:**
1. Clerk error bubbles to global error boundary
2. `global-error.tsx` detects it's a Clerk auth error
3. Redirects to `/sign-in` instead of showing error page
4. Logs error with `isClerkAuthError: true`

## Monitoring

Check these in your error tracking system:

1. **AuthRecovery errors:**
   - Error message: "Clerk session recovery failed: ..."
   - Context includes: `errorType: 'clerk_token_refresh_failure'`
   - High severity

2. **Global error boundary auth errors:**
   - Context includes: `isClerkAuthError: true`
   - Check if frequency decreases after deployment

3. **Database queries:**
   ```sql
   SELECT * FROM "ApplicationError"
   WHERE message LIKE '%Clerk session recovery%'
   OR context::text LIKE '%clerk_token_refresh_failure%'
   OR context::text LIKE '%isClerkAuthError":true%'
   ORDER BY "createdAt" DESC;
   ```

## Testing Locally

### Production Build (Recommended)
```bash
npm run build && npm run start
```

1. Sign in to the app
2. Navigate to protected page (e.g., `/app/...`)
3. Leave tab idle for 5+ minutes
4. Switch to another tab
5. Come back to idle tab
6. Click around - should work smoothly

### Force Token Failure (Advanced)
1. Run production build
2. Open DevTools → Network tab
3. Block requests to `*.clerk.*.com`
4. Switch tabs and return
5. Should see error logged and handled gracefully

### Test Error Boundary
Temporarily add to any page:
```tsx
<button onClick={() => {
  throw new Error('ClerkJS: Token refresh failed');
}}>
  Test
</button>
```
Should redirect to `/sign-in` instead of showing error page.

## Related Issues

- [Clerk #1616: Token refresh failed](https://github.com/clerk/javascript/issues/1616)
- [Clerk #4143: Stale auth after sign-in](https://github.com/clerk/javascript/issues/4143)
- [Clerk #4894: Performance regression in Next.js 15](https://github.com/clerk/javascript/issues/4894)
- Next.js 14.0/14.1 aggressive RSC caching (fixed in 14.2+)

## Future Improvements

If issues persist, consider:

1. **Cache `currentUser()` calls** to reduce Clerk API load:
   ```typescript
   import { cache } from 'react'
   export const getCachedUser = cache(currentUser)
   ```

2. **Disable prefetch on protected routes**:
   ```tsx
   <Link href="/dashboard" prefetch={false}>
   ```

3. **Force dynamic rendering** on auth-critical pages:
   ```typescript
   export const dynamic = 'force-dynamic'
   export const revalidate = 0
   ```

## Configuration

No environment variables needed. The fix is entirely code-based.

Clerk env vars already configured:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

## Deployment Notes

- ✅ Zero risk - all changes are additive
- ✅ No breaking changes
- ✅ Uses existing error logging infrastructure
- ✅ Only activates on tab focus or actual errors
- ✅ No impact on normal user flows

## Rollback Plan

If issues occur, simply remove:
1. `__experimental_staleTimes` from `ClerkProvider` in `src/app/layout.tsx`
2. `<AuthRecovery />` component import and usage in `src/app/layout.tsx`
3. Revert `src/app/global-error.tsx` changes

The app will return to previous behavior.
