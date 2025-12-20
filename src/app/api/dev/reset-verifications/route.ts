import { NextResponse } from "next/server";
import prisma from '@/lib/prismadb';

// DEV ONLY - Delete all verifications for tyler.bennett52@gmail.com
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const email = 'tyler.bennett52@gmail.com';

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete related records first (foreign key constraints)
    const verifications = await prisma.verification.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const verificationIds = verifications.map(v => v.id);

    // Delete eviction records
    const deletedEvictions = await prisma.evictionRecord.deleteMany({
      where: { verificationId: { in: verificationIds } },
    });

    // Delete criminal records
    const deletedCriminals = await prisma.criminalRecord.deleteMany({
      where: { verificationId: { in: verificationIds } },
    });

    // Delete BGS reports
    const deletedBgsReports = await prisma.bGSReport.deleteMany({
      where: { userId: user.id },
    });

    // Delete verifications
    const deletedVerifications = await prisma.verification.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        verifications: deletedVerifications.count,
        evictionRecords: deletedEvictions.count,
        criminalRecords: deletedCriminals.count,
        bgsReports: deletedBgsReports.count,
      },
    });
  } catch (error) {
    console.error('Error resetting verifications:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'POST to this endpoint to delete all verifications for tyler.bennett52@gmail.com',
    warning: 'DEV ONLY',
  });
}
