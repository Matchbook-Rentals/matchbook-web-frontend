import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Fetching payment methods for user:', userId);

    // Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      console.log('💳 No Stripe customer found for user');
      return NextResponse.json({ paymentMethods: [] });
    }

    console.log('💳 Fetching payment methods for customer:', user.stripeCustomerId);

    // Fetch both card and bank account payment methods from Stripe
    const [cardMethods, bankMethods] = await Promise.all([
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      }),
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'us_bank_account',
      })
    ]);

    const allPaymentMethods = [...cardMethods.data, ...bankMethods.data];
    console.log('💳 Found payment methods:', allPaymentMethods.length, '(cards:', cardMethods.data.length, ', banks:', bankMethods.data.length, ')');

    // Format payment methods for frontend
    const formattedPaymentMethods = allPaymentMethods.map(pm => {
      if (pm.type === 'card') {
        return {
          id: pm.id,
          type: 'card',
          card: {
            brand: pm.card?.brand || 'card',
            last4: pm.card?.last4 || '****',
            expMonth: pm.card?.exp_month || 1,
            expYear: pm.card?.exp_year || 2025,
          },
          created: pm.created,
        };
      } else if (pm.type === 'us_bank_account') {
        return {
          id: pm.id,
          type: 'us_bank_account',
          us_bank_account: {
            bank_name: pm.us_bank_account?.bank_name || 'Bank',
            last4: pm.us_bank_account?.last4 || '****',
            account_type: pm.us_bank_account?.account_type || 'checking',
          },
          created: pm.created,
        };
      }
      return {
        id: pm.id,
        type: pm.type,
        created: pm.created,
      };
    });

    return NextResponse.json({
      paymentMethods: formattedPaymentMethods,
    });

  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment methods',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}