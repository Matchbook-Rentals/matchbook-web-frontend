import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

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

    // Get all users who have completed Medallion verification
    const verifiedUsers = await prisma.user.findMany({
      where: {
        medallionIdentityVerified: true,
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
      orderBy: {
        medallionVerificationCompletedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: verifiedUsers,
      count: verifiedUsers.length,
    });
  } catch (error) {
    console.error("Error fetching verified Medallion users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}