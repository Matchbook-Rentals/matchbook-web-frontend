/**
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! DEV ONLY - DO NOT COMMIT TO REPOSITORY                                 !!
 * !! This route is for local testing of Accio webhook integration only      !!
 * !! DELETE THIS FILE before pushing to production                          !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

// DEV ONLY - Creates a BGSReport and Verification for webhook testing
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const { userId, orderId } = await request.json();

  if (!userId || !orderId) {
    return NextResponse.json(
      { error: "Missing userId or orderId" },
      { status: 400 }
    );
  }

  // Check if BGSReport already exists
  let bgsReport = await prisma.bGSReport.findUnique({
    where: { orderId },
  });

  // Create BGSReport if it doesn't exist
  if (!bgsReport) {
    bgsReport = await prisma.bGSReport.create({
      data: {
        userId,
        orderId,
        status: "pending",
      },
    });
  }

  // Create or update Verification with credit check "passed"
  const verification = await prisma.verification.upsert({
    where: { userId },
    create: {
      userId,
      status: "PROCESSING_BGS",
      creditStatus: "completed",
      creditBucket: "Good",
      creditCheckedAt: new Date(),
      bgsReportId: bgsReport.id,
      backgroundCheckedAt: new Date(),
    },
    update: {
      status: "PROCESSING_BGS",
      creditStatus: "completed",
      creditBucket: "Good",
      creditCheckedAt: new Date(),
      bgsReportId: bgsReport.id,
      backgroundCheckedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    bgsReport,
    verification,
    message: "DEV ONLY - BGSReport and Verification created for webhook testing",
  });
}
