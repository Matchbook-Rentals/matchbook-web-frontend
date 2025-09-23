import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentMethodId: string } }
) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    const userRole = user.publicMetadata?.role as string;
    const isAdmin = userRole?.includes('admin');

    console.log(`🔍 Admin check for user ${userId}: role="${userRole}", isAdmin=${isAdmin}`);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { paymentMethodId } = params;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // For admin users, also check for force parameter to clear any authorized but uncaptured payments
    const searchParams = new URL(request.url).searchParams;
    const forceMode = searchParams.get('force') === 'true';

    console.log(`🧹 Admin clearing stale associations for payment method: ${paymentMethodId}${forceMode ? ' (FORCE MODE)' : ''}`);

    // Find matches that are truly completed and safe to clear
    // Calculate stale threshold (7 days ago)
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 7);

    const staleMatches = await prisma.match.findMany({
      where: {
        stripePaymentMethodId: paymentMethodId,
        OR: [
          // Case 1: Payment was fully captured (successful transaction)
          {
            AND: [
              { paymentCapturedAt: { not: null } },
              {
                OR: [
                  { paymentStatus: 'succeeded' },
                  { paymentStatus: 'captured' },
                  // Also include cases where capture happened but status might not be updated
                  {
                    AND: [
                      { paymentAuthorizedAt: { not: null } },
                      { paymentCapturedAt: { not: null } }
                    ]
                  }
                ]
              }
            ]
          },
          // Case 2: Payment was authorized but not captured and is older than 7 days (likely failed/stalled)
          {
            AND: [
              { paymentAuthorizedAt: { not: null } },
              { paymentCapturedAt: null },
              forceMode ? {} : { paymentAuthorizedAt: { lt: staleThreshold } }
            ]
          },
          // Case 3: Match has no payment activity (in force mode only)
          forceMode ? {
            AND: [
              { paymentAuthorizedAt: null },
              { paymentCapturedAt: null }
            ]
          } : {
            // This case will never match in non-force mode since we can't check age
            id: 'never-match'
          }
        ]
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

    console.log(`🔍 Found ${staleMatches.length} stale matches to clear`);

    // Log each match being cleared
    staleMatches.forEach(match => {
      let reason = '';
      if (match.paymentCapturedAt) {
        reason = 'Payment captured (completed transaction)';
      } else if (match.paymentAuthorizedAt && !match.paymentCapturedAt) {
        const daysSinceAuth = Math.floor((Date.now() - new Date(match.paymentAuthorizedAt).getTime()) / (1000 * 60 * 60 * 24));
        reason = `Payment authorized but not captured for ${daysSinceAuth} days${forceMode ? ' (FORCE MODE)' : ' (stale)'}`;
      } else {
        reason = `No payment activity${forceMode ? ' (FORCE MODE)' : ' (stale)'}`;
      }
      console.log(`   Clearing Match ${match.id}: ${match.listing.locationString} - ${reason}`);
    });

    // Clear the payment method references from these completed matches
    const updateResult = await prisma.match.updateMany({
      where: {
        id: { in: staleMatches.map(m => m.id) }
      },
      data: {
        stripePaymentMethodId: null
      }
    });

    console.log(`✅ Successfully cleared ${updateResult.count} payment method associations`);

    return NextResponse.json({
      success: true,
      clearedCount: updateResult.count,
      clearedMatches: staleMatches.map(match => ({
        id: match.id,
        location: match.listing.locationString,
        paymentStatus: match.paymentStatus
      }))
    });

  } catch (error) {
    console.error('❌ Error clearing stale payment method associations:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear stale associations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}