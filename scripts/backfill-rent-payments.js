#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Utility function to generate scheduled rent payments with pro-rating
function generateRentPayments(
  bookingId,
  monthlyRent,
  startDate,
  endDate,
  stripePaymentMethodId
) {
  const payments = [];
  
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
        paymentAuthorizedAt: new Date(),
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: new Date(),
      });
    }
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  return payments;
}

async function backfillRentPayments() {
  try {
    console.log('🔍 Checking for bookings without rent payments...');
    
    // Find bookings that don't have any rent payments
    const bookingsWithoutPayments = await prisma.booking.findMany({
      where: {
        rentPayments: {
          none: {}
        }
      },
      include: {
        match: {
          select: {
            stripePaymentMethodId: true
          }
        },
        rentPayments: true
      }
    });

    console.log(`📊 Found ${bookingsWithoutPayments.length} bookings without rent payments`);

    if (bookingsWithoutPayments.length === 0) {
      console.log('✅ All bookings already have rent payments scheduled');
      return;
    }

    let createdPayments = 0;

    for (const booking of bookingsWithoutPayments) {
      console.log(`\n📋 Processing booking ${booking.id}:`);
      console.log(`   Start Date: ${booking.startDate.toISOString().split('T')[0]}`);
      console.log(`   End Date: ${booking.endDate.toISOString().split('T')[0]}`);
      console.log(`   Monthly Rent: $${booking.monthlyRent || 'N/A'}`);
      
      // Check if we have required data
      if (!booking.monthlyRent) {
        console.log('   ⚠️  Skipping - no monthly rent specified');
        continue;
      }

      if (!booking.match?.stripePaymentMethodId) {
        console.log('   ⚠️  Skipping - no payment method found');
        continue;
      }

      // Generate rent payments
      const rentPayments = generateRentPayments(
        booking.id,
        booking.monthlyRent,
        booking.startDate,
        booking.endDate,
        booking.match.stripePaymentMethodId
      );

      console.log(`   💰 Generating ${rentPayments.length} rent payments`);

      // Create the payments
      if (rentPayments.length > 0) {
        await prisma.rentPayment.createMany({
          data: rentPayments
        });
        
        createdPayments += rentPayments.length;
        console.log(`   ✅ Created ${rentPayments.length} payments for booking ${booking.id}`);
        
        // Log payment details
        rentPayments.forEach((payment, index) => {
          console.log(`      Payment ${index + 1}: $${payment.amount} due ${payment.dueDate.toISOString().split('T')[0]}`);
        });
      }
    }

    console.log(`\n🎉 Backfill complete! Created ${createdPayments} rent payments for ${bookingsWithoutPayments.length} bookings`);

  } catch (error) {
    console.error('❌ Error backfilling rent payments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  backfillRentPayments()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillRentPayments };