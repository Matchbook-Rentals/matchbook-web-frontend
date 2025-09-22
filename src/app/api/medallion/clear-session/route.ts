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

    // Clear the session token to reset verification state
    await prisma.user.update({
      where: { id: userId },
      data: {
        medallionSessionToken: null,
      },
    });

    console.log(`🧹 Cleared Medallion session token for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Session cleared successfully"
    });

  } catch (error) {
    console.error("Error clearing Medallion session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}