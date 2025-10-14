import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import stripe from "@/lib/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // Verify the payment exists and belongs to the user
    const rentPayment = await prisma.rentPayment.findFirst({
      where: {
        id: params.paymentId,
        booking: {
          userId: userId
        }
      },
      include: {
        booking: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!rentPayment) {
      return NextResponse.json(
        { error: "Payment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify the payment method belongs to the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "User has no Stripe customer ID" },
        { status: 400 }
      );
    }

    // Verify the payment method exists and belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Payment method does not belong to this user" },
        { status: 403 }
      );
    }

    // Update the payment method for this rent payment
    const updatedPayment = await prisma.rentPayment.update({
      where: {
        id: params.paymentId
      },
      data: {
        stripePaymentMethodId: paymentMethodId
      }
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment
    });

  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}
