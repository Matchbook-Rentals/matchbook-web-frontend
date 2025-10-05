import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    console.log('🔍 Verifying match status for callback:', params.matchId);

    // Get the match with all necessary relations
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        trip: { 
          include: { user: true } 
        },
        listing: { 
          include: { user: true } 
        },
        BoldSignLease: true,
      }
    });

    if (!match) {
      console.error('❌ Match not found:', params.matchId);
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Verify the user is the renter
    if (match.trip.user?.id !== userId) {
      console.error('❌ Unauthorized - not renter');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if lease is signed by tenant
    const isLeaseSigned = match.BoldSignLease?.tenantSigned || false;
    
    // Check if payment is authorized
    const isPaymentAuthorized = !!match.paymentAuthorizedAt;

    console.log('📊 Match status check:', {
      matchId: params.matchId,
      isLeaseSigned,
      isPaymentAuthorized,
      hasPaymentMethod: !!match.stripePaymentMethodId
    });

    // Both conditions must be met to proceed
    if (!isLeaseSigned || !isPaymentAuthorized) {
      console.log('⚠️ Conditions not met, redirecting back to lease signing');
      return NextResponse.redirect(new URL(`/app/match/${params.matchId}`, request.url));
    }

    console.log('✅ All conditions met, creating host notification');

    // Create notification for the host
    try {
      await prisma.notification.create({
        data: {
          userId: match.listing.user?.id || '',
          content: `Tenant has signed the lease and authorized payment for ${match.listing.locationString}. Complete the process by signing the lease.`,
          url: `/app/host/${match.listingId}/applications/${match.trip.id}/application-details`,
          actionType: 'lease_signature_required',
          actionId: match.id,
          unread: true,
        }
      });
      
      console.log('✅ Host notification created successfully');
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification:', notificationError);
      // Continue anyway - don't block the user flow
    }

    // Redirect to pending host signature page
    return NextResponse.redirect(new URL(`/app/match/${params.matchId}/pending-host-signature`, request.url));

  } catch (error) {
    console.error('❌ Error in callback verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}