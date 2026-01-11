import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

// DEV ONLY - Search and list users
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    const whereClause = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        verifiedAt: true,
        hallmarkHostAt: true,
        stripeAccountId: true,
        stripeCustomerId: true,
        referralCode: true,
        referredByUserId: true,
        _count: {
          select: {
            listings: true,
            bookings: true,
            referralsMade: true,
          },
        },
      },
    });

    return NextResponse.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No name',
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        verifiedAt: u.verifiedAt,
        hallmarkHostAt: u.hallmarkHostAt,
        hasStripeAccount: !!u.stripeAccountId,
        hasStripeCustomer: !!u.stripeCustomerId,
        referralCode: u.referralCode,
        referredByUserId: u.referredByUserId,
        counts: u._count,
      })),
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
