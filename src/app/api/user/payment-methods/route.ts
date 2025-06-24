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

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    console.log('💳 Found payment methods:', paymentMethods.data.length);

    // Format payment methods for frontend
    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      card: {
        brand: pm.card?.brand || 'card',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month || 1,
        expYear: pm.card?.exp_year || 2025,
      },
      created: pm.created,
    }));

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