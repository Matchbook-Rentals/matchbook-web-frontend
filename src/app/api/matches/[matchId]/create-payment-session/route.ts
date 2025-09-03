import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { calculateLengthOfStay } from '@/lib/calculate-rent';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, includeCardFee = true } = await request.json();

    // Get the match to find the host's Stripe Connect account
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { 
            user: true,
            monthlyPricing: true
          }
        },
        trip: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter
    if (match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return NextResponse.json({ error: 'Host must setup Stripe Connect account first' }, { status: 400 });
    }

    // Get user details for customer creation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeCustomerId: true, 
        email: true, 
        firstName: true, 
        lastName: true 
      }
    });

    if (!user) {
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
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Calculate trip length and find appropriate monthly pricing
    const tripLength = calculateLengthOfStay(match.trip.startDate, match.trip.endDate);
    const monthsNeeded = tripLength.months;
    
    // Find the closest monthly pricing (prefer exact match, otherwise find closest)
    let monthlyPrice = 0;
    if (match.listing.monthlyPricing && match.listing.monthlyPricing.length > 0) {
      // First try to find exact match
      const exactMatch = match.listing.monthlyPricing.find(pricing => pricing.months === monthsNeeded);
      if (exactMatch) {
        monthlyPrice = exactMatch.price;
      } else {
        // Find closest pricing tier (prefer shorter duration if no exact match)
        const sortedPricing = match.listing.monthlyPricing
          .filter(pricing => pricing.months <= monthsNeeded)
          .sort((a, b) => b.months - a.months);
        
        if (sortedPricing.length > 0) {
          monthlyPrice = sortedPricing[0].price;
        } else {
          // If no pricing for shorter duration, use shortest available
          const shortestPricing = match.listing.monthlyPricing
            .sort((a, b) => a.months - b.months)[0];
          monthlyPrice = shortestPricing?.price || 0;
        }
      }
    } else {
      // Fallback to match.monthlyRent if no pricing table exists
      monthlyPrice = match.monthlyRent || 0;
    }

    // Calculate payment breakdown
    const monthlyRent = monthlyPrice;
    const securityDeposit = match.listing.depositSize || 0;
    const petDeposit = match.listing.petDeposit || 0;
    
    console.log('💰 Pricing calculation:', {
      tripLength: `${tripLength.months} months, ${tripLength.days} days`,
      monthsNeeded,
      availablePricingTiers: match.listing.monthlyPricing?.map(p => ({ months: p.months, price: p.price })),
      selectedMonthlyPrice: monthlyPrice,
      fallbackMonthlyRent: match.monthlyRent,
      securityDeposit,
      petDeposit
    });
    
    // Calculate MatchBook fee (3% of total amount)
    const matchBookFee = Math.round(amount * 0.03 * 100); // 3% in cents
    
    // Calculate credit card processing fee (2.9% + 30¢ for cards)
    const cardProcessingFee = includeCardFee ? Math.round(amount * 0.029 * 100) + 30 : 0; // 2.9% + 30¢ in cents
    
    const landlordAmount = (amount * 100) - matchBookFee; // Remaining amount in cents

    // Build line items dynamically
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Lease Payment - ${match.listing.locationString}`,
            description: `Security deposit and first month rent for ${match.listing.locationString}${petDeposit > 0 ? '\n\nBreakdown:\n• Monthly Rent: $' + monthlyRent.toLocaleString() + '\n• Security Deposit: $' + securityDeposit.toLocaleString() + '\n• Pet Deposit: $' + petDeposit.toLocaleString() : '\n\nBreakdown:\n• Monthly Rent: $' + monthlyRent.toLocaleString() + '\n• Security Deposit: $' + securityDeposit.toLocaleString()}`,
            metadata: {
              matchId: params.matchId,
              listingId: match.listingId,
              propertyAddress: match.listing.locationString,
              monthlyRent: monthlyRent.toString(),
              securityDeposit: securityDeposit.toString(),
              petDeposit: petDeposit.toString(),
            }
          },
          unit_amount: landlordAmount, // Amount going to landlord
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'MatchBook Service Fee',
            description: 'Platform processing and service fee (3% of lease payment)',
            metadata: {
              matchId: params.matchId,
              feePercentage: '3%',
              calculatedFrom: amount.toString(),
            }
          },
          unit_amount: matchBookFee, // MatchBook fee as separate line item
        },
        quantity: 1,
      },
    ];

    // Add credit card processing fee if applicable
    if (includeCardFee && cardProcessingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Credit Card Processing Fee',
            description: 'Credit card processing fee (2.9% + 30¢) - not charged for bank transfers',
            metadata: {
              matchId: params.matchId,
              feeType: 'credit_card_processing',
              feePercentage: '2.9% + 30¢',
            }
          },
          unit_amount: cardProcessingFee,
        },
        quantity: 1,
      });
    }

    // Create Checkout Session for full payment with fees
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: includeCardFee ? ['card', 'us_bank_account'] : ['us_bank_account', 'card'], // Cards first when including fee
      mode: 'payment', // Payment mode for immediate payment
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/app/rent/match/${params.matchId}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/app/rent/match/${params.matchId}/lease-signing`,
      metadata: {
        matchId: params.matchId,
        userId,
        amount: amount.toString(),
        type: 'lease_payment_full',
        hostUserId: match.listing.userId,
        matchBookFee: (matchBookFee / 100).toString(),
        landlordAmount: (landlordAmount / 100).toString(),
        cardProcessingFee: (cardProcessingFee / 100).toString(),
        includeCardFee: includeCardFee.toString(),
      },
      payment_intent_data: {
        transfer_data: {
          destination: match.listing.user.stripeAccountId,
          amount: landlordAmount, // Transfer only the lease payment portion
        },
        metadata: {
          matchId: params.matchId,
          userId,
          hostUserId: match.listing.userId,
          type: 'lease_deposit_and_rent_checkout',
          matchBookFee: (matchBookFee / 100).toString(),
          landlordAmount: (landlordAmount / 100).toString(),
          totalAmount: amount.toString(),
          cardProcessingFee: (cardProcessingFee / 100).toString(),
          includeCardFee: includeCardFee.toString(),
        },
      },
      automatic_tax: {
        enabled: false,
      },
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('💰 Payment breakdown:', {
      totalAmount: amount,
      matchBookFee: matchBookFee / 100,
      cardProcessingFee: cardProcessingFee / 100,
      landlordAmount: landlordAmount / 100,
      matchBookFeePercentage: '3%',
      cardFeePercentage: includeCardFee ? '2.9% + 30¢' : '0%',
      includeCardFee
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('❌ Error creating payment session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
