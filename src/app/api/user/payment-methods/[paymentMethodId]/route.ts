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

    console.log(`🔍 Found ${activeMatches.length} matches using payment method ${paymentMethodId}`);

    // Also check for any matches that might have different statuses
    const allMatches = await prisma.match.findMany({
      where: {
        stripePaymentMethodId: paymentMethodId
      },
      select: {
        id: true,
        paymentStatus: true,
        paymentAuthorizedAt: true,
        paymentCapturedAt: true,
        listing: {
          select: {
            locationString: true
          }
        }
      }
    });

    console.log(`🔍 Total matches (all statuses) using payment method: ${allMatches.length}`);
    if (allMatches.length > 0) {
      allMatches.forEach(match => {
        console.log(`   Match ${match.id}: ${match.listing.locationString} - Authorized: ${match.paymentAuthorizedAt ? 'Yes' : 'No'}, Captured: ${match.paymentCapturedAt ? 'Yes' : 'No'}`);
      });
    }

    if (activeMatches.length > 0) {
      // Log detailed information about each blocking match
      activeMatches.forEach((match, index) => {
        console.log(`📋 Blocking Match ${index + 1}:`);
        console.log(`   Match ID: ${match.id}`);
        console.log(`   Listing: ${match.listing.title} (${match.listing.locationString})`);
        console.log(`   Listing ID: ${match.listing.id}`);
        console.log(`   Trip ID: ${match.trip.id}`);
        console.log(`   User: ${match.trip.user.email} (${match.trip.user.id})`);
        console.log(`   Payment Status: ${match.paymentStatus || 'null'}`);
        console.log(`   Payment Amount: ${match.paymentAmount ? `$${match.paymentAmount / 100}` : 'null'}`);
        console.log(`   Payment Authorized: ${match.paymentAuthorizedAt || 'null'}`);
        console.log(`   Payment Captured: ${match.paymentCapturedAt || 'null'}`);
        console.log(`   Tenant Signed: ${match.tenantSignedAt || 'null'}`);
        console.log(`   Landlord Signed: ${match.landlordSignedAt || 'null'}`);
        console.log('');
      });

      const locations = activeMatches.map(match => match.listing.locationString).join(', ');
      const matchDetails = activeMatches.map(match =>
        `Match ${match.id}: ${match.listing.title} (${match.listing.locationString}) - Status: ${match.paymentStatus || 'pending'}, Authorized: ${match.paymentAuthorizedAt ? 'Yes' : 'No'}, Captured: ${match.paymentCapturedAt ? 'Yes' : 'No'}`
      ).join(' | ');

      console.log(`❌ Cannot delete payment method. Active matches: ${matchDetails}`);

      return NextResponse.json({
        error: 'Cannot delete payment method',
        details: `This payment method is currently being used for active bookings: ${locations}. Please wait for these bookings to complete or use a different payment method.`,
        debugInfo: {
          totalActiveMatches: activeMatches.length,
          matches: activeMatches.map(match => ({
            id: match.id,
            listingTitle: match.listing.title,
            location: match.listing.locationString,
            paymentStatus: match.paymentStatus,
            paymentAuthorized: !!match.paymentAuthorizedAt,
            paymentCaptured: !!match.paymentCapturedAt,
            tenantSigned: !!match.tenantSignedAt,
            landlordSigned: !!match.landlordSignedAt
          }))
        }
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