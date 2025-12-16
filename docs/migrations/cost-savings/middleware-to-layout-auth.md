# Middleware to Layout Auth Migration

## Problem

Clerk middleware was running on every matched request, costing ~$0.80/month with minimal traffic. The broad matcher pattern triggered edge function invocations on:
- Every page navigation
- Next.js prefetches
- Bot/crawler traffic
- All API routes

```typescript
// Old matcher - runs on almost everything
matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
```

## Solution

Move authentication checks from middleware to Next.js layouts. Layout auth only runs on actual page renders, not prefetches or bot traffic.

### Middleware vs Layout Auth

| Aspect | Middleware | Layout `auth()` |
|--------|------------|-----------------|
| Runs on | Every matched request | Only actual page renders |
| Cost | Edge function per request | Part of normal SSR |
| Redirect timing | Before any page code | Before render completes |

## Migration Plan

### Phase 1: Audit existing layout auth
Routes that already have layout-level auth checks:
- `/admin/*` - `checkAdminAccess()` in `src/app/admin/layout.tsx`
- `/manage/*` - `checkAdminAccess()` in `src/app/manage/layout.tsx`

Routes missing layout auth:
- `/app/*` - No root layout auth (only nested layouts)
- `/test/*` - Unknown

### Phase 2: Remove middleware for routes with existing layout auth
1. Remove `/manage(.*)` from middleware `isProtectedRoute` matcher
2. Test auth still works (logged out redirect, role checks)
3. Remove `/admin(.*)` from middleware
4. Test again

### Phase 3: Add layout auth to remaining routes
1. Create `src/app/app/layout.tsx` with basic auth check:
   ```typescript
   import { auth } from "@clerk/nextjs/server";
   import { redirect } from "next/navigation";

   export default async function AppLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     const { userId } = await auth();

     if (!userId) {
       redirect("/sign-in");
     }

     return <>{children}</>;
   }
   ```
2. Test `/app` routes work correctly
3. Remove `/app(.*)` from middleware

### Phase 4: Handle remaining routes
1. Audit `/test/*` routes - add layout auth or remove from middleware
2. Consider removing middleware entirely or keeping minimal for edge cases

## Current Status

**Phase 2 - Step 1 Complete**

`/manage` has been removed from middleware protection (commented out in `src/middleware.ts`).

### Testing Checklist for /manage

- [ ] Visit `/manage` while logged in as admin - should work
- [ ] Visit `/manage` while logged out - should redirect to `/unauthorized`
- [ ] Visit `/manage` as non-admin user - should redirect to `/unauthorized`

### Next Steps

1. Complete testing of `/manage` routes
2. If successful, remove `/admin(.*)` from middleware
3. Create `/app/app/layout.tsx` with auth check
4. Remove `/app(.*)` from middleware
5. Monitor Vercel costs to verify savings

## Files Modified

- `src/middleware.ts` - Commented out `/manage(.*)` from `isProtectedRoute`

## Rollback

If issues arise, uncomment the `/manage(.*)` line in `src/middleware.ts`:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/admin(.*)",
  "/manage(.*)", // Uncomment to restore middleware protection
  "/test(.*)",
]);
```
