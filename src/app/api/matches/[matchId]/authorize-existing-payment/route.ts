import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

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

    // Get the match with existing payment method info
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        trip: { include: { user: true } },
        listing: { include: { user: true } }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter
    if (match.trip.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return NextResponse.json({ error: 'Host must setup Stripe Connect account first' }, { status: 400 });
    }

    // Check if payment method exists
    if (!match.stripePaymentMethodId) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    // Check if already authorized
    if (match.paymentAuthorizedAt) {
      return NextResponse.json({ error: 'Payment already authorized' }, { status: 400 });
    }

    // Get the user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Get payment method details to determine capture method
    const paymentMethod = await stripe.paymentMethods.retrieve(match.stripePaymentMethodId);
    const isBankAccount = paymentMethod.type === 'us_bank_account';
    const captureMethod = isBankAccount ? 'automatic' : 'manual';

    console.log('💳 Existing payment method type:', paymentMethod.type, 'Capture method:', captureMethod);

    // Create payment intent for authorization with Stripe Connect transfer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: match.stripePaymentMethodId,
      payment_method_types: ['card', 'us_bank_account'],
      capture_method: captureMethod, // Automatic for bank accounts, manual for cards
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/platform/match/${params.matchId}/payment-success`,
      transfer_data: {
        destination: match.listing.user.stripeAccountId,
      },
      metadata: {
        matchId: params.matchId,
        userId,
        hostUserId: match.listing.userId,
        type: 'lease_deposit_and_rent_existing',
        paymentMethodType: paymentMethod.type,
      },
      receipt_email: match.trip.user?.email || undefined, // Send receipt to user
    });

    // Update match with authorization info
    const updateData: any = {
      stripePaymentIntentId: paymentIntent.id,
      paymentAuthorizedAt: new Date(),
      paymentAmount: amount,
    };

    // If bank account (automatic capture), mark as captured immediately
    if (isBankAccount && paymentIntent.status === 'succeeded') {
      updateData.paymentCapturedAt = new Date();
      updateData.paymentStatus = 'captured';
    } else {
      updateData.paymentStatus = 'authorized';
    }

    await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
    });

    // Check if lease is fully signed and create booking if so
    const matchWithLease = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        BoldSignLease: true,
        booking: true,
        trip: true
      }
    });

    // If both parties have signed and no booking exists, create one
    if (matchWithLease?.BoldSignLease?.landlordSigned && 
        matchWithLease?.BoldSignLease?.tenantSigned && 
        !matchWithLease.booking) {
      
      console.log('Payment authorized and lease fully signed - creating booking');
      
      try {
        const booking = await prisma.booking.create({
          data: {
            userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId: params.matchId,
            startDate: match.trip.startDate!,
            endDate: match.trip.endDate!,
            monthlyRent: match.monthlyRent,
            status: 'confirmed'
          }
        });

        console.log('✅ Booking created successfully:', booking.id);
      } catch (bookingError) {
        console.error('❌ Failed to create booking:', bookingError);
        // Don't fail the payment authorization if booking creation fails
      }
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: amount,
    });
  } catch (error) {
    console.error('Error authorizing existing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to authorize payment method' },
      { status: 500 }
    );
  }
}