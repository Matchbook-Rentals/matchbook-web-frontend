/**
 * Payment Processing Server Action
 *
 * Handles direct payment processing via Stripe for deposit payments.
 * For complete payment flow and fee structure, see /docs/payment-spec.md
 */
'use server';

import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';
import { reverseCalculateBaseAmount, FEES } from '@/lib/fee-constants';
import { sendBookingCreatedAlert } from '@/lib/sms-alerts';

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

    // Verify the host's account can accept charges
    // See /docs/webhooks/stripe.md for account status details
    if (!match.listing.user?.stripeChargesEnabled) {
      console.error(`❌ Host ${match.listing.userId} cannot accept charges`, {
        stripeChargesEnabled: match.listing.user?.stripeChargesEnabled,
        stripeAccountStatus: match.listing.user?.stripeAccountStatus,
        stripeRequirementsDue: match.listing.user?.stripeRequirementsDue
      });
      return {
        success: false,
        error: 'This host cannot accept payments at this time. Please contact support.'
      };
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
     * The 'amount' parameter already includes the credit card fee if applicable.
     * This is calculated on the client using the self-inclusive 3% formula:
     *   totalAmount = baseAmount / (1 - 0.03)
     *
     * This ensures that after the 3% fee is deducted,
     * we receive the exact amount we intended (deposits + deposit transfer fee).
     *
     * Example:
     *   Base amount (deposits + $7 deposit transfer): $227
     *   Total charged to card: $234.02
     *   Credit card fee (3%): $7.02
     *   Amount we receive: $227 ✓
     *
     * See /docs/payment-spec.md for complete payment specification
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
     * TRANSFER FEE: Fixed $7 for all deposit transactions
     *   - MatchBook keeps this fee
     *   - Landlord receives: deposits - $7
     *
     * CREDIT CARD FEE: 3% self-inclusive (if using card)
     *   - Paid by the tenant on top of the base amount
     *   - Covers payment processing costs
     *
     * NO RENT COLLECTED: This transaction is for deposits only
     *   - Rent payments are scheduled separately
     *   - Service fees (3% or 1.5%) apply to rent, not deposits
     *
     * See /docs/payment-spec.md for complete fee structure details
     */
    const TRANSFER_FEE_CENTS = FEES.TRANSFER_FEE_CENTS;
    
    // Landlord receives the deposit amount minus our $7 deposit transfer fee
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

    // Determine booking status based on payment intent status
    // See /docs/payment-spec.md for ACH recovery flow details
    let bookingStatus: string;
    let bookingPaymentStatus: string;

    console.log('💳 Payment Intent Status:', paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      // Card payment - immediate success
      updateData.paymentCapturedAt = new Date();
      updateData.paymentStatus = 'captured';
      bookingStatus = 'confirmed';
      bookingPaymentStatus = 'settled';
      console.log('✅ Card payment succeeded - booking confirmed immediately');

    } else if (paymentIntent.status === 'processing') {
      // ACH payment - still processing (3-5 business days)
      // Do NOT set paymentCapturedAt yet - wait for webhook confirmation
      updateData.paymentStatus = 'processing';
      bookingStatus = 'pending_payment';  // Booking exists but payment not settled
      bookingPaymentStatus = 'processing';
      console.log('⏳ ACH payment processing - booking pending settlement (3-5 days)');

    } else {
      // Other statuses (requires_action, etc)
      updateData.paymentStatus = 'authorized';
      bookingStatus = 'reserved';
      bookingPaymentStatus = 'pending';
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
      
      console.log('✅ Payment initiated and no existing booking - creating booking now!');

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
            status: bookingStatus,  // Use calculated status based on payment type
            paymentStatus: bookingPaymentStatus,  // Track payment settlement status
          }
        });

        console.log('✅ Booking created successfully:', booking.id, 'with status:', bookingStatus);

        // Send SMS alert for new booking
        await sendBookingCreatedAlert({
          bookingId: booking.id,
          matchId: matchId,
          listingAddress: match.listing.locationString || 'Unknown location',
          renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim() || 'Unknown renter',
          totalAmount: amount,
          startDate: match.trip.startDate!,
          endDate: match.trip.endDate!,
        });

        // Send in-app and email notifications to both host and renter
        try {
          const { createNotification } = await import('./notifications');
          const { buildNotificationEmailData } = await import('@/lib/notification-builders');

          const renterName = `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim()
            || match.trip.user.email
            || 'A renter';
          const listingTitle = match.listing.title || 'a listing';
          const moveInDate = match.trip.startDate!.toLocaleDateString();
          const dateRange = `${match.trip.startDate!.toLocaleDateString()} - ${match.trip.endDate!.toLocaleDateString()}`;

          // Notify HOST
          await createNotification({
            userId: match.listing.userId,
            content: `New booking: ${renterName} is moving in on ${moveInDate}`,
            url: `/app/host-dashboard?tab=bookings&id=${booking.id}`,
            actionType: 'booking_host',
            actionId: booking.id,
            emailData: buildNotificationEmailData('booking_host', {
              listingTitle,
              renterName,
              moveInDate
            })
          });

          // Notify RENTER
          await createNotification({
            userId: match.trip.userId,
            content: `Your booking for ${listingTitle} is confirmed!`,
            url: `/app/rent/bookings/${booking.id}`,
            actionType: 'booking_confirmed',
            actionId: booking.id,
            emailData: buildNotificationEmailData('booking_confirmed', {
              listingTitle,
              city: match.listing.city || '',
              dateRange
            })
          });

          console.log('✅ Booking notifications sent to host and renter');
        } catch (notificationError) {
          console.error('❌ Failed to send booking notifications:', notificationError);
          // Don't fail booking creation if notifications fail
        }
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