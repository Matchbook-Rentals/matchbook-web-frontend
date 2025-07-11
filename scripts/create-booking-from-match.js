const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBookingFromCompletedMatch() {
  const matchId = '28adfa53-1b82-43ba-8225-708c639ae47f';
  
  try {
    console.log('🔍 Fetching match data...');
    
    // Get the match with trip and listing data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: true,
        listing: true
      }
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    console.log('📋 Match found:', {
      id: match.id,
      tripId: match.tripId,
      listingId: match.listingId,
      monthlyRent: match.monthlyRent,
      paymentAuthorizedAt: match.paymentAuthorizedAt,
      landlordSignedAt: match.landlordSignedAt,
      tenantSignedAt: match.tenantSignedAt,
      paymentStatus: match.paymentStatus
    });

    // Verify this is a completed match
    if (!match.paymentAuthorizedAt) {
      throw new Error('Payment not authorized');
    }
    if (!match.landlordSignedAt) {
      throw new Error('Landlord has not signed');
    }
    if (!match.tenantSignedAt) {
      throw new Error('Tenant has not signed');
    }
    if (match.paymentStatus !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    // Check if booking already exists
    const existingBooking = await prisma.booking.findFirst({
      where: { matchId: matchId }
    });

    if (existingBooking) {
      console.log('⚠️  Booking already exists:', existingBooking.id);
      return existingBooking;
    }

    console.log('🎯 Trip details:', {
      startDate: match.trip.startDate,
      endDate: match.trip.endDate,
      userId: match.trip.userId
    });

    // Create the booking
    console.log('🚀 Creating booking...');
    const booking = await prisma.booking.create({
      data: {
        userId: match.trip.userId,
        listingId: match.listingId,
        tripId: match.tripId,
        matchId: match.id,
        startDate: match.trip.startDate,
        endDate: match.trip.endDate,
        monthlyRent: match.monthlyRent,
        status: 'confirmed'
      }
    });

    console.log('✅ Booking created successfully!');
    console.log('📊 Booking details:', {
      id: booking.id,
      userId: booking.userId,
      listingId: booking.listingId,
      matchId: booking.matchId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      monthlyRent: booking.monthlyRent,
      status: booking.status
    });

    // Generate rent payments schedule
    console.log('💰 Generating rent payment schedule...');
    const rentPayments = generateRentPayments(
      booking.id,
      match.monthlyRent,
      match.trip.startDate,
      match.trip.endDate,
      match.stripePaymentMethodId
    );

    if (rentPayments.length > 0) {
      await prisma.rentPayment.createMany({
        data: rentPayments
      });
      console.log(`📅 Created ${rentPayments.length} rent payments`);
    }

    return booking;

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

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
        paymentAuthorizedAt: null,
      });
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
      });
    }
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  return payments;
}

// Run the script
if (require.main === module) {
  createBookingFromCompletedMatch()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createBookingFromCompletedMatch };