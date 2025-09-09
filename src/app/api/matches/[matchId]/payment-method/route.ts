import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { createPaymentReceipt } from '@/lib/receipt-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethodId, amount } = await request.json();
    console.log('📝 Request data:', { paymentMethodId, amount, userId });

    // Get the match to find the host's Stripe Connect account
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { user: true }
        },
        trip: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter (trip owner)
    if (match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return NextResponse.json({ error: 'Host must setup Stripe Connect account first' }, { status: 400 });
    }

    // Get user's Stripe customer ID or create one
    console.log('👤 Finding user:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, firstName: true, lastName: true }
    });

    console.log('👤 User found:', { id: userId, hasCustomerId: !!user?.stripeCustomerId });

    if (!user) {
      console.error('👤 User not found in database:', userId);
      return NextResponse.json({ error: 'User not found in database' }, { status: 500 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log('💳 Creating Stripe customer for user:', userId);
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        metadata: {
          userId,
        },
      });
      
      customerId = customer.id;
      console.log('💳 Created Stripe customer:', customerId);
      
      // Update user with Stripe customer ID
      console.log('👤 Updating user with Stripe customer ID');
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Attach payment method to customer
    console.log('🔗 Attaching payment method to customer:', { paymentMethodId, customerId });
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const captureMethod = 'automatic'; // Process payments immediately
    
    // Calculate application fee (3% of base amount)
    const baseAmount = amount;
    const applicationFeeAmount = Math.round(baseAmount * 0.03 * 100); // Convert to cents

    console.log('💳 Payment method type:', paymentMethod.type, 'Capture method:', captureMethod);

    // Create payment intent for authorization with Stripe Connect transfer
    console.log('💰 Creating payment intent with Connect transfer:', { 
      amount: amount * 100, 
      customerId, 
      paymentMethodId,
      hostStripeAccountId: match.listing.user.stripeAccountId,
      captureMethod
    });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      payment_method_types: ['card', 'us_bank_account'],
      capture_method: captureMethod, // Automatic for immediate processing
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/app/rent/match/${params.matchId}/payment-success`,
      transfer_data: {
        destination: match.listing.user.stripeAccountId,
      },
      application_fee_amount: applicationFeeAmount,
      metadata: {
        matchId: params.matchId,
        userId,
        hostUserId: match.listing.userId,
        type: 'lease_deposit_and_rent',
        paymentMethodType: paymentMethod.type,
      },
      receipt_email: match.trip.user?.email || undefined, // Send receipt to user
    });

    console.log('💰 Payment intent created:', { id: paymentIntent.id, status: paymentIntent.status });

    // Save payment method info to the match
    console.log('💾 Updating match with payment info:', params.matchId);
    const updateData: any = {
      stripePaymentMethodId: paymentMethodId,
      stripePaymentIntentId: paymentIntent.id,
      paymentAuthorizedAt: new Date(),
      paymentAmount: amount,
    };

    // Check if payment succeeded immediately (for card payments)
    if (paymentIntent.status === 'succeeded') {
      // Payment succeeded immediately, mark as captured
      updateData.paymentStatus = 'captured';
      updateData.paymentCapturedAt = new Date();
    } else {
      // ACH payments can take 3+ days to settle and can fail during that time
      updateData.paymentStatus = 'authorized';
    }

    await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
    });

    console.log('💾 Match updated successfully');

    // Create booking immediately if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      // Check if booking already exists
      let booking = await prisma.booking.findFirst({
        where: { matchId: params.matchId }
      });

      if (!booking) {
        console.log('📚 Creating booking for match:', params.matchId);
        booking = await prisma.booking.create({
          data: {
            userId: match.trip.userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId: params.matchId,
            startDate: match.trip.startDate,
            endDate: match.trip.endDate,
            totalPrice: paymentIntent.amount,
            monthlyRent: match.monthlyRent,
            status: 'confirmed'
          }
        });

        // Create listing unavailability
        await prisma.listingUnavailability.create({
          data: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            reason: 'Booking',
            listingId: booking.listingId
          }
        });

        console.log('Created booking record:', booking.id);
      }

      // Generate receipt for the tenant
      try {
        const rentDueAtBooking = match.listing.rentDueAtBooking || 77;
        const paymentMethodType = paymentMethod.type;
        
        await createPaymentReceipt({
          userId: match.trip.userId, // Receipt for the tenant
          matchId: params.matchId,
          bookingId: booking.id,
          paymentType: 'reservation',
          rentDueAtBooking,
          paymentMethodType,
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge as string,
          transactionStatus: 'succeeded'
        });
        
        console.log('Generated payment receipt for match:', params.matchId);
      } catch (receiptError) {
        console.error('Error generating receipt:', receiptError);
        // Don't fail the payment if receipt generation fails
      }
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error saving payment method:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to save payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}