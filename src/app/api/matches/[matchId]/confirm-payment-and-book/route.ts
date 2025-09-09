import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { calculatePayments } from '@/lib/calculate-payments';
import { getServiceFeeRate, calculateCreditCardFee } from '@/lib/fee-constants';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;
    
    console.log('🎯 [Confirm Payment & Book] Starting for match:', matchId);

    // Get match with all necessary relations
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: {
          include: { user: true }
        },
        listing: {
          include: { user: true }
        },
        booking: true
        // BoldSignLease: true // @deprecated - Using Match.tenantSignedAt and Match.landlordSignedAt instead
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the tenant
    if (match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not the tenant' }, { status: 403 });
    }

    // Check if booking already exists
    if (match.booking) {
      console.log('✅ [Confirm Payment & Book] Booking already exists:', match.booking.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Booking already exists',
        booking: match.booking,
        paymentSchedule: await prisma.rentPayment.findMany({
          where: { bookingId: match.booking.id },
          orderBy: { dueDate: 'asc' }
        })
      });
    }

    // Verify payment is captured
    console.log('💳 [Confirm Payment & Book] Payment status check:', {
      paymentCapturedAt: match.paymentCapturedAt,
      stripePaymentIntentId: match.stripePaymentIntentId,
      paymentStatus: match.paymentStatus,
      paymentAuthorizedAt: match.paymentAuthorizedAt
    });
    
    if (!match.paymentCapturedAt || !match.stripePaymentIntentId) {
      console.log('❌ [Confirm Payment & Book] Payment not captured:', {
        hasPaymentCapturedAt: !!match.paymentCapturedAt,
        hasStripePaymentIntentId: !!match.stripePaymentIntentId
      });
      return NextResponse.json({ 
        error: 'Payment not confirmed. Please complete payment first.' 
      }, { status: 400 });
    }

    // Verify with Stripe that payment is successful (optional extra verification)
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(match.stripePaymentIntentId);
      console.log('🎯 [Confirm Payment & Book] Stripe payment intent status:', paymentIntent.status);
      
      // For ACH payments in 'processing' status, we still allow booking creation
      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        console.log('❌ [Confirm Payment & Book] Payment not in acceptable status:', paymentIntent.status);
        return NextResponse.json({ 
          error: `Payment not successful. Status: ${paymentIntent.status}` 
        }, { status: 400 });
      }
      console.log('✅ [Confirm Payment & Book] Stripe payment verified:', paymentIntent.id, 'Status:', paymentIntent.status);
    } catch (stripeError) {
      console.error('⚠️ [Confirm Payment & Book] Could not verify with Stripe:', stripeError);
      // Continue anyway if we have paymentCapturedAt
    }

    // Verify lease is fully signed
    // TODO: We might bring back the lease signing requirement later
    // For now, we're allowing booking creation without requiring lease signatures
    console.log('📜 [Confirm Payment & Book] Lease status (informational only):', {
      tenantSignedAt: match.tenantSignedAt,
      landlordSignedAt: match.landlordSignedAt
    });
    
    // Commented out for now - may re-enable later
    // if (!match.tenantSignedAt || !match.landlordSignedAt) {
    //   console.log('❌ [Confirm Payment & Book] Lease not fully signed:', {
    //     tenantSigned: !!match.tenantSignedAt,
    //     landlordSigned: !!match.landlordSignedAt
    //   });
    //   return NextResponse.json({ 
    //     error: 'Lease must be fully signed by both parties' 
    //   }, { status: 400 });
    // }

    // Calculate payment details
    const paymentDetails = calculatePayments({
      listing: match.listing,
      trip: match.trip,
      monthlyRentOverride: match.monthlyRent,
      petRentOverride: match.petRent,
      petDepositOverride: match.petDeposit
    });

    // Calculate total price for the entire stay
    const tripMonths = Math.ceil(
      (new Date(match.trip.endDate!).getTime() - new Date(match.trip.startDate!).getTime()) / 
      (1000 * 60 * 60 * 24 * 30)
    );
    
    const totalPrice = (paymentDetails.totalMonthlyRent * tripMonths) + 
                      paymentDetails.totalDeposit;

    console.log('💰 [Confirm Payment & Book] Creating booking with:', {
      monthlyRent: match.monthlyRent,
      totalPrice,
      tripMonths
    });

    // Create booking and payment schedule in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the booking
      const booking = await tx.booking.create({
        data: {
          userId: match.trip.userId,
          listingId: match.listingId,
          tripId: match.tripId,
          matchId: matchId,
          startDate: match.trip.startDate!,
          endDate: match.trip.endDate!,
          monthlyRent: match.monthlyRent,
          totalPrice: totalPrice,
          status: 'confirmed'
        }
      });

      console.log('✅ [Confirm Payment & Book] Booking created:', booking.id);

      // Generate payment schedule
      const paymentSchedule = generatePaymentSchedule(
        match.trip.startDate!,
        match.trip.endDate!,
        paymentDetails.monthlyRent,
        paymentDetails.monthlyPetRent,
        tripMonths
      );

      // Create RentPayment records
      const rentPayments = await Promise.all(
        paymentSchedule.map((payment) => 
          tx.rentPayment.create({
            data: {
              bookingId: booking.id,
              amount: Math.round(payment.amount * 100), // Convert to cents for storage
              dueDate: payment.dueDate,
              isPaid: false
            }
          })
        )
      );

      console.log(`✅ [Confirm Payment & Book] Created ${rentPayments.length} payment schedule records`);

      // Update trip status to booked
      await tx.trip.update({
        where: { id: match.tripId },
        data: { tripStatus: 'booked' }
      });

      return { booking, rentPayments };
    });

    console.log('🎉 [Confirm Payment & Book] Successfully created booking and payment schedule');

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and payment schedule created',
      booking: result.booking,
      paymentSchedule: result.rentPayments
    });

  } catch (error) {
    console.error('❌ [Confirm Payment & Book] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate payment schedule
function generatePaymentSchedule(
  startDate: Date,
  endDate: Date,
  monthlyRent: number,
  monthlyPetRent: number,
  tripMonths: number
): Array<{
  amount: number;
  dueDate: Date;
  description: string;
  isProrated?: boolean;
}> {
  const payments = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get service fee rate based on trip length
  const serviceFeeRate = getServiceFeeRate(tripMonths);
  
  // Calculate if first month is prorated
  const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDayOfFirstMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const daysInFirstMonth = lastDayOfFirstMonth.getDate();
  const daysRemainingInFirstMonth = lastDayOfFirstMonth.getDate() - start.getDate() + 1;
  const isFirstMonthProrated = start.getDate() !== 1;
  
  // First payment (potentially prorated)
  if (isFirstMonthProrated) {
    const proratedRent = ((monthlyRent + monthlyPetRent) / daysInFirstMonth) * daysRemainingInFirstMonth;
    const serviceFee = proratedRent * serviceFeeRate;
    
    payments.push({
      amount: Math.round((proratedRent + serviceFee) * 100) / 100,
      dueDate: start,
      description: `Rent for ${daysRemainingInFirstMonth} days of ${formatMonth(start)} (prorated) + service fee`,
      isProrated: true
    });
  } else {
    const totalRent = monthlyRent + monthlyPetRent;
    const serviceFee = totalRent * serviceFeeRate;
    
    payments.push({
      amount: Math.round((totalRent + serviceFee) * 100) / 100,
      dueDate: start,
      description: `${formatMonth(start)} rent + service fee`
    });
  }
  
  // Subsequent monthly payments
  let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  let paymentCount = 1;
  const maxPayments = 36; // Limit to 36 months as per requirement
  
  while (currentDate <= end && paymentCount < maxPayments) {
    const totalRent = monthlyRent + monthlyPetRent;
    const serviceFee = totalRent * serviceFeeRate;
    
    payments.push({
      amount: Math.round((totalRent + serviceFee) * 100) / 100,
      dueDate: currentDate,
      description: `${formatMonth(currentDate)} rent + service fee`
    });
    
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    paymentCount++;
  }
  
  return payments;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}