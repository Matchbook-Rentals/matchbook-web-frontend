import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Get the account ID and redirect URL from query params
    const searchParams = request.nextUrl.searchParams;
    let accountId = searchParams.get('account_id');
    const redirectTo = searchParams.get('redirect_to');
    
    // If no account ID in URL, get it from the user's record
    if (!accountId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { stripeAccountId: true },
        });
        accountId = user?.stripeAccountId;
      } catch (error) {
        console.error('Error fetching user account ID:', error);
      }
    }
    
    if (!accountId) {
      return NextResponse.redirect(new URL('/dashboard?error=missing-account', request.url));
    }
    
    // Create new account link with same parameters
    const callbackUrl = new URL('/api/stripe/onboarding-callback', request.url.origin);
    callbackUrl.searchParams.set('redirect_to', redirectTo || '/dashboard');
    callbackUrl.searchParams.set('account_id', accountId);
    
    const refreshUrl = new URL('/api/stripe/onboarding-refresh', request.url.origin);
    refreshUrl.searchParams.set('account_id', accountId);
    refreshUrl.searchParams.set('redirect_to', redirectTo || '/dashboard');
    
    const linkResponse = await fetch(`${request.url.origin}/api/payment/account-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: accountId,
        returnUrl: callbackUrl.toString(),
        refreshUrl: refreshUrl.toString()
      }),
    });
    
    const linkData = await linkResponse.json();
    
    if (linkData.url) {
      // Redirect to new account link
      return NextResponse.redirect(linkData.url);
    } else {
      console.error('Error creating new account link:', linkData.error);
      return NextResponse.redirect(new URL('/dashboard?error=refresh-failed', request.url));
    }
    
  } catch (error) {
    console.error('Error in Stripe onboarding refresh:', error);
    return NextResponse.redirect(new URL('/dashboard?error=refresh-failed', request.url));
  }
}