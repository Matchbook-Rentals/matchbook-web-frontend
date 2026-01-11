import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from '@/lib/prismadb';

// DEV ONLY - Delete all verifications for the current authenticated user
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Delete verification-related purchases
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: {
        userId: user.id,
        type: 'matchbookVerification',
      },
    });

    // Delete credit reports
    const deletedCreditReports = await prisma.creditReport.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        verifications: deletedVerifications.count,
        evictionRecords: deletedEvictions.count,
        criminalRecords: deletedCriminals.count,
        bgsReports: deletedBgsReports.count,
        purchases: deletedPurchases.count,
        creditReports: deletedCreditReports.count,
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
    message: 'POST to this endpoint to delete all verifications for the currently authenticated user',
    warning: 'DEV ONLY - Used for e2e testing',
  });
}
