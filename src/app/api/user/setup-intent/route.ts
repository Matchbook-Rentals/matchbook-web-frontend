import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  console.log('🎯 [SetupIntent API] Request received');
  
  try {
    const { userId } = auth();
    if (!userId) {
      console.error('❌ [SetupIntent API] No userId in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 [SetupIntent API] Creating setup intent for user:', userId);

    // Get or create Stripe customer for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeCustomerId: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
      }
    });

    console.log('👤 [SetupIntent API] User data:', {
      found: !!user,
      hasStripeCustomerId: !!user?.stripeCustomerId,
      email: user?.email,
      fullName: user?.fullName,
    });

    if (!user) {
      console.error('❌ [SetupIntent API] User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      console.log('🕳 [SetupIntent API] No Stripe customer exists, creating new one...');
      
      try {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.fullName || undefined,
          metadata: {
            userId: userId,
          },
        });

        console.log('📦 [SetupIntent API] Stripe customer created:', {
          customerId: customer.id,
          email: customer.email,
        });

        // Save the Stripe customer ID to the user
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        });

        stripeCustomerId = customer.id;
        console.log('✅ [SetupIntent API] Customer saved to database');
      } catch (customerError) {
        console.error('💥 [SetupIntent API] Failed to create Stripe customer:', customerError);
        throw customerError;
      }
    } else {
      console.log('🆗 [SetupIntent API] Using existing Stripe customer:', stripeCustomerId);
    }

    // Create a SetupIntent for saving a payment method
    console.log('🎯 [SetupIntent API] Creating SetupIntent with params:', {
      customer: stripeCustomerId,
      payment_method_types: ['card', 'us_bank_account'],
      usage: 'off_session',
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'us_bank_account'],
      usage: 'off_session', // Allow charging the payment method later
      metadata: {
        userId,
        type: 'add_payment_method',
      },
    });
    
    console.log('✅ [SetupIntent API] SetupIntent created successfully:', {
      id: setupIntent.id,
      status: setupIntent.status,
      customer: setupIntent.customer,
      payment_method_types: setupIntent.payment_method_types,
      client_secret_exists: !!setupIntent.client_secret,
    });

    const response = {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };

    console.log('📤 [SetupIntent API] Sending response to client');
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 [SetupIntent API] Error creating setup intent:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create setup intent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
