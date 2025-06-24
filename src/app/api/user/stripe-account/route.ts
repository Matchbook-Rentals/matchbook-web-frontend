import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true },
    });

    return NextResponse.json({
      stripeAccountId: user?.stripeAccountId || null,
    });
  } catch (error) {
    console.error('Error fetching user Stripe account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}