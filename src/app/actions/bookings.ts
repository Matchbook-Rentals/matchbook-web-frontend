'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Booking, ListingUnavailability, Prisma, Notification  } from '@prisma/client'
import { createNotification } from './notifications'

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

// Create a new booking
// update the type to be a partial of booking
export async function createBooking(data: Prisma.BookingCreateInput): Promise<Booking> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First get the match to get the tripId and payment method
  const match = await prisma.match.findUnique({
    where: {
      id: data.matchId as string
    },
    include: {
      listing: true,
      trip: true
    }
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (!match.stripePaymentMethodId) {
    throw new Error('Payment method not found for this match');
  }

  if (!data.monthlyRent) {
    throw new Error('Monthly rent is required to generate payment schedule');
  }

  const booking = await prisma.booking.create({
    data: {
      ...data,
      userId,
      tripId: match.tripId, // Add the tripId from the match
    },
  });

  // Generate rent payments schedule
  const rentPayments = generateRentPayments(
    booking.id,
    data.monthlyRent as number,
    data.startDate as Date,
    data.endDate as Date,
    match.stripePaymentMethodId
  );

  // Create all rent payments
  if (rentPayments.length > 0) {
    await prisma.rentPayment.createMany({
      data: rentPayments
    });
  }

  const notificationData: Notification = {
    actionType: 'booking',
    actionId: booking.id,
    content: `You have a new booking for ${match?.listing.title} from ${match?.trip.startDate} to ${match?.trip.endDate}`,
    url: `/platform/host-dashboard/${match?.listing.id}?tab=bookings`,
    unread: true,
    userId: match?.listing.userId || null,
  }

  revalidatePath('/bookings');
  await createNotification(notificationData);

  return booking;
}

// Get a booking by ID
export async function getBooking(id: string): Promise<Booking | null> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return prisma.booking.findUnique({
    where: { id, userId },
  });
}

// Get all bookings for the current user
export async function getUserBookings() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          title: true,
          imageSrc: true
        }
      },
      trip: {
        select: {
          numAdults: true,
          numPets: true,
          numChildren: true
        }
      }
    }
  });
}

// Update a booking
export async function updateBooking(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const booking = await prisma.booking.update({
    where: { id, userId },
    data,
  });

  revalidatePath('/bookings');
  await createNotification({
    type: 'BOOKING_UPDATED',
    userId,
    bookingId: booking.id,
  });

  return booking;
}

// Delete a booking
export async function deleteBooking(id: string): Promise<void> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  await prisma.booking.delete({
    where: { id, userId },
  });

  revalidatePath('/bookings');
  await createNotification({
    type: 'BOOKING_DELETED',
    userId,
    bookingId: id,
  });
}

// Get all bookings for the current host's listings
export async function getHostBookings() {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for bookings');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching bookings for userId:', userId);

    const bookings = await prisma.booking.findMany({
      where: { 
        listing: {
          userId: userId // Get bookings where the listing belongs to the current user (host)
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true
          }
        },
        match: {
          include: {
            BoldSignLease: true,
            Lease: true
          }
        }
      }
    });

    console.log('Found bookings:', bookings.length);
    return bookings;
  } catch (error) {
    console.error('Error in getHostBookings:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}

// Get bookings for a specific listing (host must own the listing)
export async function getBookingsByListingId(listingId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('No userId found in auth for listing bookings');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching bookings for listingId:', listingId, 'userId:', userId);

    // First verify the listing belongs to the current user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing || listing.userId !== userId) {
      console.log('Unauthorized to view bookings for this listing');
      return []; // Return empty array instead of throwing error
    }

    const bookings = await prisma.booking.findMany({
      where: { 
        listingId: listingId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            imageSrc: true,
            streetAddress1: true,
            city: true,
            state: true,
            postalCode: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        trip: {
          select: {
            numAdults: true,
            numPets: true,
            numChildren: true
          }
        },
        match: {
          include: {
            BoldSignLease: true,
            Lease: true
          }
        }
      }
    });

    console.log('Found bookings for listing:', bookings.length);
    return bookings;
  } catch (error) {
    console.error('Error in getBookingsByListingId:', error);
    // Return empty array instead of throwing error to prevent page crash
    return [];
  }
}

