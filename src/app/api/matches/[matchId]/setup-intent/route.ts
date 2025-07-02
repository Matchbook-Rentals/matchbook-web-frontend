import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    console.log('🔧 Creating setup intent with sandbox keys');
    const setupIntent = await stripe.setupIntents.create({
      customer: undefined, // Will be created when payment method is saved
      payment_method_types: ['card', 'us_bank_account'],
      usage: 'off_session',
      metadata: {
        matchId: params.matchId,
        userId,
        amount: amount.toString(),
        type: 'lease_payment_authorization',
      },
    });
    
    console.log('✅ Setup intent created:', {
      id: setupIntent.id,
      status: setupIntent.status,
      client_secret: setupIntent.client_secret?.substring(0, 20) + '...'
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}