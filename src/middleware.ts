// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Roles } from "@/types/globals";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
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

  // Host access required routes (check before general app beta check)
  if (pathname.startsWith('/app/host')) {
    return checkHostAccess(userRole);
  }

  // Beta access required routes - all app routes except host
  if (pathname.startsWith('/app')) {
    return checkBetaAccess(userRole);
  }

  // Routes requiring admin OR preview access
  const adminOrPreviewRoutes = [
    '/app/rent/application',
    '/app/rent/verification'
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
  
  // Skip Clerk auth for public routes (like cron endpoints)
  if (isPublicRoute(request)) {
    return;
  }

  // Handle terms page - requires auth but no terms check
  if (request.nextUrl.pathname.startsWith('/terms')) {
    auth().protect(); // Still need to be authenticated to access terms
    return; // Skip terms agreement check
  }

  // Skip auth entirely for other auth routes (sign-in, sign-up, etc.)
  if (isAuthRoute(request)) {
    return;
  }

  if (isProtectedRoute(request)) {
    auth().protect();

    // Check terms agreement for protected routes
    const { userId, sessionClaims } = auth();
    
    if (userId) {
      try {
        // Check if user just agreed to terms (bypass session metadata check)
        const termsJustAgreed = request.nextUrl.searchParams.get('terms_agreed') === 'true';
        
        if (termsJustAgreed) {
          // Remove the parameter and allow access
          const cleanUrl = new URL(request.url);
          cleanUrl.searchParams.delete('terms_agreed');
          return NextResponse.redirect(cleanUrl);
        }

        // First check session metadata (fastest) - check both metadata and publicMetadata
        let hasAgreedToTerms = sessionClaims?.metadata?.agreedToTerms || sessionClaims?.publicMetadata?.agreedToTerms || false;

        // If not in session metadata, check database as fallback
        if (!hasAgreedToTerms) {
          try {
            const checkUrl = new URL('/api/check-terms', request.url);
            checkUrl.searchParams.set('userId', userId);
            
            const response = await fetch(checkUrl.toString());
            const data = await response.json();
            
            if (response.ok && data.hasAgreedToTerms) {
              hasAgreedToTerms = true;
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
          return NextResponse.redirect(termsUrl);
        }
        
        // Role-based access control check
        const userRole = sessionClaims?.metadata?.role as Roles | undefined;
        
        const hasRouteAccess = checkRouteAccess(request.nextUrl.pathname, userRole);
        
        if (!hasRouteAccess) {
          // Redirect to unauthorized page
          const unauthorizedUrl = new URL("/unauthorized", request.url);
          return NextResponse.redirect(unauthorizedUrl);
        }
      } catch (error) {
        console.error("[MIDDLEWARE] Error checking terms agreement:", error);
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
