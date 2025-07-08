// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Roles } from "@/types/globals";

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

// Role-based access control functions
const checkBetaAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview';
};

const checkHostAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview';
};

const checkAdminAccess = (userRole?: string) => {
  return userRole === 'admin';
};

const checkPreviewAccess = (userRole?: string) => {
  return userRole === 'preview';
};

// Route-specific access control
const checkRouteAccess = (pathname: string, userRole?: string): boolean => {
  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    return checkAdminAccess(userRole);
  }

  // Beta access required routes
  const betaRoutes = [
    '/platform/host/dashboard/listings',
    '/platform/host/dashboard/applications', 
    '/platform/host/dashboard/bookings',
    '/platform/trips',
    '/platform/bookings'
  ];
  
  for (const route of betaRoutes) {
    if (pathname.startsWith(route)) {
      return checkBetaAccess(userRole);
    }
  }

  // Messages routes with beta access
  if (pathname.startsWith('/platform/messages')) {
    return checkBetaAccess(userRole);
  }

  // Host access required routes
  const hostRoutes = [
    '/platform/host/dashboard/listings'
  ];
  
  for (const route of hostRoutes) {
    if (pathname.startsWith(route)) {
      return checkHostAccess(userRole);
    }
  }

  // Routes requiring admin OR preview access
  const adminOrPreviewRoutes = [
    '/platform/application',
    '/platform/verification'
  ];
  
  for (const route of adminOrPreviewRoutes) {
    if (pathname.startsWith(route)) {
      return checkAdminAccess(userRole) || checkPreviewAccess(userRole);
    }
  }

  // Default: allow access to other routes
  return true;
};

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
        
        console.log(`[MIDDLEWARE] USER HAS AGREED TO TERMS - PROCEEDING TO RBAC CHECK`);
        
        // Role-based access control check
        const userRole = sessionClaims?.metadata?.role as Roles | undefined;
        console.log(`[MIDDLEWARE] User role: ${userRole}`);
        
        const hasRouteAccess = checkRouteAccess(request.nextUrl.pathname, userRole);
        console.log(`[MIDDLEWARE] Route access check for ${request.nextUrl.pathname}: ${hasRouteAccess}`);
        
        if (!hasRouteAccess) {
          console.log(`[MIDDLEWARE] ACCESS DENIED - User lacks required role for this route`);
          // Redirect to unauthorized page
          const unauthorizedUrl = new URL("/unauthorized", request.url);
          return NextResponse.redirect(unauthorizedUrl);
        }
        
        console.log(`[MIDDLEWARE] RBAC CHECK PASSED - ALLOWING ACCESS`);
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
