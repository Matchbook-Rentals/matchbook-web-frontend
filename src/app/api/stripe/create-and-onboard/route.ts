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

    // VALIDATION: User must exist in database
    if (!user) {
      console.error(`User ${userId} not found in database`);
      return NextResponse.json({
        error: 'User not found in database. Please contact support.',
        errorCode: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Get additional user info from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    let accountId = user.stripeAccountId;

    // Create Stripe account if needed
    if (!accountId) {
      const userEmail = user.email || clerkUser.emailAddresses[0]?.emailAddress;

      if (!userEmail) {
        return NextResponse.json({
          error: 'Email address is required to create Stripe account',
          errorCode: 'EMAIL_REQUIRED'
        }, { status: 400 });
      }

      // IDEMPOTENCY CHECK: Look for existing Stripe accounts with this email
      try {
        const existingAccounts = await stripe.accounts.list({
          limit: 10
        });

        const accountWithEmail = existingAccounts.data.find(
          acc => acc.email?.toLowerCase() === userEmail.toLowerCase()
        );

        if (accountWithEmail) {
          console.log(`Found existing Stripe account for ${userEmail}: ${accountWithEmail.id}`);

          // Link this existing account to the user
          await prisma.user.update({
            where: { id: userId },
            data: { stripeAccountId: accountWithEmail.id }
          });

          accountId = accountWithEmail.id;
          console.log(`Linked existing account ${accountWithEmail.id} to user ${userId}`);
        }
      } catch (lookupError) {
        console.error('Error checking for existing accounts:', lookupError);
        // Continue to create new account if lookup fails
      }

      // Create new account only if no existing account was found
      if (!accountId) {
        // Prefill for Express accounts - they'll see and can confirm/edit during onboarding
        const accountData: any = {
          type: 'express', // Express account for simpler onboarding
          business_type: 'individual', // Auto-assume individual account
          email: userEmail,
          business_profile: {
            mcc: '6513', // Real Estate Agents and Managers - Rentals
            product_description: 'Property rental and management services',
          },
          capabilities: {
            transfers: { requested: true },
          }
        };

        // Prefill individual info - they'll see this during onboarding and can edit if needed
        if (user.firstName || user.lastName || clerkUser.firstName || clerkUser.lastName) {
          accountData.individual = {
            first_name: user.firstName || clerkUser.firstName,
            last_name: user.lastName || clerkUser.lastName,
            email: userEmail,
          };
        }

        let createdAccount;
        try {
          // Create Stripe account
          createdAccount = await stripe.accounts.create(accountData);
          console.log(`Created Stripe account: ${createdAccount.id} for user ${userId}`);

          // Save account ID to database (TRANSACTION/ROLLBACK pattern)
          await prisma.user.update({
            where: { id: userId },
            data: { stripeAccountId: createdAccount.id }
          });

          accountId = createdAccount.id;
          console.log(`Successfully saved account ${createdAccount.id} to database for user ${userId}`);

        } catch (dbError) {
          // ROLLBACK: If database save fails, delete the Stripe account
          if (createdAccount) {
            console.error(`Database save failed for account ${createdAccount.id}, rolling back...`);
            try {
              await stripe.accounts.del(createdAccount.id);
              console.log(`Successfully deleted Stripe account ${createdAccount.id} after DB failure`);
            } catch (deleteError) {
              console.error(`CRITICAL: Failed to delete Stripe account ${createdAccount.id} after DB failure:`, deleteError);
              // Log this for manual cleanup
            }
          }

          throw new Error(`Failed to save Stripe account to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      }
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
