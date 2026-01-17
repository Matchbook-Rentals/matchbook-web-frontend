import { Prisma } from '@prisma/client';

/**
 * Utility function to generate scheduled rent payments with pro-rating
 * Calculates first and last month pro-rated amounts based on actual days
 */
export function generateRentPayments(
  bookingId: string,
  monthlyRent: number,
  startDate: Date,
  endDate: Date,
  stripePaymentMethodId: string
): Prisma.RentPaymentCreateManyInput[] {
  const payments: Prisma.RentPaymentCreateManyInput[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Start from the first of the month after start date (or same month if starts on 1st)
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);

  // If booking starts after the 1st, add a pro-rated payment for the partial month
  if (start.getDate() > 1) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const daysFromStart = daysInMonth - start.getDate() + 1;
    const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);

    payments.push({
      bookingId,
      amount: proRatedAmount,
      dueDate: start,
      stripePaymentMethodId,
      paymentAuthorizedAt: new Date(),
      type: 'MONTHLY_RENT',
    });

    // Move to next month for regular payments
    currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }

  // Generate monthly payments on the 1st of each month
  while (currentDate <= end) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Check if this is the last month and we need pro-rating
    if (monthEnd > end && end.getDate() < monthEnd.getDate()) {
      const daysInMonth = monthEnd.getDate();
      const daysToEnd = end.getDate();
      const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth);

      payments.push({
        bookingId,
        amount: proRatedAmount,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
      });
    }

    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return payments;
}
