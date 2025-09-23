import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 Getting payment methods for user: ${userId}`);

    // Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, role: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({
        paymentMethods: []
      });
    }

    // Get all payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    console.log(`📊 Found ${paymentMethods.data.length} payment methods in Stripe`);

    // For each payment method, get associated matches
    const paymentMethodsWithMatches = await Promise.all(
      paymentMethods.data.map(async (pm) => {
        // Get all matches using this payment method
        const allMatches = await prisma.match.findMany({
          where: {
            stripePaymentMethodId: pm.id
          },
          select: {
            id: true,
            paymentStatus: true,
            paymentAuthorizedAt: true,
            paymentCapturedAt: true,
            paymentAmount: true,
            tenantSignedAt: true,
            landlordSignedAt: true,
            listing: {
              select: {
                id: true,
                locationString: true,
                title: true
              }
            },
            trip: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        // Determine which matches are "active" (blocking deletion)
        const activeMatches = allMatches.filter(match => {
          // A match is active if payment not captured OR (authorized but not captured)
          return match.paymentCapturedAt === null ||
                 (match.paymentAuthorizedAt !== null && match.paymentCapturedAt === null);
        });

        console.log(`   PM ${pm.id}: ${allMatches.length} total matches, ${activeMatches.length} active`);

        return {
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '0000',
          exp_month: pm.card?.exp_month || 0,
          exp_year: pm.card?.exp_year || 0,
          totalMatches: allMatches.length,
          activeMatches: activeMatches.length,
          matches: activeMatches.map(match => ({
            id: match.id,
            paymentStatus: match.paymentStatus,
            paymentAuthorized: !!match.paymentAuthorizedAt,
            paymentCaptured: !!match.paymentCapturedAt,
            paymentAmount: match.paymentAmount,
            paymentAuthorizedAt: match.paymentAuthorizedAt?.toISOString() || null,
            paymentCapturedAt: match.paymentCapturedAt?.toISOString() || null,
            tenantSigned: !!match.tenantSignedAt,
            landlordSigned: !!match.landlordSignedAt,
            listing: match.listing,
            trip: match.trip
          }))
        };
      })
    );

    console.log(`✅ Returning ${paymentMethodsWithMatches.length} payment methods with match data`);

    return NextResponse.json({
      paymentMethods: paymentMethodsWithMatches
    });

  } catch (error) {
    console.error('❌ Error getting user payment methods:', error);
    return NextResponse.json(
      {
        error: 'Failed to get payment methods',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}