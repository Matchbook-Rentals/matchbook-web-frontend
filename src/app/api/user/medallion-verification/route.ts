import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { medallionUserId, verificationStatus } = await request.json();

    if (!medallionUserId || !verificationStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        medallionUserId,
        medallionVerificationStatus: verificationStatus,
        medallionIdentityVerified: verificationStatus === "approved",
        medallionVerificationCompletedAt: verificationStatus === "approved" ? new Date() : undefined,
      },
      select: {
        id: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
        medallionUserId: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating Medallion verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        medallionIdentityVerified: true,
        medallionVerificationStatus: true,
        medallionUserId: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching Medallion verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}