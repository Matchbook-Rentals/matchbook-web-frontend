import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

export async function POST() {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Clear Hospitable tokens from user account
    await prisma.user.update({
      where: { id: userId },
      data: {
        hospitableAccessToken: null,
        hospitableRefreshToken: null,
        hospitableAccountId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Disconnected from Hospitable successfully"
    });

  } catch (error) {
    console.error("Hospitable disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from Hospitable: " + (error as Error).message },
      { status: 500 }
    );
  }
}