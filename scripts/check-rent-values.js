#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRentValues() {
  try {
    console.log('🔍 Checking rent payment values in database...\n');
    
    // Check the booking that we just created payments for
    const booking = await prisma.booking.findUnique({
      where: { id: "9ddd549a-93eb-4b25-b45b-3289b8105c97" },
      select: {
        id: true,
        monthlyRent: true,
        totalPrice: true,
        rentPayments: {
          select: {
            id: true,
            amount: true,
            dueDate: true
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('📋 Booking Details:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Monthly Rent (raw): ${booking.monthlyRent}`);
    console.log(`   Total Price (raw): ${booking.totalPrice}`);
    console.log(`   Number of rent payments: ${booking.rentPayments.length}\n`);

    console.log('💰 Rent Payments (raw values):');
    booking.rentPayments.forEach((payment, index) => {
      console.log(`   Payment ${index + 1}:`);
      console.log(`      Amount (raw): ${payment.amount}`);
      console.log(`      Due Date: ${payment.dueDate.toISOString().split('T')[0]}`);
    });

  } catch (error) {
    console.error('❌ Error checking rent values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRentValues();