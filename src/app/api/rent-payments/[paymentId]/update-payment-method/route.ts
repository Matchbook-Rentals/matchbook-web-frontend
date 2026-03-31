import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import stripe from "@/lib/stripe";
import { FEES } from "@/lib/fee-constants";

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

    const { paymentMethodId, applyToAll, bookingId } = await request.json();

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
        },
        charges: true,
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

    const isCard = paymentMethod.type === 'card';
    const existingCardFee = rentPayment.charges.find(
      (c) => c.category === 'CREDIT_CARD_FEE' && c.isApplied
    );

    // Calculate base amount (all applied charges except credit card fee)
    const baseAmountCents = rentPayment.charges
      .filter((c) => c.category !== 'CREDIT_CARD_FEE' && c.isApplied)
      .reduce((sum, c) => sum + c.amount, 0) || Number(rentPayment.baseAmount || rentPayment.amount);

    let newTotalAmount = baseAmountCents;
    let cardFeeAmount = 0;

    if (isCard && !existingCardFee) {
      // Switching TO card — add credit card fee
      const totalWithFee = baseAmountCents / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
      cardFeeAmount = Math.round(totalWithFee - baseAmountCents);
      newTotalAmount = baseAmountCents + cardFeeAmount;

      await prisma.rentPaymentCharge.create({
        data: {
          rentPaymentId: params.paymentId,
          category: 'CREDIT_CARD_FEE',
          amount: cardFeeAmount,
          isApplied: true,
          metadata: {
            rate: FEES.CREDIT_CARD_FEE.PERCENTAGE * 100,
            baseAmount: baseAmountCents,
            calculation: 'self_inclusive',
          },
        },
      });
    } else if (!isCard && existingCardFee) {
      // Switching TO bank — remove credit card fee
      await prisma.rentPaymentCharge.update({
        where: { id: existingCardFee.id },
        data: {
          isApplied: false,
          removedAt: new Date(),
        },
      });
      newTotalAmount = baseAmountCents;
    } else if (isCard && existingCardFee) {
      // Card to card — fee stays, total unchanged
      newTotalAmount = baseAmountCents + existingCardFee.amount;
      cardFeeAmount = existingCardFee.amount;
    }

    // Update the payment method and recalculate totals
    const updatedPayment = await prisma.rentPayment.update({
      where: { id: params.paymentId },
      data: {
        stripePaymentMethodId: paymentMethodId,
        totalAmount: newTotalAmount,
        amount: newTotalAmount, // Legacy field
      },
    });

    // Apply to all future unpaid payments in this booking
    let updatedFutureCount = 0;
    if (applyToAll && bookingId) {
      const futurePayments = await prisma.rentPayment.findMany({
        where: {
          bookingId,
          id: { not: params.paymentId },
          isPaid: false,
          status: { in: ['PENDING', 'FAILED'] },
        },
        include: { charges: true },
      });

      for (const fp of futurePayments) {
        const fpExistingCardFee = fp.charges.find(
          (c) => c.category === 'CREDIT_CARD_FEE' && c.isApplied
        );
        const fpBaseAmount = fp.charges
          .filter((c) => c.category !== 'CREDIT_CARD_FEE' && c.isApplied)
          .reduce((sum, c) => sum + c.amount, 0) || Number(fp.baseAmount || fp.amount);

        let fpNewTotal = fpBaseAmount;
        if (isCard && !fpExistingCardFee) {
          // Add card fee
          const fpTotalWithFee = fpBaseAmount / (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
          const fpCardFee = Math.round(fpTotalWithFee - fpBaseAmount);
          fpNewTotal = fpBaseAmount + fpCardFee;
          await prisma.rentPaymentCharge.create({
            data: {
              rentPaymentId: fp.id,
              category: 'CREDIT_CARD_FEE',
              amount: fpCardFee,
              isApplied: true,
              metadata: { rate: FEES.CREDIT_CARD_FEE.PERCENTAGE * 100, baseAmount: fpBaseAmount, calculation: 'self_inclusive' },
            },
          });
        } else if (!isCard && fpExistingCardFee) {
          // Remove card fee
          await prisma.rentPaymentCharge.update({
            where: { id: fpExistingCardFee.id },
            data: { isApplied: false, removedAt: new Date() },
          });
        } else if (isCard && fpExistingCardFee) {
          fpNewTotal = fpBaseAmount + fpExistingCardFee.amount;
        }

        await prisma.rentPayment.update({
          where: { id: fp.id },
          data: {
            stripePaymentMethodId: paymentMethodId,
            totalAmount: fpNewTotal,
            amount: fpNewTotal,
          },
        });
        updatedFutureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        totalAmount: newTotalAmount,
        baseAmount: baseAmountCents,
        cardFeeAmount: isCard ? cardFeeAmount : 0,
        hasCardFee: isCard,
      },
      updatedFuturePayments: updatedFutureCount,
    });

  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}
