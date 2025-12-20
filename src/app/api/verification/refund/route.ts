import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prismadb";

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      console.log("❌ [Verification Refund] Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("\n" + "=".repeat(60));
    console.log("💸 VERIFICATION REFUND REQUESTED");
    console.log("=".repeat(60));
    console.log("👤 User ID:", userId);

    // Check if user has already received a refund (check most recent verification)
    const verification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (verification?.verificationRefundedAt) {
      console.log("❌ User has already received a refund");
      return NextResponse.json(
        {
          error: "ALREADY_REFUNDED",
          message: "You have already received a refund for verification",
        },
        { status: 400 }
      );
    }

    // Find the user's verification purchase
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        type: "matchbookVerification",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!purchase) {
      console.log("❌ No verification purchase found");
      return NextResponse.json(
        {
          error: "NO_PURCHASE",
          message: "No verification payment found to refund",
        },
        { status: 404 }
      );
    }

    // Extract paymentIntentId from metadata
    let paymentIntentId: string | null = null;

    if (purchase.metadata) {
      try {
        const metadata = typeof purchase.metadata === "string"
          ? JSON.parse(purchase.metadata)
          : purchase.metadata;
        paymentIntentId = metadata.paymentIntentId || null;
      } catch (e) {
        console.error("❌ Failed to parse purchase metadata:", e);
      }
    }

    if (!paymentIntentId) {
      console.log("❌ No payment intent ID found in purchase");
      return NextResponse.json(
        {
          error: "NO_PAYMENT_INTENT",
          message: "Payment information not found. Please contact support.",
        },
        { status: 400 }
      );
    }

    console.log("💳 Processing refund for payment intent:", paymentIntentId);

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    console.log("✅ Refund created:", refund.id, "Status:", refund.status);

    // Mark user as refunded (spam prevention)
    const existingVerification = await prisma.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingVerification) {
      await prisma.verification.update({
        where: { id: existingVerification.id },
        data: {
          verificationRefundedAt: new Date(),
          status: "FAILED",
        },
      });
    } else {
      await prisma.verification.create({
        data: {
          userId,
          verificationRefundedAt: new Date(),
          status: "FAILED",
        },
      });
    }

    console.log("✅ Verification record updated with refund timestamp");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error: any) {
    console.error("❌ [Verification Refund] Error:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.message?.includes("already been refunded")) {
        return NextResponse.json(
          {
            error: "ALREADY_REFUNDED",
            message: "This payment has already been refunded",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "REFUND_FAILED",
        message: "Failed to process refund. Please contact support.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
