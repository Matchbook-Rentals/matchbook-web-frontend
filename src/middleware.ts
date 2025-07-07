// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const isProtectedRoute = createRouteMatcher([
  "/platform(.*)",
  "/admin(.*)", // Added protection for all admin routes
  "/test(.*)" // Added protection for all test routes
]);

const isPublicRoute = createRouteMatcher([
  "/api/cron/check-unread-messages"
]);

const isTermsOrAuthRoute = createRouteMatcher([
  "/terms",
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip Clerk auth for public routes (like cron endpoints)
  if (isPublicRoute(request)) return;

  // Skip terms checking for terms page and auth routes
  if (isTermsOrAuthRoute(request)) {
    if (isProtectedRoute(request)) auth().protect();
    return;
  }

  if (isProtectedRoute(request)) {
    auth().protect();
    console.log('req')

    // Check terms agreement for protected routes
    const { userId, sessionClaims } = auth();
    if (userId) {
      try {
        // First check session metadata (fastest)
        console.log('session', sessionClaims)
        let hasAgreedToTerms = sessionClaims?.metadata?.agreedToTerms || false;

        // If not in session metadata, fallback to database check
        if (!hasAgreedToTerms) {
          const dbUser = await prismadb.user.findUnique({ where: { id: userId } });
          hasAgreedToTerms = dbUser?.agreedToTerms || false;
        }

        if (!hasAgreedToTerms) {
          const termsUrl = new URL("/terms", request.url);
          termsUrl.searchParams.set("redirect_url", request.url);
          return NextResponse.redirect(termsUrl);
        }
      } catch (error) {
        console.error("Error checking terms agreement:", error);
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
