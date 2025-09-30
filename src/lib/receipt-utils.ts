import prisma from './prismadb';

// Generate a unique receipt number
export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCP-${timestamp}-${random}`;
}

// Calculate payment breakdown (matches the frontend logic)
export function calculatePaymentBreakdown(
  rentDueAtBooking: number,
  paymentMethodType?: string
) {
  const applicationFee = Math.round(rentDueAtBooking * 0.03 * 100) / 100;
  
  let processingFee = 0;
  let total = rentDueAtBooking + applicationFee;
  
  if (paymentMethodType === 'card') {
    // Credit card processing fee: 3% self-inclusive
    // Formula: totalAmount = baseAmount / (1 - 0.03)
    // See /docs/payment-spec.md for details
    const subtotalWithAppFee = rentDueAtBooking + applicationFee;
    const totalWithCardFee = subtotalWithAppFee / (1 - 0.03);
    processingFee = Math.round((totalWithCardFee - subtotalWithAppFee) * 100) / 100;
    total = Math.round(totalWithCardFee * 100) / 100;
  }
  
  return {
    rentDueAtBooking,
    applicationFee,
    processingFee,
    total
  };
}

// Convert dollars to cents for database storage
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars for display
export function toDollars(cents: number): number {
  return cents / 100;
}

// Create a payment receipt with itemized charges
export async function createPaymentReceipt(params: {
  userId: string;
  matchId?: string;
  bookingId?: string;
  paymentType: string;
  rentDueAtBooking: number;
  paymentMethodType?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  transactionStatus: string;
}) {
  const {
    userId,
    matchId,
    bookingId,
    paymentType,
    rentDueAtBooking,
    paymentMethodType,
    stripePaymentIntentId,
    stripeChargeId,
    transactionStatus
  } = params;

  const breakdown = calculatePaymentBreakdown(rentDueAtBooking, paymentMethodType);
  const receiptNumber = generateReceiptNumber();
  
  // Generate unique transaction number
  const transactionNumber = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // Create receipt and transaction in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the receipt
      const receipt = await tx.paymentReceipt.create({
        data: {
          receiptNumber,
          paymentType,
          totalAmount: toCents(breakdown.total),
          subtotalAmount: toCents(breakdown.rentDueAtBooking + breakdown.applicationFee),
          serviceFeeAmount: toCents(breakdown.processingFee),
          userId,
        }
      });

      // Create receipt items
      const receiptItems = [];
      
      // Rent due at booking
      receiptItems.push({
        receiptId: receipt.id,
        description: 'Rent Due At Booking',
        category: 'rent_due_at_booking',
        quantity: 1,
        unitPrice: toCents(breakdown.rentDueAtBooking),
        totalPrice: toCents(breakdown.rentDueAtBooking),
        taxable: false,
      });

      // Application fee
      receiptItems.push({
        receiptId: receipt.id,
        description: 'Application Fee (3%)',
        category: 'application_fee',
        quantity: 1,
        unitPrice: toCents(breakdown.applicationFee),
        totalPrice: toCents(breakdown.applicationFee),
        taxable: false,
      });

      // Processing fee (if applicable)
      if (breakdown.processingFee > 0) {
        receiptItems.push({
          receiptId: receipt.id,
          description: 'Processing Fee (3%)',
          category: 'processing_fee',
          quantity: 1,
          unitPrice: toCents(breakdown.processingFee),
          totalPrice: toCents(breakdown.processingFee),
          taxable: false,
        });
      }

      await tx.receiptItem.createMany({
        data: receiptItems
      });

      // Create payment transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          transactionNumber,
          stripePaymentIntentId,
          stripeChargeId,
          amount: toCents(breakdown.total),
          currency: 'usd',
          status: transactionStatus,
          paymentMethod: paymentMethodType || 'unknown',
          platformFeeAmount: toCents(breakdown.applicationFee),
          stripeFeeAmount: toCents(breakdown.processingFee),
          netAmount: toCents(breakdown.rentDueAtBooking),
          userId,
          matchId,
          bookingId,
          receiptId: receipt.id,
          processedAt: transactionStatus === 'succeeded' ? new Date() : null,
        }
      });

      return { receipt, transaction };
    });

    console.log(`Created receipt ${receiptNumber} for user ${userId}`);
    return result;

  } catch (error) {
    console.error('Error creating payment receipt:', error);
    throw error;
  }
}

// Get receipt with items for display
export async function getReceiptWithItems(receiptId: string) {
  return await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    include: {
      receiptItems: {
        orderBy: { category: 'asc' }
      },
      transactions: {
        orderBy: { createdAt: 'desc' }
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}

// Get all receipts for a user
export async function getUserReceipts(userId: string) {
  return await prisma.paymentReceipt.findMany({
    where: { userId },
    include: {
      receiptItems: {
        orderBy: { category: 'asc' }
      },
      transactions: {
        select: {
          status: true,
          processedAt: true,
          paymentMethod: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Update transaction status (for webhooks)
export async function updateTransactionStatus(
  stripePaymentIntentId: string,
  status: string,
  stripeChargeId?: string
) {
  return await prisma.paymentTransaction.updateMany({
    where: { stripePaymentIntentId },
    data: {
      status,
      stripeChargeId,
      processedAt: status === 'succeeded' ? new Date() : null,
      failedAt: status === 'failed' ? new Date() : null,
    }
  });
}