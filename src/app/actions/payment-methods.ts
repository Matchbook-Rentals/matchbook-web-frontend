'use server';

import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  lastFour: string;
  expiry?: string;
  bankName?: string;
}

export async function getUserPaymentMethods(): Promise<{ 
  success: boolean; 
  paymentMethods?: PaymentMethod[]; 
  error?: string 
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return { success: true, paymentMethods: [] };
    }

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

    // Format payment methods for frontend
    const formattedPaymentMethods: PaymentMethod[] = allPaymentMethods.map(pm => {
      if (pm.type === 'card') {
        return {
          id: pm.id,
          type: 'card' as const,
          brand: pm.card?.brand || 'card',
          lastFour: pm.card?.last4 || '****',
          expiry: `${String(pm.card?.exp_month || 1).padStart(2, '0')}/${pm.card?.exp_year || 2025}`,
        };
      } else if (pm.type === 'us_bank_account') {
        return {
          id: pm.id,
          type: 'bank' as const,
          bankName: pm.us_bank_account?.bank_name || 'Bank',
          lastFour: pm.us_bank_account?.last4 || '****',
        };
      }
      return {
        id: pm.id,
        type: 'card' as const,
        lastFour: '****',
      };
    }).filter(Boolean);

    return {
      success: true,
      paymentMethods: formattedPaymentMethods,
    };

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return {
      success: false,
      error: 'Failed to fetch payment methods',
    };
  }
}