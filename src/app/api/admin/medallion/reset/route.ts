import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or admin_dev
    const userRole = user.publicMetadata?.role as string;
    const isAdmin = userRole?.includes('admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { targetUserId } = await request.json();

    // If no targetUserId provided, use current user
    const userToReset = targetUserId || userId;

    // Reset all Medallion-related fields
    const updatedUser = await prisma.user.update({
      where: { id: userToReset },
      data: {
        medallionIdentityVerified: false,
        medallionUserId: null,
        medallionVerificationStatus: null,
        medallionVerificationStartedAt: null,
        medallionVerificationCompletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        medallionIdentityVerified: true,
        medallionUserId: true,
        medallionVerificationStatus: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Medallion verification data reset successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error resetting Medallion data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or admin_dev
    const userRole = user.publicMetadata?.role as string;
    const isAdmin = userRole?.includes('admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // If no targetUserId provided, use current user
    const userToCheck = targetUserId || userId;

    // Get user's Medallion verification status
    const userData = await prisma.user.findUnique({
      where: { id: userToCheck },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        medallionIdentityVerified: true,
        medallionUserId: true,
        medallionVerificationStatus: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching Medallion data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}