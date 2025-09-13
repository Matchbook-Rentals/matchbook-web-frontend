import { NextRequest, NextResponse } from 'next/server';
import stripe from "@/lib/stripe";
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeAccountId: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Get additional user info from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    let accountId = user?.stripeAccountId;

    // Create Stripe account if needed
    if (!accountId) {
      // Prepare account data with prefilled information
      const accountData: any = {
        type: 'standard',
        email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
      };

      // Add business profile if we have the info
      if (user?.firstName || user?.lastName || clerkUser.firstName || clerkUser.lastName) {
        accountData.business_profile = {
          name: `${user?.firstName || clerkUser.firstName || ''} ${user?.lastName || clerkUser.lastName || ''}`.trim(),
          url: request.nextUrl.origin, // Use our site as the business URL
        };
      }

      // Add individual information for prefilling
      if (user?.firstName || user?.lastName || clerkUser.firstName || clerkUser.lastName) {
        accountData.individual = {
          first_name: user?.firstName || clerkUser.firstName,
          last_name: user?.lastName || clerkUser.lastName,
          email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
        };
      }

      const account = await stripe.accounts.create(accountData);
      
      // Save account ID to database
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: account.id }
      });
      
      accountId = account.id;
    } else {
      // If account exists but onboarding incomplete, try to update with latest user info
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        
        // Only update if details haven't been submitted yet
        if (!existingAccount.details_submitted) {
          await stripe.accounts.update(accountId, {
            email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
            business_profile: {
              name: `${user?.firstName || clerkUser.firstName || ''} ${user?.lastName || clerkUser.lastName || ''}`.trim(),
              url: request.nextUrl.origin,
            },
            individual: {
              first_name: user?.firstName || clerkUser.firstName,
              last_name: user?.lastName || clerkUser.lastName,
              email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
            }
          });
        }
      } catch (updateError) {
        // If update fails (e.g., account already has some info), continue anyway
        console.log('Could not update existing account with prefilled data:', updateError);
      }
    }

    // Create account link for onboarding
    const callbackUrl = new URL('/stripe-callback', request.nextUrl.origin);
    callbackUrl.searchParams.set('redirect_to', '/app/host/dashboard/overview');
    callbackUrl.searchParams.set('account_id', accountId);
    
    const refreshUrl = new URL('/stripe-callback', request.nextUrl.origin);
    refreshUrl.searchParams.set('redirect_to', '/app/host/dashboard/overview');
    refreshUrl.searchParams.set('account_id', accountId);
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl.toString(),
      return_url: callbackUrl.toString(),
      type: "account_onboarding",
      collection_options: {
        fields: 'eventually_due',
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe account or link:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}