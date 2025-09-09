import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { checkRole } from '@/utils/roles';

// POST /api/matches/[matchId]/admin-reset - Reset lease and payment state for admin debugging
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin_dev role
    const hasAdminDevRole = await checkRole('admin_dev');
    
    if (!hasAdminDevRole) {
      console.warn(`⚠️ Unauthorized admin-reset attempt by user ${userId}`);
      return NextResponse.json({ error: 'Admin developer role required' }, { status: 403 });
    }

    // Parse request body for reset type
    const body = await request.json();
    const { resetType = 'all', isAdminDev = false, petRent, petDeposit, startDate, endDate, numPets } = body;

    // Double-check the isAdminDev flag from client (belt and suspenders)
    if (!isAdminDev) {
      return NextResponse.json({ error: 'Admin dev flag required' }, { status: 403 });
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
    let tripUpdateData: any = {};

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
    } else if (resetType === 'updatePetFees') {
      // Update pet fees on the match
      if (petRent !== undefined) {
        updateData.petRent = petRent;
      }
      if (petDeposit !== undefined) {
        updateData.petDeposit = petDeposit;
      }
      // Also update number of pets on the trip
      if (numPets !== undefined) {
        tripUpdateData.numPets = parseInt(numPets) || 0;
      }
      console.log(`🔄 ADMIN: Updating pet fees for match ${matchId} - petRent: ${petRent}, petDeposit: ${petDeposit}, numPets: ${numPets}`);
    } else if (resetType === 'updateTripDates') {
      // Update trip dates (we'll update the trip separately)
      if (startDate !== undefined) {
        tripUpdateData.startDate = new Date(startDate);
      }
      if (endDate !== undefined) {
        tripUpdateData.endDate = new Date(endDate);
      }
      console.log(`🔄 ADMIN: Updating trip dates for match ${matchId} - startDate: ${startDate}, endDate: ${endDate}`);
    }

    if (resetType === 'all' || resetType === 'payment') {
      updateData.stripePaymentMethodId = null;
      updateData.stripePaymentIntentId = null;
      updateData.paymentAuthorizedAt = null;
      updateData.paymentCapturedAt = null;
      console.log(`🔄 ADMIN: Resetting payment data for match ${matchId}`);
    } else if (resetType === 'paymentMethod') {
      // Only clear the payment method to show first-time user UI
      updateData.stripePaymentMethodId = null;
      console.log(`🔄 ADMIN: Clearing payment method only for match ${matchId}`);
    }

    // Perform the updates
    let updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Update trip dates if needed
    let updatedTrip = null;
    if (Object.keys(tripUpdateData).length > 0) {
      updatedTrip = await prisma.trip.update({
        where: { id: match.tripId },
        data: tripUpdateData
      });
    }

    // Log the admin action
    console.log(`
      🔧 ADMIN RESET PERFORMED
      ========================
      Match ID: ${matchId}
      Reset Type: ${resetType}
      Performed By: ${userId} (${isTenant ? 'Tenant' : 'Host'})
      Role: admin_dev (verified)
      Fields Reset: ${Object.keys(updateData).join(', ')}
      Fields Updated: ${Object.keys(tripUpdateData).join(', ')}
      Timestamp: ${new Date().toISOString()}
    `);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully ${resetType.startsWith('update') ? 'updated' : 'reset'} ${resetType} data`,
      resetType,
      fieldsReset: Object.keys(updateData),
      fieldsUpdated: Object.keys(tripUpdateData),
      match: {
        id: updatedMatch.id,
        tenantSignedAt: updatedMatch.tenantSignedAt,
        landlordSignedAt: updatedMatch.landlordSignedAt,
        stripePaymentMethodId: updatedMatch.stripePaymentMethodId,
        stripePaymentIntentId: updatedMatch.stripePaymentIntentId,
        paymentAuthorizedAt: updatedMatch.paymentAuthorizedAt,
        paymentCapturedAt: updatedMatch.paymentCapturedAt,
        petRent: updatedMatch.petRent,
        petDeposit: updatedMatch.petDeposit
      },
      trip: updatedTrip ? {
        id: updatedTrip.id,
        startDate: updatedTrip.startDate,
        endDate: updatedTrip.endDate,
        numPets: updatedTrip.numPets
      } : null
    });
    
  } catch (error) {
    console.error('Error in admin reset:', error);
    return NextResponse.json(
      { error: 'Failed to perform admin reset' },
      { status: 500 }
    );
  }
}
