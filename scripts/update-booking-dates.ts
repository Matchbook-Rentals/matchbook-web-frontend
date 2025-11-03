import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const BOOKING_ID = 'e33573eb-04ea-462a-8819-d8464a7e597d';
const NEW_MOVE_IN_DATE = new Date('2025-11-01T00:00:00.000Z');
const NEW_MOVE_OUT_DATE = new Date('2026-01-01T00:00:00.000Z');
// Manually set monthly rent (in cents) - from the original payment records
const MANUAL_MONTHLY_RENT = 413105; // $4,131.05

// Utility function to generate scheduled rent payments with pro-rating
function generateRentPayments(
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
      totalAmount: proRatedAmount,
      dueDate: start,
      stripePaymentMethodId,
      paymentAuthorizedAt: new Date(),
      type: 'MONTHLY_RENT',
      status: 'PENDING',
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
        totalAmount: proRatedAmount,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
        status: 'PENDING',
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        totalAmount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
        type: 'MONTHLY_RENT',
        status: 'PENDING',
      });
    }

    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return payments;
}

async function main() {
  console.log('🔧 Starting booking date update process...');
  console.log(`   Booking ID: ${BOOKING_ID}`);
  console.log(`   New Move-In: ${NEW_MOVE_IN_DATE.toISOString()}`);
  console.log(`   New Move-Out: ${NEW_MOVE_OUT_DATE.toISOString()}`);

  // Step 1: Fetch the current booking
  const booking = await prisma.booking.findUnique({
    where: { id: BOOKING_ID },
    include: {
      rentPayments: {
        orderBy: { dueDate: 'asc' },
        include: {
          charges: true,
          paymentModifications: true,
        }
      },
      match: {
        select: {
          stripePaymentMethodId: true,
          monthlyRent: true,
        }
      }
    }
  });

  if (!booking) {
    console.error('❌ Booking not found!');
    process.exit(1);
  }

  console.log(`\n📊 Current booking details:`);
  console.log(`   Current Move-In: ${booking.startDate}`);
  console.log(`   Current Move-Out: ${booking.endDate}`);
  console.log(`   Monthly Rent: $${(booking.monthlyRent || 0) / 100}`);
  console.log(`   Current Rent Payments: ${booking.rentPayments.length}`);

  // Check if there's a payment method
  if (!booking.match?.stripePaymentMethodId) {
    console.error('❌ No Stripe payment method found for this booking!');
    process.exit(1);
  }

  // Check for security deposit
  const securityDeposit = booking.rentPayments.find(p => p.type === 'SECURITY_DEPOSIT');

  console.log(`\n🔍 Security deposit: ${securityDeposit ? `$${securityDeposit.amount / 100} (ID: ${securityDeposit.id})` : 'None'}`);

  // Step 2: Delete existing rent payments (excluding security deposit)
  console.log(`\n🗑️  Deleting existing rent payments (excluding security deposit)...`);

  const rentPaymentIdsToDelete = booking.rentPayments
    .filter(p => p.type !== 'SECURITY_DEPOSIT')
    .map(p => p.id);

  if (rentPaymentIdsToDelete.length > 0) {
    // Delete payment modifications first
    const deletedMods = await prisma.paymentModification.deleteMany({
      where: {
        rentPaymentId: {
          in: rentPaymentIdsToDelete
        }
      }
    });
    console.log(`   Deleted ${deletedMods.count} payment modifications`);

    // Delete rent payment charges
    const deletedCharges = await prisma.rentPaymentCharge.deleteMany({
      where: {
        rentPaymentId: {
          in: rentPaymentIdsToDelete
        }
      }
    });
    console.log(`   Deleted ${deletedCharges.count} rent payment charges`);

    // Delete rent payment failures
    const deletedFailures = await prisma.rentPaymentFailure.deleteMany({
      where: {
        rentPaymentId: {
          in: rentPaymentIdsToDelete
        }
      }
    });
    console.log(`   Deleted ${deletedFailures.count} rent payment failures`);

    // Delete the rent payments
    const deletedPayments = await prisma.rentPayment.deleteMany({
      where: {
        id: {
          in: rentPaymentIdsToDelete
        }
      }
    });
    console.log(`   Deleted ${deletedPayments.count} rent payments`);
  }

  // Step 3: Update the booking dates and monthly rent
  console.log(`\n📝 Updating booking dates and monthly rent...`);
  await prisma.booking.update({
    where: { id: BOOKING_ID },
    data: {
      startDate: NEW_MOVE_IN_DATE,
      endDate: NEW_MOVE_OUT_DATE,
      monthlyRent: MANUAL_MONTHLY_RENT,
    }
  });
  console.log('   ✅ Booking dates and monthly rent updated');

  // Also update the match's monthly rent if it exists
  if (booking.match) {
    await prisma.match.update({
      where: { id: booking.matchId },
      data: {
        monthlyRent: MANUAL_MONTHLY_RENT,
      }
    });
    console.log('   ✅ Match monthly rent updated');
  }

  // Step 4: Generate new rent payments
  console.log(`\n💰 Generating new rent payment schedule...`);
  const monthlyRent = MANUAL_MONTHLY_RENT || booking.match?.monthlyRent || booking.monthlyRent || 0;

  if (monthlyRent === 0) {
    console.error('❌ Monthly rent is 0! Cannot generate payments.');
    process.exit(1);
  }

  console.log(`   Using monthly rent: $${monthlyRent / 100}`);

  const newRentPayments = generateRentPayments(
    BOOKING_ID,
    monthlyRent,
    NEW_MOVE_IN_DATE,
    NEW_MOVE_OUT_DATE,
    booking.match!.stripePaymentMethodId!
  );

  console.log(`   Generated ${newRentPayments.length} new rent payments:`);
  newRentPayments.forEach((payment, index) => {
    console.log(`   ${index + 1}. ${payment.type} - $${payment.amount! / 100} due ${new Date(payment.dueDate).toLocaleDateString()}`);
  });

  // Step 5: Create the new rent payments
  console.log(`\n💾 Creating new rent payments in database...`);
  await prisma.rentPayment.createMany({
    data: newRentPayments
  });
  console.log('   ✅ New rent payments created');

  // Step 6: Verify the results
  console.log(`\n✅ Verification:`);
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: BOOKING_ID },
    include: {
      rentPayments: {
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          dueDate: true,
          amount: true,
          totalAmount: true,
          status: true,
          type: true
        }
      }
    }
  });

  console.log(`   Updated Move-In: ${updatedBooking?.startDate}`);
  console.log(`   Updated Move-Out: ${updatedBooking?.endDate}`);
  console.log(`   Total Rent Payments: ${updatedBooking?.rentPayments.length}`);
  console.log(`\n📋 All rent payments:`);
  updatedBooking?.rentPayments.forEach((payment, index) => {
    console.log(`   ${index + 1}. ${payment.type.padEnd(20)} - $${(payment.totalAmount || payment.amount) / 100} due ${new Date(payment.dueDate).toLocaleDateString()}`);
  });

  console.log(`\n🎉 Update complete!`);
}

main()
  .catch((error) => {
    console.error('❌ Error updating booking:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
