// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/platform(.*)",
  "/admin(.*)", // Added protection for all admin routes
  "/test(.*)", // Added protection for all test routes
]);

const isPublicRoute = createRouteMatcher([
  "/api/cron/check-unread-messages"
]);

const isAuthRoute = createRouteMatcher([
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  console.log(`[MIDDLEWARE] ========== PROCESSING REQUEST ==========`);
  console.log(`[MIDDLEWARE] Processing request to: ${request.nextUrl.pathname}`);
  console.log(`[MIDDLEWARE] Full URL: ${request.url}`);
  console.log(`[MIDDLEWARE] Query params:`, Object.fromEntries(request.nextUrl.searchParams.entries()));
  
  // Skip Clerk auth for public routes (like cron endpoints)
  if (isPublicRoute(request)) {
    console.log(`[MIDDLEWARE] Public route, skipping auth`);
    return;
  }

  // Handle terms page - requires auth but no terms check
  if (request.nextUrl.pathname.startsWith('/terms')) {
    console.log(`[MIDDLEWARE] Terms page detected, requiring auth but skipping terms check`);
    auth().protect(); // Still need to be authenticated to access terms
    return; // Skip terms agreement check
  }

  // Skip auth entirely for other auth routes (sign-in, sign-up, etc.)
  if (isAuthRoute(request)) {
    console.log(`[MIDDLEWARE] Auth route detected, skipping all checks`);
    return;
  }

  if (isProtectedRoute(request)) {
    console.log(`[MIDDLEWARE] Protected route detected`);
    auth().protect();

    // Check terms agreement for protected routes
    const { userId, sessionClaims } = auth();
    console.log(`[MIDDLEWARE] User ID: ${userId}`);
    
    if (userId) {
      try {
        // Check if user just agreed to terms (bypass session metadata check)
        const termsJustAgreed = request.nextUrl.searchParams.get('terms_agreed') === 'true';
        console.log(`[MIDDLEWARE] Checking terms_agreed parameter...`);
        console.log(`[MIDDLEWARE] Raw terms_agreed value: "${request.nextUrl.searchParams.get('terms_agreed')}"`);
        console.log(`[MIDDLEWARE] terms_agreed === 'true': ${termsJustAgreed}`);
        
        if (termsJustAgreed) {
          // Remove the parameter and allow access
          const cleanUrl = new URL(request.url);
          cleanUrl.searchParams.delete('terms_agreed');
          console.log(`[MIDDLEWARE] TERMS_AGREED=TRUE DETECTED! Redirecting to clean URL: ${cleanUrl.toString()}`);
          return NextResponse.redirect(cleanUrl);
        }

        // First check session metadata (fastest) - check both metadata and publicMetadata
        let hasAgreedToTerms = sessionClaims?.metadata?.agreedToTerms || sessionClaims?.publicMetadata?.agreedToTerms || false;
        console.log(`[MIDDLEWARE] Session metadata check...`);
        console.log(`[MIDDLEWARE] Has agreed to terms (from session): ${hasAgreedToTerms}`);
        console.log(`[MIDDLEWARE] metadata.agreedToTerms: ${sessionClaims?.metadata?.agreedToTerms}`);
        console.log(`[MIDDLEWARE] publicMetadata.agreedToTerms: ${sessionClaims?.publicMetadata?.agreedToTerms}`);

        // If not in session metadata, check database as fallback
        if (!hasAgreedToTerms) {
          console.log(`[MIDDLEWARE] Session metadata shows no agreement, checking database...`);
          try {
            const checkUrl = new URL('/api/check-terms', request.url);
            checkUrl.searchParams.set('userId', userId);
            
            const response = await fetch(checkUrl.toString());
            const data = await response.json();
            
            if (response.ok && data.hasAgreedToTerms) {
              console.log(`[MIDDLEWARE] Database shows user HAS agreed to terms - allowing access`);
              hasAgreedToTerms = true;
            } else {
              console.log(`[MIDDLEWARE] Database shows user has NOT agreed to terms`);
            }
          } catch (dbError) {
            console.error(`[MIDDLEWARE] Error checking database:`, dbError);
            // Continue with session-only check if DB fails
          }
        }

        if (!hasAgreedToTerms) {
          const termsUrl = new URL("/terms", request.url);
          // Only pass the pathname, not the full URL with query params
          const redirectPath = request.nextUrl.pathname;
          termsUrl.searchParams.set("redirect_url", redirectPath);
          console.log(`[MIDDLEWARE] NO TERMS AGREEMENT! Redirecting to terms: ${termsUrl.toString()}`);
          return NextResponse.redirect(termsUrl);
        }
        
        console.log(`[MIDDLEWARE] USER HAS AGREED TO TERMS - ALLOWING ACCESS`);
      } catch (error) {
        console.error("[MIDDLEWARE] Error checking terms agreement:", error);
      }
    }
  }
  
  console.log(`[MIDDLEWARE] ========== REQUEST ALLOWED TO PROCEED ==========`);
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
