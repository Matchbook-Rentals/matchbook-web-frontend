import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
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

    console.log(`🔍 Admin analyzing payment method: ${paymentMethodId}`);

    // Get all matches using this payment method
    const allMatches = await prisma.match.findMany({
      where: {
        stripePaymentMethodId: paymentMethodId
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

    const response = {
      paymentMethodId,
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

    console.log(`📊 Analysis complete: ${allMatches.length} total matches, ${activeMatches.length} active`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error analyzing payment method:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}