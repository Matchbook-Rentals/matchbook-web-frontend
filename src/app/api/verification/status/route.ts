import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the most recent verification record with all relations
    const verification = await prisma.verification.findFirst({
      where: { userId: user.id },
      include: {
        creditReport: true,
        bgsReport: true,
        purchase: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json({
        status: "NOT_FOUND",
        message: "No verification record found",
      });
    }

    // Check if verification has expired (>90 days)
    if (verification.validUntil && new Date() > verification.validUntil) {
      // Update status to EXPIRED if not already
      if (verification.status !== "EXPIRED") {
        await prisma.verification.update({
          where: { id: verification.id },
          data: { status: "EXPIRED" },
        });
      }

      return NextResponse.json({
        status: "EXPIRED",
        message: "Verification has expired. Please submit a new verification.",
        validUntil: verification.validUntil,
      });
    }

    // Return current verification status
    return NextResponse.json({
      status: verification.status,
      screeningDate: verification.screeningDate,
      validUntil: verification.validUntil,
      creditBucket: verification.creditBucket,
      creditStatus: verification.creditStatus,
      evictionStatus: verification.evictionStatus,
      evictionCount: verification.evictionCount,
      criminalStatus: verification.criminalStatus,
      criminalRecordCount: verification.criminalRecordCount,
      creditCheckedAt: verification.creditCheckedAt,
      backgroundCheckedAt: verification.backgroundCheckedAt,
      bgsReportStatus: verification.bgsReport?.status,
      orderId: verification.bgsReport?.orderId,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
    });

  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
