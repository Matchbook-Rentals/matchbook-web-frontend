import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { account, locale } = body;

    if (!account) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Retrieve the account to check its configuration
    const stripeAccount = await stripe.accounts.retrieve(account);

    const isCustom =
      stripeAccount?.controller?.stripe_dashboard?.type === 'none' &&
      stripeAccount?.controller?.losses?.payments === 'application' &&
      stripeAccount?.controller?.requirement_collection === 'application';

    // Check if account has issuing and treasury capabilities for advanced components
    const hasIssuingAndTreasury = ['card_issuing', 'treasury'].every(
      (capability) =>
        Object.keys(stripeAccount?.capabilities || []).includes(capability)
    );

    const issuingAndTreasuryComponents = {
      issuing_card: {
        enabled: true,
        features: {
          card_management: true,
          cardholder_management: true,
          card_spend_dispute_management: true,
          spend_control_management: true,
        },
      },
      issuing_cards_list: {
        enabled: true,
        features: {
          card_management: true,
          cardholder_management: true,
          card_spend_dispute_management: true,
          spend_control_management: true,
          disable_stripe_user_authentication: isCustom,
        },
      },
      financial_account: {
        enabled: true,
        features: {
          send_money: true,
          transfer_balance: true,
          disable_stripe_user_authentication: isCustom,
        },
      },
      financial_account_transactions: {
        enabled: true,
        features: {
          card_spend_dispute_management: true,
        },
      },
    };

    const accountSession = await stripe.accountSessions.create({
      account,
      components: {
        // Core payment components - these should definitely work
        payments: {
          enabled: true,
        },
        payouts: {
          enabled: true,
        },
        // Connect components
        account_management: {
          enabled: true,
        },
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
        notification_banner: {
          enabled: true,
        },
      },
    });

    return NextResponse.json({ 
      client_secret: accountSession.client_secret,
      account_id: account,
      capabilities: Object.keys(stripeAccount?.capabilities || {}),
    });
  } catch (error) {
    console.error(
      "An error occurred when calling the Stripe API to create an account session",
      error
    );
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}