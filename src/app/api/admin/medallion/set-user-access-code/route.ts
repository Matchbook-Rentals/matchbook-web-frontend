import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Debug endpoint to manually set userAccessCode for testing
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userAccessCode, medallionUserId, targetUserId } = await request.json();

    if (!userAccessCode && !medallionUserId) {
      return NextResponse.json(
        { error: "userAccessCode or medallionUserId is required" },
        { status: 400 }
      );
    }

    // For debugging, allow setting both fields for any user (admin endpoint)
    const userIdToUpdate = targetUserId || userId;

    console.log(`🔧 [DEBUG] Setting Medallion data for user ${userIdToUpdate}:`, {
      userAccessCode,
      medallionUserId
    });

    // Update user with the userAccessCode and/or medallionUserId
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        ...(userAccessCode && { medallionUserAccessCode: userAccessCode }),
        ...(medallionUserId && { medallionUserId: medallionUserId }),
        medallionVerificationStatus: "pending",
        medallionVerificationStartedAt: new Date(),
      },
      select: {
        id: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionVerificationStatus: true,
      },
    });

    console.log(`✅ [DEBUG] User updated:`, updatedUser);

    return NextResponse.json({
      success: true,
      message: "userAccessCode set successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error setting userAccessCode:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to show all users with medallionUserId for debugging
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { medallionUserId: { not: null } },
          { medallionUserAccessCode: { not: null } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        medallionUserId: true,
        medallionUserAccessCode: true,
        medallionVerificationStatus: true,
        medallionIdentityVerified: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });

  } catch (error) {
    console.error("Error fetching users with medallionUserId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}