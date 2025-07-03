// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/platform(.*)",
  "/admin(.*)", // Added protection for all admin routes
  "/test(.*)" // Added protection for all test routes
]);

const isPublicRoute = createRouteMatcher([
  "/api/cron/check-unread-messages"
]);

export default clerkMiddleware((auth, request) => {
  // Skip Clerk auth for public routes (like cron endpoints)
  if (isPublicRoute(request)) return;
  
  if (isProtectedRoute(request)) auth().protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};