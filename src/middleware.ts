// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

const isProtectedRoute = createRouteMatcher(["/platform(.*)"]);
const isTermsPage = createRouteMatcher(["/terms"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = auth();
  
  // Protect platform routes - must be authenticated
  if (isProtectedRoute(request)) {
    auth().protect();
    
    // If authenticated, check if user has agreed to terms
    if (userId) {
      // Skip terms check for the terms page itself
      if (isTermsPage(request)) {
        return NextResponse.next();
      }
      
      try {
        // Check if user has agreed to terms
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { agreedToTerms: true }
        });
        
        // If user hasn't agreed to terms, redirect to terms page
        if (!user?.agreedToTerms) {
          const url = new URL("/terms", request.url);
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error("Error checking terms agreement:", error);
        // Continue anyway to prevent blocking users in case of database errors
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
