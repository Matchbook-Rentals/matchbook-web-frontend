import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { paymentMethodId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethodId } = params;
    
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    console.log('🗑️ Deleting payment method:', paymentMethodId, 'for user:', userId);

    // Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'User has no Stripe customer ID' }, { status: 400 });
    }

    // First, verify that this payment method belongs to the user
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.customer !== user.stripeCustomerId) {
        console.log('⚠️ Payment method does not belong to user');
        return NextResponse.json({ error: 'Payment method not found or unauthorized' }, { status: 403 });
      }
    } catch (error) {
      console.log('⚠️ Payment method not found:', error);
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Check if this payment method is currently being used in any active matches
    const activeMatches = await prisma.match.findMany({
      where: {
        stripePaymentMethodId: paymentMethodId,
        OR: [
          { paymentCapturedAt: null }, // Payment not yet captured
          { 
            AND: [
              { paymentAuthorizedAt: { not: null } },
              { paymentCapturedAt: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        listing: {
          select: {
            locationString: true
          }
        }
      }
    });

    if (activeMatches.length > 0) {
      const locations = activeMatches.map(match => match.listing.locationString).join(', ');
      return NextResponse.json({ 
        error: 'Cannot delete payment method', 
        details: `This payment method is currently being used for active bookings: ${locations}. Please wait for these bookings to complete or use a different payment method.`
      }, { status: 400 });
    }

    // Detach payment method from customer in Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    console.log('✅ Payment method deleted successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Payment method deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting payment method:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}