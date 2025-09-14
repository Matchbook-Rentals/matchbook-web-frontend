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
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev';
};

const checkHostAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev';
};

const checkAdminAccess = (userRole?: string) => {
  return userRole?.includes('admin') || false;
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

  // Host routes are now open to all users
  // No longer requiring host-beta access
  // if (pathname.startsWith('/app/host')) {
  //   return checkHostAccess(userRole);
  // }

  // Admin-only routes during MX period - entire rent section temporarily restricted
  if (pathname.startsWith('/app/rent')) {
    return checkAdminAccess(userRole);
  }

  // TODO: Restore these beta access routes after MX period
  // Routes requiring admin OR preview access
  // const adminOrPreviewRoutes = [
  //   '/app/rent/application',
  //   '/app/rent/verification'
  // ];
  // 
  // for (const route of adminOrPreviewRoutes) {
  //   if (pathname.startsWith(route)) {
  //     return checkAdminAccess(userRole) || checkPreviewAccess(userRole);
  //   }
  // }


  // Default: allow access to other routes
  return true;
};

export default clerkMiddleware(async (auth, request) => {
  
  // Skip Clerk auth for public routes (like cron endpoints)
  if (isPublicRoute(request)) {
    return;
  }

  // Skip auth entirely for auth routes (sign-in, sign-up, etc.)
  if (isAuthRoute(request)) {
    return;
  }

  if (isProtectedRoute(request)) {
    auth().protect();

    // Role-based access control check
    const { sessionClaims } = auth();
    const userRole = sessionClaims?.metadata?.role as Roles | undefined;
    
    const hasRouteAccess = checkRouteAccess(request.nextUrl.pathname, userRole);
    
    if (!hasRouteAccess) {
      // Redirect to unauthorized page
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
