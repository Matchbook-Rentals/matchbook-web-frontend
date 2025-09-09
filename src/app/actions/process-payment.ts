'use server';

import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';
import { reverseCalculateBaseAmount } from '@/lib/fee-constants';

interface ProcessPaymentParams {
  matchId: string;
  paymentMethodId: string;
  amount: number;
  includeCardFee: boolean;
}

export async function processDirectPayment({
  matchId,
  paymentMethodId,
  amount,
  includeCardFee
}: ProcessPaymentParams): Promise<{
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the match with all necessary relations
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: { include: { user: true } },
        listing: { include: { user: true } }
      }
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    // Verify the user is the renter
    if (match.trip.userId !== userId) {
      return { success: false, error: 'Unauthorized - not renter' };
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return { success: false, error: 'Host must setup Stripe Connect account first' };
    }

    // Check if already authorized
    if (match.paymentAuthorizedAt) {
      return { success: false, error: 'Payment already authorized' };
    }

    // Get the user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeCustomerId: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    let customerId = user?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log('💳 Creating Stripe customer for user:', userId);
      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
        metadata: {
          userId,
        },
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get payment method details to determine type
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const isBankAccount = paymentMethod.type === 'us_bank_account';

    // Attach payment method to customer if not already attached
    if (paymentMethod.customer !== customerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    }

    /**
     * Payment Amount Calculation:
     * 
     * The 'amount' parameter already includes Stripe's credit card fee if applicable.
     * This is calculated on the client using the inclusive formula:
     *   totalAmount = (baseAmount + 0.30) / (1 - 0.029)
     * 
     * This ensures that after Stripe deducts their 2.9% + $0.30 fee,
     * we receive the exact amount we intended (deposits + transfer fee).
     * 
     * Example:
     *   Base amount (deposits + $5 transfer): $227
     *   Total charged to card: $234.11
     *   Stripe fee (2.9% + $0.30): $7.11
     *   Amount we receive: $227 ✓
     */
    const totalAmount = Math.round(amount * 100); // Convert to cents
    
    let baseAmountBeforeCardFee = totalAmount;
    let cardProcessingFee = 0;
    
    if (isCard && includeCardFee) {
      // Extract the base amount from the total that includes Stripe fees
      // Using our centralized reverse calculation function
      baseAmountBeforeCardFee = Math.round(reverseCalculateBaseAmount(amount) * 100); // Convert to cents
      cardProcessingFee = totalAmount - baseAmountBeforeCardFee;
    }
    
    /**
     * Fee Structure:
     * 
     * TRANSFER FEE: Fixed $5 for all deposit transactions
     *   - MatchBook keeps this fee
     *   - Landlord receives: deposits - $5
     * 
     * CREDIT CARD FEE: Stripe's 2.9% + $0.30 (if using card)
     *   - Paid by the tenant on top of the base amount
     *   - Goes directly to Stripe for processing
     * 
     * NO RENT COLLECTED: This transaction is for deposits only
     *   - Rent payments are scheduled separately
     *   - Service fees (3% or 1.5%) apply to rent, not deposits
     */
    const TRANSFER_FEE_CENTS = 500; // $5 in cents
    
    // Landlord receives the deposit amount minus our $5 transfer fee
    const landlordAmount = baseAmountBeforeCardFee - TRANSFER_FEE_CENTS;

    console.log('💰 Payment calculation:', {
      baseAmountBeforeCardFee: baseAmountBeforeCardFee / 100,
      transferFee: TRANSFER_FEE_CENTS / 100,
      cardProcessingFee: cardProcessingFee / 100,
      totalAmount: totalAmount / 100,
      landlordAmount: landlordAmount / 100,
      paymentMethodType: paymentMethod.type,
      includeCardFee
    });

    // Create payment intent with automatic confirmation and capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Total amount including any card fees
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      payment_method_types: isCard ? ['card'] : isBankAccount ? ['us_bank_account'] : ['card', 'us_bank_account'],
      capture_method: 'automatic', // Automatic capture for all payment types - charge immediately
      confirm: true, // Automatically confirm the payment
      return_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/app/rent/match/${matchId}/payment-success`,
      transfer_data: {
        destination: match.listing.user.stripeAccountId,
        amount: landlordAmount, // Transfer only the landlord's portion
      },
      metadata: {
        matchId,
        userId,
        hostUserId: match.listing.userId,
        type: 'security_deposit_direct',
        paymentMethodType: paymentMethod.type,
        transferFee: (TRANSFER_FEE_CENTS / 100).toString(),
        cardProcessingFee: (cardProcessingFee / 100).toString(),
        landlordAmount: (landlordAmount / 100).toString(),
        totalAmount: (totalAmount / 100).toString(),
      },
      receipt_email: match.trip.user?.email || undefined,
    });

    // Update match with payment information
    const updateData: any = {
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentMethodId: paymentMethodId,
      paymentAuthorizedAt: new Date(),
      paymentAmount: totalAmount / 100, // Store in dollars
    };

    // Since we're using automatic capture for all payment types, mark as captured if succeeded
    console.log('💳 Payment Intent Status:', paymentIntent.status);
    
    if (paymentIntent.status === 'succeeded') {
      updateData.paymentCapturedAt = new Date();
      updateData.paymentStatus = 'captured';
      console.log('✅ Payment succeeded - marking as captured');
    } else if (paymentIntent.status === 'processing') {
      // Payment is still processing (common for bank transfers)
      // For ACH payments, we consider them "captured" even while processing
      updateData.paymentCapturedAt = new Date(); // Set this for ACH payments too!
      updateData.paymentStatus = 'processing';
      console.log('⏳ Payment processing (ACH) - marking capture time for booking creation');
    } else {
      // In case of any other status
      updateData.paymentStatus = 'authorized';
      console.log('⚠️ Payment status:', paymentIntent.status, '- marked as authorized only');
    }

    console.log('📝 Updating match with payment data:', {
      matchId,
      paymentStatus: updateData.paymentStatus,
      hasCapturedAt: !!updateData.paymentCapturedAt,
      paymentIntentId: updateData.stripePaymentIntentId
    });
    
    await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    // Check if lease is fully signed and create booking if so
    console.log('🔍 Checking lease status for booking creation...');
    const matchWithLease = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        // BoldSignLease: true, // @deprecated - Using Match.tenantSignedAt and Match.landlordSignedAt instead
        booking: true,
        trip: true
      }
    });

    console.log('📋 Lease status:', {
      landlordSignedAt: matchWithLease?.landlordSignedAt,
      tenantSignedAt: matchWithLease?.tenantSignedAt,
      hasExistingBooking: !!matchWithLease?.booking,
      bookingId: matchWithLease?.booking?.id || null
    });

    // If no booking exists, create one
    // TODO: We might bring back the lease signing requirement later
    // Original condition was: if (matchWithLease?.landlordSignedAt && matchWithLease?.tenantSignedAt && !matchWithLease.booking)
    if (!matchWithLease.booking) {
      
      console.log('✅ Payment successful and no existing booking - creating booking now!');
      
      try {
        const booking = await prisma.booking.create({
          data: {
            userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId,
            startDate: match.trip.startDate!,
            endDate: match.trip.endDate!,
            monthlyRent: match.monthlyRent,
            status: 'confirmed'
          }
        });

        console.log('✅ Booking created successfully:', booking.id);
      } catch (bookingError) {
        console.error('❌ Failed to create booking:', bookingError);
        // Don't fail the payment if booking creation fails
      }
    } else {
      console.log('⚠️ Booking NOT created because:');
      if (!matchWithLease?.landlordSignedAt) {
        console.log('  - Landlord has not signed (landlordSignedAt is null)');
      }
      if (!matchWithLease?.tenantSignedAt) {
        console.log('  - Tenant has not signed (tenantSignedAt is null)');
      }
      if (matchWithLease?.booking) {
        console.log('  - Booking already exists:', matchWithLease.booking.id);
      }
    }

    console.log('✅ Payment processed successfully:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: totalAmount / 100
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
    };

  } catch (error) {
    console.error('❌ Error processing direct payment:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('authentication_required')) {
        return { 
          success: false, 
          error: 'Payment requires additional authentication. Please try again.' 
        };
      }
      if (error.message.includes('insufficient_funds')) {
        return { 
          success: false, 
          error: 'Payment failed due to insufficient funds.' 
        };
      }
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to process payment. Please try again.' 
    };
  }
}