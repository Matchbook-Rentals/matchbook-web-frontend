import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { calculatePayments } from '@/lib/calculate-payments';
import { generatePaymentSchedule } from '@/lib/payment-calculations';
import { getServiceFeeRate, calculateCreditCardFee } from '@/lib/fee-constants';
import {
  MAX_PAYMENT_RETRIES,
  PAYMENT_METHOD_RETRY_DELAY_MS,
  dollarsToCents
} from '@/lib/payment-constants';
import { buildDepositCharges } from '@/lib/charge-builders';

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get match with retries for payment method
async function getMatchWithPaymentMethod(matchId: string, maxRetries: number = MAX_PAYMENT_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: {
          include: { user: true }
        },
        listing: {
          include: {
            user: true,
            monthlyPricing: true
          }
        },
        booking: true
      }
    });

    if (match?.stripePaymentMethodId) {
      console.log(`✅ [Confirm Payment & Book] Payment method found on attempt ${attempt}`);
      return match;
    }

    if (attempt < maxRetries) {
      console.log(`⏳ [Confirm Payment & Book] Payment method not found, waiting ${PAYMENT_METHOD_RETRY_DELAY_MS}ms (attempt ${attempt}/${maxRetries})`);
      await wait(PAYMENT_METHOD_RETRY_DELAY_MS);
    }
  }

  return null;
}

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

    // Get match with retries to handle race condition with payment method update
    const match = await getMatchWithPaymentMethod(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Match not found or payment method not set' }, { status: 404 });
    }

    // Verify the user is the tenant
    if (match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not the tenant' }, { status: 403 });
    }

    // Verify payment method exists (should always be true if we got here)
    if (!match.stripePaymentMethodId) {
      console.log('❌ [Confirm Payment & Book] No payment method found after retries');
      return NextResponse.json({
        error: 'Payment method not found. Please complete payment first.'
      }, { status: 400 });
    }

    // Check if booking already exists
    if (match.booking) {
      console.log('✅ [Confirm Payment & Book] Booking already exists:', match.booking.id);
      
      // Quick fix: Check if payment schedule exists, create if missing
      // This handles bookings created before payment schedule generation was added
      const existingPayments = await prisma.rentPayment.findMany({
        where: { bookingId: match.booking.id },
        orderBy: { dueDate: 'asc' }
      });
      
      if (existingPayments.length === 0) {
        console.log('🔧 [Confirm Payment & Book] Booking missing payment schedule - creating now');
        
        // Calculate payment details (same as below)
        console.log('🔍 [Debug] Input data for payment calculation:', {
          'match.monthlyRent': match.monthlyRent,
          'match.petRent': match.petRent,
          'match.petDeposit': match.petDeposit,
          'match.trip.numPets': match.trip.numPets,
          'listing.monthlyRent': match.listing?.monthlyRent,
          'listing.petRent': match.listing?.petRent,
          'listing.petDeposit': match.listing?.petDeposit
        });
        
        const paymentDetails = calculatePayments({
          listing: match.listing,
          trip: match.trip,
          monthlyRentOverride: match.monthlyRent,
          petRentOverride: match.petRent,
          petDepositOverride: match.petDeposit
        });
        
        console.log('🔍 [Debug] Payment details result:', {
          monthlyRent: paymentDetails.monthlyRent,
          monthlyPetRent: paymentDetails.monthlyPetRent,
          totalMonthlyRent: paymentDetails.totalMonthlyRent,
          securityDeposit: paymentDetails.securityDeposit,
          petDeposit: paymentDetails.petDeposit
        });

        // Generate payment schedule using centralized calculation
        const paymentSchedule = generatePaymentSchedule(
          {
            startDate: match.trip.startDate!,
            endDate: match.trip.endDate!,
            petCount: match.trip.numPets
          },
          paymentDetails.monthlyRent,
          paymentDetails.monthlyPetRent,
          true // includeServiceFee
        );

        // Validate payment schedule
        if (!paymentSchedule || paymentSchedule.length === 0) {
          throw new Error('No payment schedule generated for existing booking');
        }
        
        const totalScheduleAmount = paymentSchedule.reduce((sum, p) => sum + p.amount, 0);
        console.log('📅 [Confirm Payment & Book] Creating missing payment schedule:', {
          baseRent: paymentDetails.monthlyRent,
          petRent: paymentDetails.monthlyPetRent,
          totalPayments: paymentSchedule.length,
          totalScheduleAmount: Math.round(totalScheduleAmount * 100) / 100
        });

        // Create deposit payment if needed (check if it already exists)
        const existingDepositPayment = await prisma.rentPayment.findFirst({
          where: {
            bookingId: match.booking.id,
            isPaid: true,
            stripePaymentIntentId: match.stripePaymentIntentId
          }
        });

        if (!existingDepositPayment && match.stripePaymentIntentId) {
          console.log('💰 [Confirm Payment & Book] Creating missing deposit payment record...');

          // Get payment method to determine if card fee was charged
          const paymentMethod = await stripe.paymentMethods.retrieve(match.stripePaymentMethodId);
          const isCard = paymentMethod.type === 'card';

          // Build deposit charges
          const depositChargeBreakdown = buildDepositCharges({
            securityDeposit: dollarsToCents(paymentDetails.securityDeposit),
            petDeposit: paymentDetails.petDeposit ? dollarsToCents(paymentDetails.petDeposit) : 0,
            includeCardFee: isCard
          });

          // Create the deposit RentPayment
          const depositPayment = await prisma.rentPayment.create({
            data: {
              bookingId: match.booking.id,
              amount: depositChargeBreakdown.totalAmount,
              totalAmount: depositChargeBreakdown.totalAmount,
              baseAmount: depositChargeBreakdown.baseAmount,
              dueDate: new Date(),
              isPaid: true,
              paymentCapturedAt: match.paymentCapturedAt || new Date(),
              stripePaymentIntentId: match.stripePaymentIntentId,
              stripePaymentMethodId: match.stripePaymentMethodId,
              type: 'SECURITY_DEPOSIT'
            }
          });

          // Create itemized charges
          await Promise.all(
            depositChargeBreakdown.charges.map((charge) =>
              prisma.rentPaymentCharge.create({
                data: {
                  rentPaymentId: depositPayment.id,
                  category: charge.category,
                  amount: charge.amount,
                  isApplied: charge.isApplied,
                  metadata: charge.metadata ? charge.metadata : undefined
                }
              })
            )
          );

          console.log('✅ [Confirm Payment & Book] Deposit payment created:', depositPayment.id);
        }

        // Create missing RentPayment records with payment method and itemized charges
        const rentPayments = await Promise.all(
          paymentSchedule.map(async (payment) => {
            // Create the rent payment with both legacy and new amount fields
            const rentPayment = await prisma.rentPayment.create({
              data: {
                bookingId: match.booking!.id,
                amount: dollarsToCents(payment.amount), // Legacy field for backward compatibility
                totalAmount: payment.totalAmount || dollarsToCents(payment.amount), // New: total from charges
                baseAmount: payment.baseAmount || dollarsToCents(payment.amount), // New: base amount before fees
                dueDate: payment.dueDate,
                isPaid: false,
                stripePaymentMethodId: match.stripePaymentMethodId, // Attach payment method for auto-charging
                type: 'MONTHLY_RENT'
              }
            });

            // Create itemized charges if available (new payment model)
            if (payment.charges && payment.charges.length > 0) {
              await Promise.all(
                payment.charges.map((charge) =>
                  prisma.rentPaymentCharge.create({
                    data: {
                      rentPaymentId: rentPayment.id,
                      category: charge.category,
                      amount: charge.amount, // Already in cents
                      isApplied: charge.isApplied,
                      metadata: charge.metadata ? charge.metadata : undefined
                    }
                  })
                )
              );
            }

            return rentPayment;
          })
        );
        
        return NextResponse.json({ 
          success: true, 
          message: 'Booking exists, payment schedule created',
          booking: match.booking,
          paymentSchedule: rentPayments
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Booking already exists',
        booking: match.booking,
        paymentSchedule: existingPayments
      });
    }

    // Verify payment is captured
    if (!match.paymentCapturedAt || !match.stripePaymentIntentId) {
      console.log('❌ [Confirm Payment & Book] Payment not captured');
      return NextResponse.json({ 
        error: 'Payment not confirmed. Please complete payment first.' 
      }, { status: 400 });
    }

    // Verify with Stripe that payment is successful (optional extra verification)
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(match.stripePaymentIntentId);
      
      // For ACH payments in 'processing' status, we still allow booking creation
      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        console.log('❌ [Confirm Payment & Book] Payment not acceptable:', paymentIntent.status);
        return NextResponse.json({ 
          error: `Payment not successful. Status: ${paymentIntent.status}` 
        }, { status: 400 });
      }
    } catch (stripeError) {
      console.error('⚠️ [Confirm Payment & Book] Could not verify with Stripe:', stripeError);
      // Continue anyway if we have paymentCapturedAt
    }

    // Verify lease is fully signed
    // TODO: We might bring back the lease signing requirement later
    // For now, we're allowing booking creation without requiring lease signatures
    
    // Commented out for now - may re-enable later
    // if (!match.tenantSignedAt || !match.landlordSignedAt) {
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

      // Create RentPayment for initial deposit payment (already paid)
      console.log('💰 [Confirm Payment & Book] Creating deposit payment record...');

      // Get payment method to determine if card fee was charged
      const paymentMethod = await stripe.paymentMethods.retrieve(match.stripePaymentMethodId);
      const isCard = paymentMethod.type === 'card';

      // Build deposit charges using centralized function
      const depositChargeBreakdown = buildDepositCharges({
        securityDeposit: dollarsToCents(paymentDetails.securityDeposit),
        petDeposit: paymentDetails.petDeposit ? dollarsToCents(paymentDetails.petDeposit) : 0,
        includeCardFee: isCard
      });

      console.log('💰 [Confirm Payment & Book] Deposit breakdown:', {
        securityDeposit: paymentDetails.securityDeposit,
        petDeposit: paymentDetails.petDeposit || 0,
        baseAmount: depositChargeBreakdown.baseAmount / 100,
        totalAmount: depositChargeBreakdown.totalAmount / 100,
        isCard,
        chargeCount: depositChargeBreakdown.charges.length
      });

      // Create the deposit RentPayment (already paid via processDirectPayment)
      const depositPayment = await tx.rentPayment.create({
        data: {
          bookingId: booking.id,
          amount: depositChargeBreakdown.totalAmount, // Legacy field
          totalAmount: depositChargeBreakdown.totalAmount,
          baseAmount: depositChargeBreakdown.baseAmount,
          dueDate: new Date(), // Due immediately (already paid)
          isPaid: true,
          paymentCapturedAt: match.paymentCapturedAt || new Date(),
          stripePaymentIntentId: match.stripePaymentIntentId,
          stripePaymentMethodId: match.stripePaymentMethodId,
          type: 'SECURITY_DEPOSIT'
        }
      });

      // Create itemized charges for deposit
      await Promise.all(
        depositChargeBreakdown.charges.map((charge) =>
          tx.rentPaymentCharge.create({
            data: {
              rentPaymentId: depositPayment.id,
              category: charge.category,
              amount: charge.amount,
              isApplied: charge.isApplied,
              metadata: charge.metadata ? charge.metadata : undefined
            }
          })
        )
      );

      console.log('✅ [Confirm Payment & Book] Deposit payment created:', depositPayment.id);

      // Generate payment schedule using centralized calculation
      const paymentSchedule = generatePaymentSchedule(
        {
          startDate: match.trip.startDate!,
          endDate: match.trip.endDate!,
          petCount: match.trip.numPets
        },
        paymentDetails.monthlyRent,
        paymentDetails.monthlyPetRent,
        true // includeServiceFee
      );

      // Validate payment schedule
      if (!paymentSchedule || paymentSchedule.length === 0) {
        throw new Error('No payment schedule generated');
      }
      
      const totalScheduleAmount = paymentSchedule.reduce((sum, p) => sum + p.amount, 0);
      console.log('📅 [Confirm Payment & Book] Payment schedule created:', {
        baseRent: paymentDetails.monthlyRent,
        petRent: paymentDetails.monthlyPetRent,
        totalPayments: paymentSchedule.length,
        totalScheduleAmount: Math.round(totalScheduleAmount * 100) / 100
      });

      // Create RentPayment records with payment method and itemized charges
      const rentPayments = await Promise.all(
        paymentSchedule.map(async (payment) => {
          // Create the rent payment with both legacy and new amount fields
          const rentPayment = await tx.rentPayment.create({
            data: {
              bookingId: booking.id,
              amount: dollarsToCents(payment.amount), // Legacy field for backward compatibility
              totalAmount: payment.totalAmount || dollarsToCents(payment.amount), // New: total from charges
              baseAmount: payment.baseAmount || dollarsToCents(payment.amount), // New: base amount before fees
              dueDate: payment.dueDate,
              isPaid: false,
              stripePaymentMethodId: match.stripePaymentMethodId, // Attach payment method for auto-charging
              type: 'MONTHLY_RENT'
            }
          });

          // Create itemized charges if available (new payment model)
          if (payment.charges && payment.charges.length > 0) {
            await Promise.all(
              payment.charges.map((charge) =>
                tx.rentPaymentCharge.create({
                  data: {
                    rentPaymentId: rentPayment.id,
                    category: charge.category,
                    amount: charge.amount, // Already in cents
                    isApplied: charge.isApplied,
                    metadata: charge.metadata ? charge.metadata : undefined
                  }
                })
              )
            );
          }

          return rentPayment;
        })
      );


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

// Using centralized payment calculation from payment-calculations.ts
// This ensures consistency between what users see on the review page
// and what gets created in the database