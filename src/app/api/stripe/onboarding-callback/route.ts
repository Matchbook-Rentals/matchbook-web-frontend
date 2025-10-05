import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    // Get the redirect URL from query params
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get('redirect_to');
    const accountId = searchParams.get('account_id');
    
    // If user is not authenticated, redirect to sign-in with return URL
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      // Add a flag to help with the redirect flow
      signInUrl.searchParams.set('from_stripe', 'true');
      return NextResponse.redirect(signInUrl);
    }
    
    // Check the account's onboarding status
    let onboardingComplete = false;
    let userAccountId = accountId;
    
    // If no account ID in URL, get it from the user's record
    if (!userAccountId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { stripeAccountId: true },
        });
        userAccountId = user?.stripeAccountId;
      } catch (error) {
        console.error('Error fetching user account ID:', error);
      }
    }
    
    if (userAccountId) {
      try {
        const account = await stripe.accounts.retrieve(userAccountId);
        // Check if there are any outstanding requirements
        onboardingComplete = account.requirements?.currently_due?.length === 0 && 
                           account.requirements?.eventually_due?.length === 0;
      } catch (error) {
        console.error('Error checking account status:', error);
      }
    }
    
    // Validate redirect URL to prevent open redirects
    const validatedRedirectUrl = validateRedirectUrl(redirectTo, request.url);
    
    // Add onboarding status to the redirect URL if possible
    if (validatedRedirectUrl) {
      const finalUrl = new URL(validatedRedirectUrl);
      finalUrl.searchParams.set('onboarding_complete', onboardingComplete.toString());
      return NextResponse.redirect(finalUrl);
    }
    
    // Default fallback to dashboard with onboarding status
    const dashboardUrl = new URL('/app/host/dashboard/overview', request.url);
    dashboardUrl.searchParams.set('onboarding_complete', onboardingComplete.toString());
    return NextResponse.redirect(dashboardUrl);

  } catch (error) {
    console.error('Error in Stripe onboarding callback:', error);
    // Redirect to an error page or dashboard
    return NextResponse.redirect(new URL('/app/host/dashboard/overview?error=onboarding-failed', request.url));
  }
}

// Helper function to validate redirect URLs (prevent open redirects)
function validateRedirectUrl(redirectTo: string | null, baseUrl: string): string | null {
  if (!redirectTo) return null;
  
  try {
    const redirectUrl = new URL(redirectTo, baseUrl);
    const baseUrlObj = new URL(baseUrl);
    
    // Only allow redirects to the same origin
    if (redirectUrl.origin === baseUrlObj.origin) {
      return redirectUrl.toString();
    }
    
    return null;
  } catch {
    // If URL parsing fails, treat it as a relative path
    if (redirectTo.startsWith('/')) {
      return new URL(redirectTo, baseUrl).toString();
    }
    
    return null;
  }
}