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
      // Prefill for Express accounts - they'll see and can confirm/edit during onboarding
      const accountData: any = {
        type: 'express', // Express account for simpler onboarding
        business_type: 'individual', // Auto-assume individual account
        email: user?.email || clerkUser.emailAddresses[0]?.emailAddress,
        business_profile: {
          mcc: '6513', // Real Estate Agents and Managers - Rentals
          product_description: 'Property rental and management services',
        }
      };

      // Prefill individual info - they'll see this during onboarding and can edit if needed
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
    }
    // Note: For Express accounts, we can't update KYC info after the first Account Link is created
    // So we skip any update attempts for existing accounts

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
        fields: 'currently_due', // Minimum required fields for faster onboarding
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
