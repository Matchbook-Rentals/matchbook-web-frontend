import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function POST() {
  // Update all listings with real coordinates to 'approved'
  const result = await prisma.listing.updateMany({
    where: {
      NOT: {
        AND: [
          { latitude: 0 },
          { longitude: 0 },
        ],
      },
    },
    data: {
      approvalStatus: 'approved',
    },
  });

  return NextResponse.json({
    message: `Updated ${result.count} listings to approved status`,
    count: result.count,
  });
}
