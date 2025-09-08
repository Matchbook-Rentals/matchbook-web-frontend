import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// POST /api/matches/[matchId]/admin-reset - Reset lease and payment state for admin debugging
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for reset type
    const body = await request.json();
    const { resetType = 'all', isAdminDev = false } = body;

    // Security check - must be admin dev
    if (!isAdminDev) {
      return NextResponse.json({ error: 'Admin dev access required' }, { status: 403 });
    }

    const matchId = params.matchId;

    // Find the match and verify user has access (either as tenant or host)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: true,
        listing: true
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is either the tenant (trip owner) or host (listing owner)
    const isTenant = match.trip.userId === userId;
    const isHost = match.listing.userId === userId;
    
    if (!isTenant && !isHost) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data based on reset type
    let updateData: any = {};

    if (resetType === 'all') {
      updateData.tenantSignedAt = null;
      updateData.landlordSignedAt = null;
      console.log(`🔄 ADMIN: Resetting ALL lease signatures for match ${matchId}`);
    } else if (resetType === 'lease' || resetType === 'tenant') {
      updateData.tenantSignedAt = null;
      console.log(`🔄 ADMIN: Resetting TENANT signature only for match ${matchId}`);
    } else if (resetType === 'landlord') {
      updateData.landlordSignedAt = null;
      console.log(`🔄 ADMIN: Resetting LANDLORD signature only for match ${matchId}`);
    }

    if (resetType === 'all' || resetType === 'payment') {
      updateData.stripePaymentMethodId = null;
      updateData.stripePaymentIntentId = null;
      updateData.paymentAuthorizedAt = null;
      updateData.paymentCapturedAt = null;
      console.log(`🔄 ADMIN: Resetting payment data for match ${matchId}`);
    }

    // Perform the update
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Log the admin action
    console.log(`
      🔧 ADMIN RESET PERFORMED
      ========================
      Match ID: ${matchId}
      Reset Type: ${resetType}
      Performed By: ${userId} (${isTenant ? 'Tenant' : 'Host'})
      Fields Reset: ${Object.keys(updateData).join(', ')}
      Timestamp: ${new Date().toISOString()}
    `);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully reset ${resetType} data`,
      resetType,
      fieldsReset: Object.keys(updateData),
      match: {
        id: updatedMatch.id,
        tenantSignedAt: updatedMatch.tenantSignedAt,
        landlordSignedAt: updatedMatch.landlordSignedAt,
        stripePaymentMethodId: updatedMatch.stripePaymentMethodId,
        stripePaymentIntentId: updatedMatch.stripePaymentIntentId,
        paymentAuthorizedAt: updatedMatch.paymentAuthorizedAt,
        paymentCapturedAt: updatedMatch.paymentCapturedAt
      }
    });
    
  } catch (error) {
    console.error('Error in admin reset:', error);
    return NextResponse.json(
      { error: 'Failed to perform admin reset' },
      { status: 500 }
    );
  }
}